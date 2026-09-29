import { ModelOption, ProviderId } from '../../types';
import { AIProviderAdapter, GenerateResult, StreamParams, ValidationResult } from './types';

export class CustomOpenAIProviderAdapter implements AIProviderAdapter {
  id: ProviderId = 'custom';
  name = 'Custom (OpenAI Compatible)';
  tagline = 'Connect any OpenAI-compatible API: Ollama, vLLM, LM Studio, DeepSeek, xAI, Mistral';
  defaultModel = 'custom-model-1';
  keyPlaceholder = 'Custom API Key or Bearer Token';
  websiteUrl = 'https://platform.openai.com/docs/api-reference';
  consoleUrl = 'http://localhost:11434';

  models: ModelOption[] = [
    {
      id: 'custom-model-1',
      name: 'Custom Model (Base URL Defined)',
      provider: 'custom',
      status: 'Active',
      category: 'recommended',
      contextLength: 128000,
      supportsText: true,
      supportsImage: false,
      supportsCode: true,
      promptPricePerM: 0.20,
      completionPricePerM: 0.50,
      description: 'Custom endpoint specified via Base URL'
    }
  ];

  constructor(customId: ProviderId = 'custom', customName = 'Custom Provider') {
    this.id = customId;
    this.name = customName;
  }

  async validateApiKey(apiKey: string, baseUrl?: string): Promise<ValidationResult> {
    try {
      const res = await fetch('/api/ai/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'custom', apiKey, baseUrl })
      });
      if (res.ok) {
        const data = await res.json();
        return {
          valid: !!data.valid,
          error: data.error
        };
      }
    } catch {}

    // Direct browser query fallback
    try {
      const targetUrl = (baseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '') + '/models';
      const headers: Record<string, string> = {};
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      const directRes = await fetch(targetUrl, { headers });
      if (!directRes.ok) {
        return { valid: false, error: `HTTP ${directRes.status}: Unable to connect to ${targetUrl}` };
      }
      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Custom validation failed' };
    }
  }

  async listModels(apiKey?: string, baseUrl?: string): Promise<ModelOption[]> {
    try {
      const res = await fetch('/api/ai/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'custom', apiKey, baseUrl })
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.models) && json.models.length > 0) {
          this.models = json.models.map((m: any) => ({
            ...m,
            provider: this.id
          }));
          return this.models;
        }
      }
    } catch {}

    // Direct browser query fallback
    try {
      const targetUrl = (baseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '') + '/models';
      const headers: Record<string, string> = {};
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      const directRes = await fetch(targetUrl, { headers });
      if (directRes.ok) {
        const data = await directRes.json();
        const rawList = data.data || data.models || [];
        const dynamicModels: ModelOption[] = rawList.map((m: any) => {
          const id = m.id || m.name;
          return {
            id,
            name: id,
            provider: this.id,
            status: 'Active' as const,
            contextLength: 128000,
            supportsText: true,
            supportsImage: false,
            supportsCode: true,
            description: `Model retrieved from ${targetUrl}`
          };
        });
        if (dynamicModels.length > 0) {
          this.models = dynamicModels;
          return this.models;
        }
      }
    } catch {}

    return this.models;
  }

  async streamText(params: StreamParams): Promise<GenerateResult> {
    const { model, messages, apiKey, baseUrl, temperature, maxTokens, onChunk, signal } = params;

    const res = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: this.id,
        model,
        messages,
        apiKey,
        baseUrl,
        temperature,
        maxTokens
      }),
      signal
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Custom Provider Stream Error (${res.status}): ${err}`);
    }

    if (!res.body) {
      throw new Error('No stream body received');
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
