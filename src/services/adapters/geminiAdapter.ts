import { ModelOption } from '../../types';
import { AIProviderAdapter, GenerateResult, StreamParams, ValidationResult } from './types';

export class GeminiProviderAdapter implements AIProviderAdapter {
  id = 'gemini' as const;
  name = 'Google Gemini';
  tagline = 'Next-gen multimodal models with massive 1M+ context window';
  defaultModel = 'gemini-2.5-flash';
  keyPlaceholder = 'AIzaSy...';
  websiteUrl = 'https://ai.google.dev';
  consoleUrl = 'https://aistudio.google.com/app/apikey';

  models: ModelOption[] = [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'gemini',
      category: 'recommended',
      contextLength: 1048576,
      promptPricePerM: 0.15,
      completionPricePerM: 0.60,
      description: 'Ultra-fast, cost-effective multimodal model for high-frequency coding and chat.'
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'gemini',
      category: 'reasoning',
      contextLength: 1048576,
      promptPricePerM: 1.25,
      completionPricePerM: 5.00,
      description: 'State-of-the-art reasoning, deep code architecture, and multi-file project synthesis.'
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'gemini',
      category: 'fast',
      contextLength: 1048576,
      promptPricePerM: 0.075,
      completionPricePerM: 0.30,
      description: 'Lightweight and low latency for quick generation.'
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'gemini',
      category: 'reasoning',
      contextLength: 2097152,
      promptPricePerM: 1.25,
      completionPricePerM: 5.00,
      description: 'Massive 2M token context for whole-codebase understanding.'
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
      throw new Error(`Gemini Stream Error (${res.status}): ${err}`);
    }

    if (!res.body) {
      throw new Error('No stream body returned from Gemini proxy');
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
            if (e.message && e.message.includes('API key')) throw e;
          }
        }
      }
    }

    // Estimate tokens
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
