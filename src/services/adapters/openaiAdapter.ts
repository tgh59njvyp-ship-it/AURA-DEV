import { ModelOption } from '../../types';
import { AIProviderAdapter, GenerateResult, StreamParams, ValidationResult } from './types';

export class OpenAIProviderAdapter implements AIProviderAdapter {
  id = 'openai' as const;
  name = 'OpenAI';
  tagline = 'Industry standard frontier models for logic, coding and tool use';
  defaultModel = 'gpt-4o';
  keyPlaceholder = 'sk-proj-...';
  websiteUrl = 'https://openai.com';
  consoleUrl = 'https://platform.openai.com/api-keys';

  models: ModelOption[] = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      category: 'recommended',
      contextLength: 128000,
      promptPricePerM: 2.50,
      completionPricePerM: 10.00,
      description: 'Flagship omni model, exceptional across code, mathematics, and complex reasoning.'
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o mini',
      provider: 'openai',
      category: 'fast',
      contextLength: 128000,
      promptPricePerM: 0.15,
      completionPricePerM: 0.60,
      description: 'Fast, lightweight and affordable for routine tasks and quick prototyping.'
    },
    {
      id: 'o3-mini',
      name: 'o3-mini',
      provider: 'openai',
      category: 'reasoning',
      contextLength: 200000,
      promptPricePerM: 1.10,
      completionPricePerM: 4.40,
      description: 'Specialized deep reasoning model designed for competitive programming and STEM.'
    },
    {
      id: 'o1',
      name: 'o1',
      provider: 'openai',
      category: 'reasoning',
      contextLength: 200000,
      promptPricePerM: 15.00,
      completionPricePerM: 60.00,
      description: 'Full reasoning flagship model with extensive chain-of-thought.'
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
        error: data.error
      };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Validation request failed' };
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
      throw new Error(`OpenAI Stream Error (${res.status}): ${err}`);
    }

    if (!res.body) {
      throw new Error('No stream body returned from OpenAI proxy');
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
            if (e.message && (e.message.includes('API key') || e.message.includes('Rate limit'))) throw e;
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
