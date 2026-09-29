import { ProviderId, ProviderConfig, ModelOption } from '../../types';
import { AIProviderAdapter } from './types';
import { GeminiProviderAdapter } from './geminiAdapter';
import { OpenAIProviderAdapter } from './openaiAdapter';
import { OpenRouterProviderAdapter } from './openRouterAdapter';
import { GroqProviderAdapter } from './groqAdapter';
import { AnthropicProviderAdapter } from './anthropicAdapter';
import { CustomOpenAIProviderAdapter } from './customAdapter';

// Instantiate core adapters
export const geminiAdapter = new GeminiProviderAdapter();
export const openaiAdapter = new OpenAIProviderAdapter();
export const openRouterAdapter = new OpenRouterProviderAdapter();
export const groqAdapter = new GroqProviderAdapter();
export const anthropicAdapter = new AnthropicProviderAdapter();
export const customAdapter = new CustomOpenAIProviderAdapter();

// Secondary providers that utilize OpenAI-compatible adapter
export const deepseekAdapter = new CustomOpenAIProviderAdapter('deepseek', 'DeepSeek');
deepseekAdapter.keyPlaceholder = 'sk-...';
deepseekAdapter.websiteUrl = 'https://deepseek.com';
deepseekAdapter.consoleUrl = 'https://platform.deepseek.com/api_keys';
deepseekAdapter.defaultModel = 'deepseek-chat';
deepseekAdapter.models = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    status: 'Active',
    category: 'coding',
    contextLength: 128000,
    supportsText: true,
    supportsImage: false,
    supportsCode: true,
    promptPricePerM: 0.14,
    completionPricePerM: 0.28,
    description: 'High-intelligence reasoning and code synthesis.'
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    status: 'Active',
    category: 'reasoning',
    contextLength: 128000,
    supportsText: true,
    supportsImage: false,
    supportsCode: true,
    promptPricePerM: 0.55,
    completionPricePerM: 2.19,
    description: 'Math, algorithm, and complex logic verification.'
  }
];

export const xaiAdapter = new CustomOpenAIProviderAdapter('xai', 'xAI Grok');
xaiAdapter.keyPlaceholder = 'xai-...';
xaiAdapter.websiteUrl = 'https://x.ai';
xaiAdapter.consoleUrl = 'https://console.x.ai';
xaiAdapter.defaultModel = 'grok-2-1212';
xaiAdapter.models = [
  {
    id: 'grok-2-1212',
    name: 'Grok 2',
    provider: 'xai',
    status: 'Active',
    category: 'recommended',
    contextLength: 131072,
    supportsText: true,
    supportsImage: true,
    supportsCode: true,
    promptPricePerM: 2.00,
    completionPricePerM: 10.00,
    description: 'Frontier reasoning and visual comprehension from xAI.'
  }
];

export const mistralAdapter = new CustomOpenAIProviderAdapter('mistral', 'Mistral AI');
mistralAdapter.keyPlaceholder = '...';
mistralAdapter.websiteUrl = 'https://mistral.ai';
mistralAdapter.consoleUrl = 'https://console.mistral.ai';
mistralAdapter.defaultModel = 'mistral-large-latest';
mistralAdapter.models = [
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large 2',
    provider: 'mistral',
    status: 'Active',
    category: 'recommended',
    contextLength: 128000,
    supportsText: true,
    supportsImage: false,
    supportsCode: true,
    promptPricePerM: 2.00,
    completionPricePerM: 6.00,
    description: 'Top-tier multilingual, reasoning, and code capabilities.'
  },
  {
    id: 'codestral-latest',
    name: 'Codestral',
    provider: 'mistral',
    status: 'Active',
    category: 'coding',
    contextLength: 256000,
    supportsText: true,
    supportsImage: false,
    supportsCode: true,
    promptPricePerM: 0.30,
    completionPricePerM: 0.90,
    description: 'Specialized 256k context model for code generation and refactoring.'
  }
];

export const cerebrasAdapter = new CustomOpenAIProviderAdapter('cerebras', 'Cerebras');
cerebrasAdapter.keyPlaceholder = 'csk-...';
cerebrasAdapter.websiteUrl = 'https://cerebras.ai';
cerebrasAdapter.consoleUrl = 'https://cloud.cerebras.ai';
cerebrasAdapter.defaultModel = 'llama3.1-70b';
cerebrasAdapter.models = [
  {
    id: 'llama3.1-70b',
    name: 'Llama 3.1 70B (Cerebras CS-3)',
    provider: 'cerebras',
    status: 'Active',
    category: 'fast',
    contextLength: 128000,
    supportsText: true,
    supportsImage: false,
    supportsCode: true,
    promptPricePerM: 0.60,
    completionPricePerM: 0.60,
    description: 'World record inference speeds up to 2100 tokens/sec on wafer-scale engine.'
  }
];

export const githubAdapter = new CustomOpenAIProviderAdapter('github', 'GitHub Models');
githubAdapter.keyPlaceholder = 'ghp_...';
githubAdapter.websiteUrl = 'https://github.com/marketplace/models';
githubAdapter.consoleUrl = 'https://github.com/settings/tokens';
githubAdapter.defaultModel = 'gpt-4o';
githubAdapter.models = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o (GitHub Models)',
    provider: 'github',
    status: 'Active',
    category: 'recommended',
    contextLength: 128000,
    supportsText: true,
    supportsImage: true,
    supportsCode: true,
    promptPricePerM: 0.0,
    completionPricePerM: 0.0,
    description: 'Free prototyping tier for developers with GitHub accounts.'
  }
];

export const ADAPTER_REGISTRY: Record<ProviderId, AIProviderAdapter> = {
  gemini: geminiAdapter,
  openai: openaiAdapter,
  openrouter: openRouterAdapter,
  groq: groqAdapter,
  anthropic: anthropicAdapter,
  deepseek: deepseekAdapter,
  xai: xaiAdapter,
  mistral: mistralAdapter,
  cerebras: cerebrasAdapter,
  github: githubAdapter,
  custom: customAdapter
};

export function getAdapter(providerId: ProviderId): AIProviderAdapter {
  return ADAPTER_REGISTRY[providerId] || customAdapter;
}

/**
 * Auto-Router Logic:
 * Inspects connected providers (only those where user configured an API key)
 * and picks the best suited model based on task intent:
 * - Simple/short or fast edits: Groq (Llama 3.3/8B) or Gemini 2.5 Flash
 * - Complex code or multi-file build: Gemini 2.5 Pro or GPT-4o or Claude 3.5 Sonnet
 * - Deep reasoning / algorithmic: DeepSeek R1, o3-mini, Gemini 2.5 Pro
 */
export function selectAutoModel(
  userQuery: string,
  connectedProviders: ProviderConfig[]
): { provider: ProviderId; model: string; reason: string } | null {
  const active = connectedProviders.filter((p) => p.isConnected && p.apiKey.trim() !== '');
  if (active.length === 0) return null;

  const queryLower = userQuery.toLowerCase();
  const isComplexCodeOrBuild =
    queryLower.includes('build') ||
    queryLower.includes('project') ||
    queryLower.includes('website') ||
    queryLower.includes('app') ||
    queryLower.includes('architecture') ||
    queryLower.includes('refactor') ||
    queryLower.includes('react') ||
    queryLower.includes('typescript') ||
    queryLower.includes('ポケモン') ||
    queryLower.includes('作って');

  const isDeepReasoning =
    queryLower.includes('prove') ||
    queryLower.includes('why') ||
    queryLower.includes('math') ||
    queryLower.includes('algorithm') ||
    queryLower.includes('debug memory leak') ||
    queryLower.includes('concurrency');

  const hasProvider = (id: ProviderId) => active.find((p) => p.id === id);

  // 1. Complex code / build
  if (isComplexCodeOrBuild) {
    if (hasProvider('gemini')) {
      return {
        provider: 'gemini',
        model: 'gemini-2.5-pro',
        reason: 'Selected Gemini 2.5 Pro for deep code synthesis and large context capacity.'
      };
    }
    if (hasProvider('anthropic')) {
      return {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        reason: 'Selected Claude 3.5 Sonnet for world-class frontend and software architecture.'
      };
    }
    if (hasProvider('openai')) {
      return {
        provider: 'openai',
        model: 'gpt-4o',
        reason: 'Selected GPT-4o for robust multimodal and code generation.'
      };
    }
    if (hasProvider('openrouter')) {
      return {
        provider: 'openrouter',
        model: 'anthropic/claude-3.5-sonnet',
        reason: 'Selected Claude 3.5 Sonnet via OpenRouter.'
      };
    }
  }

  // 2. Deep Reasoning
  if (isDeepReasoning) {
    if (hasProvider('openai')) {
      return {
        provider: 'openai',
        model: 'o3-mini',
        reason: 'Selected o3-mini for STEM and algorithmic reasoning.'
      };
    }
    if (hasProvider('gemini')) {
      return {
        provider: 'gemini',
        model: 'gemini-2.5-pro',
        reason: 'Selected Gemini 2.5 Pro for complex logical analysis.'
      };
    }
    if (hasProvider('openrouter')) {
      return {
        provider: 'openrouter',
        model: 'deepseek/deepseek-r1',
        reason: 'Selected DeepSeek R1 for chain-of-thought verification.'
      };
    }
  }

  // 3. Fast / Standard (prefer ultra-low latency Groq if connected)
  if (hasProvider('groq')) {
    return {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      reason: 'Selected Groq Llama 3.3 70B for near-instant 300+ tok/s response.'
    };
  }
  if (hasProvider('gemini')) {
    return {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      reason: 'Selected Gemini 2.5 Flash for high-speed responsiveness.'
    };
  }
  if (hasProvider('openai')) {
    return {
      provider: 'openai',
      model: 'gpt-4o-mini',
      reason: 'Selected GPT-4o mini for balanced speed and intelligence.'
    };
  }

  // Fallback to first connected provider's default model
  const first = active[0];
  return {
    provider: first.id,
    model: first.defaultModel,
    reason: `Selected ${first.name} (${first.defaultModel}) based on active API key.`
  };
}
