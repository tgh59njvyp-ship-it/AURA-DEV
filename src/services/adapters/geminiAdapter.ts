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
      status: 'Active',
      category: 'recommended',
      contextLength: 1048576,
      inputTokenLimit: 1048576,
      outputTokenLimit: 8192,
      supportsText: true,
      supportsImage: true,
      supportsCode: true,
      promptPricePerM: 0.15,
      completionPricePerM: 0.60,
      description: 'Ultra-fast, cost-effective multimodal model for high-frequency coding and chat.'
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'gemini',
      status: 'Active',
      category: 'reasoning',
      contextLength: 1048576,
      inputTokenLimit: 1048576,
      outputTokenLimit: 8192,
      supportsText: true,
      supportsImage: true,
      supportsCode: true,
      promptPricePerM: 1.25,
      completionPricePerM: 5.00,
      description: 'State-of-the-art reasoning, deep code architecture, and multi-file project synthesis.'
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'gemini',
      status: 'Active',
      category: 'fast',
      contextLength: 1048576,
      inputTokenLimit: 1048576,
      outputTokenLimit: 8192,
      supportsText: true,
      supportsImage: true,
      supportsCode: true,
      promptPricePerM: 0.075,
      completionPricePerM: 0.30,
      description: 'Lightweight and low latency for quick generation.'
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'gemini',
      status: 'Active',
      category: 'reasoning',
      contextLength: 2097152,
      inputTokenLimit: 2097152,
      outputTokenLimit: 8192,
      supportsText: true,
      supportsImage: true,
      supportsCode: true,
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
      if (res.ok) {
        const data = await res.json();
        return {
          valid: !!data.valid,
          error: data.error,
          availableModels: data.models
        };
      }
    } catch {}

    // Direct browser validation fallback via official Gemini endpoint
    try {
      const directRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`
      );
      if (!directRes.ok) {
        const errJson = await directRes.json().catch(() => ({}));
        return {
          valid: false,
          error: (errJson as any)?.error?.message || `HTTP ${directRes.status}: Invalid Gemini API Key`
        };
      }
      const data = await directRes.json();
      const models = (data.models || []).map((m: any) => m.name.replace('models/', ''));
      return { valid: true, availableModels: models.slice(0, 15) };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Validation request failed' };
    }
  }

  async listModels(apiKey?: string): Promise<ModelOption[]> {
    try {
      const res = await fetch('/api/ai/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: this.id, apiKey })
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.models) && json.models.length > 0) {
          this.models = json.models;
          return this.models;
        }
      }
    } catch {}

    // Direct browser query fallback
    if (apiKey) {
      try {
        const directRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`
        );
        if (directRes.ok) {
          const data = await directRes.json();
          const dynamicModels: ModelOption[] = (data.models || [])
            .filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent') || m.name.includes('gemini'))
            .map((m: any) => {
              const id = m.name.replace('models/', '');
              const descLower = (m.description || '').toLowerCase();
              const isDeprecated = descLower.includes('deprecated') || descLower.includes('discontinued') || id.includes('deprecated');
              const isShutdown = descLower.includes('shutdown') || descLower.includes('retired');
              const isPreview = id.includes('preview') || id.includes('exp') || descLower.includes('preview');

              let status: 'Active' | 'Preview' | 'Deprecated' | 'Shutdown' = 'Active';
              if (isShutdown) status = 'Shutdown';
              else if (isDeprecated) status = 'Deprecated';
              else if (isPreview) status = 'Preview';

              return {
                id,
                name: m.displayName || id,
                provider: 'gemini' as const,
                status,
                contextLength: m.inputTokenLimit || 1048576,
                inputTokenLimit: m.inputTokenLimit,
                outputTokenLimit: m.outputTokenLimit,
                supportsText: true,
                supportsImage: id.includes('gemini') || descLower.includes('multimodal'),
                supportsCode: true,
                description: m.description || `Google Gemini formal model (${id})`
              };
            });

          if (dynamicModels.length > 0) {
            this.models = dynamicModels;
            return this.models;
          }
        }
      } catch {}
    }

    return this.models;
  }

  async streamText(params: StreamParams): Promise<GenerateResult> {
    const { model, messages, apiKey, temperature, maxTokens, onChunk, signal } = params;

    let res: Response | null = null;
    try {
      res = await fetch('/api/ai/stream', {
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
    } catch {}

    // If server proxy is not running or failed, stream directly to Gemini REST SSE
    if (!res || !res.ok) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey.trim()}&alt=sse`;
      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: temperature ?? 0.7,
            maxOutputTokens: maxTokens ?? 4096
          }
        }),
        signal
      });
    }

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
