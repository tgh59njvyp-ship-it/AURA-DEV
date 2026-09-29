import { ModelOption } from '../../types';
import { AIProviderAdapter, GenerateResult, StreamParams, ValidationResult } from './types';

export class AnthropicProviderAdapter implements AIProviderAdapter {
  id = 'anthropic' as const;
  name = 'Anthropic Claude';
  tagline = 'Frontier reasoning, nuanced coding and deep context understanding';
  defaultModel = 'claude-3-5-sonnet-20241022';
  keyPlaceholder = 'sk-ant-api03-...';
  websiteUrl = 'https://anthropic.com';
  consoleUrl = 'https://console.anthropic.com/settings/keys';

  models: ModelOption[] = [
    {
      id: 'claude-3-7-sonnet-20250219',
      name: 'Claude 3.7 Sonnet',
      provider: 'anthropic',
      status: 'Active',
      category: 'recommended',
      contextLength: 200000,
      supportsText: true,
      supportsImage: true,
      supportsCode: true,
      promptPricePerM: 3.00,
      completionPricePerM: 15.00,
      description: 'Hybrid reasoning and instant response model with unmatched software engineering capability.'
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      status: 'Active',
      category: 'coding',
      contextLength: 200000,
      supportsText: true,
      supportsImage: true,
      supportsCode: true,
      promptPricePerM: 3.00,
      completionPricePerM: 15.00,
      description: 'Industry benchmark for code architecture, refactoring, and complex tool usage.'
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      provider: 'anthropic',
      status: 'Active',
      category: 'fast',
      contextLength: 200000,
      supportsText: true,
      supportsImage: true,
      supportsCode: true,
      promptPricePerM: 0.80,
      completionPricePerM: 4.00,
      description: 'Lightning-fast responses with Sonnet-level intelligence on common development tasks.'
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
      return { valid: false, error: err.message || 'Anthropic validation request failed' };
    }
  }

  async listModels(apiKey?: string): Promise<ModelOption[]> {
    try {
      const res = await fetch('/api/ai/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: this.id, apiKey })
      });
      if (!res.ok) return this.models;
      const json = await res.json();
      if (Array.isArray(json.models) && json.models.length > 0) {
        this.models = json.models;
      }
      return this.models;
    } catch {
      return this.models;
    }
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
      throw new Error(`Anthropic Stream Error (${res.status}): ${err}`);
    }

    if (!res.body) {
      throw new Error('No stream body returned from Anthropic proxy');
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
