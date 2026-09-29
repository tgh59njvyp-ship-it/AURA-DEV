import { ModelOption } from '../../types';
import { updateDynamicPricing } from '../../utils/pricing';
import { AIProviderAdapter, GenerateResult, StreamParams, ValidationResult } from './types';

export class OpenRouterProviderAdapter implements AIProviderAdapter {
  id = 'openrouter' as const;
  name = 'OpenRouter';
  tagline = 'Universal gateway to 200+ models with dynamic pricing & free tiers';
  defaultModel = 'anthropic/claude-3.5-sonnet';
  keyPlaceholder = 'sk-or-v1-...';
  websiteUrl = 'https://openrouter.ai';
  consoleUrl = 'https://openrouter.ai/keys';

  // Seed default models while live catalog loads
  models: ModelOption[] = [
    {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet (OpenRouter)',
      provider: 'openrouter',
      category: 'recommended',
      contextLength: 200000,
      promptPricePerM: 3.00,
      completionPricePerM: 15.00,
      description: 'Gold-standard coding and software architecture model via OpenRouter.'
    },
    {
      id: 'deepseek/deepseek-r1',
      name: 'DeepSeek R1 (OpenRouter)',
      provider: 'openrouter',
      category: 'reasoning',
      contextLength: 128000,
      promptPricePerM: 0.55,
      completionPricePerM: 2.19,
      description: 'Open-weights reasoning model with chain-of-thought verification.'
    },
    {
      id: 'meta-llama/llama-3.3-70b-instruct',
      name: 'Llama 3.3 70B Instruct',
      provider: 'openrouter',
      category: 'popular',
      contextLength: 131072,
      promptPricePerM: 0.35,
      completionPricePerM: 0.40,
      description: 'Meta flagship open model with state-of-the-art coding abilities.'
    },
    {
      id: 'google/gemini-2.0-flash-001',
      name: 'Gemini 2.0 Flash (OpenRouter)',
      provider: 'openrouter',
      category: 'fast',
      contextLength: 1048576,
      promptPricePerM: 0.10,
      completionPricePerM: 0.40,
      description: 'Extremely fast 1M context model.'
    },
    {
      id: 'deepseek/deepseek-chat',
      name: 'DeepSeek V3 (OpenRouter)',
      provider: 'openrouter',
      category: 'coding',
      contextLength: 128000,
      promptPricePerM: 0.14,
      completionPricePerM: 0.28,
      description: 'Exceptional open coder with unmatched cost-efficiency.'
    },
    {
      id: 'qwen/qwen-2.5-72b-instruct',
      name: 'Qwen 2.5 72B Instruct',
      provider: 'openrouter',
      category: 'popular',
      contextLength: 131072,
      promptPricePerM: 0.35,
      completionPricePerM: 0.40,
      description: 'Top-tier multilingual and fullstack coding model.'
    },
    {
      id: 'meta-llama/llama-3.2-3b-instruct:free',
      name: 'Llama 3.2 3B Instruct (Free)',
      provider: 'openrouter',
      category: 'free',
      contextLength: 131072,
      promptPricePerM: 0.00,
      completionPricePerM: 0.00,
      description: 'Completely free tier model on OpenRouter.'
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
        meta: data.data
      };
    } catch (err: any) {
      return { valid: false, error: err.message || 'OpenRouter validation failed' };
    }
  }

  async fetchDynamicModels(): Promise<ModelOption[]> {
    try {
      const res = await fetch('/api/ai/openrouter-models');
      if (!res.ok) return this.models;
      const json = await res.json();
      const rawList = json?.data || [];

      const parsed: ModelOption[] = rawList.slice(0, 150).map((m: any) => {
        const promptPrice = parseFloat(m.pricing?.prompt || '0');
        const compPrice = parseFloat(m.pricing?.completion || '0');
        const promptPerM = promptPrice * 1_000_000;
        const compPerM = compPrice * 1_000_000;

        // Register dynamic pricing
        updateDynamicPricing(m.id, promptPrice, compPrice);

        let category: ModelOption['category'] = 'popular';
        if (promptPerM === 0 && compPerM === 0) category = 'free';
        else if (m.id.includes('r1') || m.id.includes('o1') || m.id.includes('reasoner')) category = 'reasoning';
        else if (m.id.includes('code') || m.id.includes('sonnet')) category = 'coding';
        else if (m.id.includes('flash') || m.id.includes('mini') || m.id.includes('8b')) category = 'fast';

        return {
          id: m.id,
          name: m.name || m.id,
          provider: 'openrouter',
          category,
          contextLength: m.context_length || 128000,
          promptPricePerM: Number(promptPerM.toFixed(4)),
          completionPricePerM: Number(compPerM.toFixed(4)),
          description: m.description ? m.description.slice(0, 160) + '...' : `OpenRouter model (${m.id})`
        };
      });

      if (parsed.length > 0) {
        this.models = parsed;
      }
      return this.models;
    } catch {
      return this.models;
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
      throw new Error(`OpenRouter Stream Error (${res.status}): ${err}`);
    }

    if (!res.body) {
      throw new Error('No stream body returned from OpenRouter proxy');
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
            if (e.message && (e.message.includes('API key') || e.message.includes('credits'))) throw e;
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
