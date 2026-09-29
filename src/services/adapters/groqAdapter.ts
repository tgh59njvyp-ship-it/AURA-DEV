import { ModelOption } from '../../types';
import { AIProviderAdapter, GenerateResult, StreamParams, ValidationResult } from './types';

export class GroqProviderAdapter implements AIProviderAdapter {
  id = 'groq' as const;
  name = 'Groq';
  tagline = 'LPU™ inference engine delivering extreme 500+ tokens/sec speeds';
  defaultModel = 'llama-3.3-70b-versatile';
  keyPlaceholder = 'gsk_...';
  websiteUrl = 'https://groq.com';
  consoleUrl = 'https://console.groq.com/keys';

  models: ModelOption[] = [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B Versatile',
      provider: 'groq',
      category: 'recommended',
      contextLength: 128000,
      promptPricePerM: 0.59,
      completionPricePerM: 0.79,
      description: 'Ultra-fast 70B model with high intelligence and near-instant time-to-first-token.'
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B Instant',
      provider: 'groq',
      category: 'fast',
      contextLength: 128000,
      promptPricePerM: 0.05,
      completionPricePerM: 0.08,
      description: 'Blistering 800+ tok/s speed for lightning-fast autocomplete and edits.'
    },
    {
      id: 'qwen-2.5-32b',
      name: 'Qwen 2.5 32B',
      provider: 'groq',
      category: 'coding',
      contextLength: 128000,
      promptPricePerM: 0.35,
      completionPricePerM: 0.40,
      description: 'Exceptional code generation and multilingual instruction following.'
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'Mixtral 8x7B',
      provider: 'groq',
      category: 'popular',
      contextLength: 32768,
      promptPricePerM: 0.24,
      completionPricePerM: 0.24,
      description: 'High-speed mixture-of-experts model.'
    }
  ];

  async validateApiKey(apiKey: string): Promise<ValidationResult> {
    try {
      const res = await fetch('/api/ai/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: this.id, apiKey })
      });
      const data = await res.json();
      return {
        valid: !!data.valid,
        error: data.error,
        availableModels: data.models
      };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Groq validation request failed' };
    }
  }

  async listModels(): Promise<ModelOption[]> {
    return this.models;
  }

  async streamText(params: StreamParams): Promise<GenerateResult> {
    const { model, messages, apiKey, temperature, maxTokens, onChunk, signal } = params;

    const res = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: this.id,
        model,
        messages,
        apiKey,
        temperature,
        maxTokens
      }),
      signal
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq Stream Error (${res.status}): ${err}`);
    }

    if (!res.body) {
      throw new Error('No stream body returned from Groq proxy');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.content) {
              accumulated += parsed.content;
              onChunk(parsed.content);
            }
          } catch (e: any) {
            if (e.message && (e.message.includes('API key') || e.message.includes('rate'))) throw e;
          }
        }
      }
    }

    const promptLen = messages.reduce((acc, m) => acc + m.content.length, 0);
    const promptTokens = Math.max(1, Math.round(promptLen / 4));
    const completionTokens = Math.max(1, Math.round(accumulated.length / 4));

    return {
      content: accumulated,
      promptTokens,
      completionTokens
    };
  }
}
