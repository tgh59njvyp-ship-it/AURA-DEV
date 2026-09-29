/**
 * Pricing rates per 1 Million tokens in USD ($)
 * Configurable structure, with ability to update rates dynamically from OpenRouter.
 */

export interface ModelPricing {
  promptUSDPerM: number;
  completionUSDPerM: number;
}

export const DEFAULT_PRICING_TABLE: Record<string, ModelPricing> = {
  // Google Gemini
  'gemini-2.5-flash': { promptUSDPerM: 0.15, completionUSDPerM: 0.60 },
  'gemini-2.5-pro': { promptUSDPerM: 1.25, completionUSDPerM: 5.00 },
  'gemini-1.5-flash': { promptUSDPerM: 0.075, completionUSDPerM: 0.30 },
  'gemini-1.5-pro': { promptUSDPerM: 1.25, completionUSDPerM: 5.00 },

  // OpenAI
  'gpt-4o': { promptUSDPerM: 2.50, completionUSDPerM: 10.00 },
  'gpt-4o-mini': { promptUSDPerM: 0.15, completionUSDPerM: 0.60 },
  'o3-mini': { promptUSDPerM: 1.10, completionUSDPerM: 4.40 },
  'o1': { promptUSDPerM: 15.00, completionUSDPerM: 60.00 },
  'gpt-4.5-preview': { promptUSDPerM: 75.00, completionUSDPerM: 150.00 },

  // Groq (Ultra low latency)
  'llama-3.3-70b-versatile': { promptUSDPerM: 0.59, completionUSDPerM: 0.79 },
  'llama-3.1-8b-instant': { promptUSDPerM: 0.05, completionUSDPerM: 0.08 },
  'mixtral-8x7b-32768': { promptUSDPerM: 0.24, completionUSDPerM: 0.24 },
  'qwen-2.5-32b': { promptUSDPerM: 0.35, completionUSDPerM: 0.40 },

  // Anthropic
  'claude-3-7-sonnet-20250219': { promptUSDPerM: 3.00, completionUSDPerM: 15.00 },
  'claude-3-5-sonnet-20241022': { promptUSDPerM: 3.00, completionUSDPerM: 15.00 },
  'claude-3-5-haiku-20241022': { promptUSDPerM: 0.80, completionUSDPerM: 4.00 },

  // DeepSeek
  'deepseek-chat': { promptUSDPerM: 0.14, completionUSDPerM: 0.28 },
  'deepseek-reasoner': { promptUSDPerM: 0.55, completionUSDPerM: 2.19 },

  // Mistral
  'mistral-large-latest': { promptUSDPerM: 2.00, completionUSDPerM: 6.00 },
  'codestral-latest': { promptUSDPerM: 0.30, completionUSDPerM: 0.90 }
};

// Dynamic rate cache (e.g. from OpenRouter API)
const dynamicPricingCache: Record<string, ModelPricing> = {};

export function updateDynamicPricing(modelId: string, promptPrice: number, completionPrice: number): void {
  dynamicPricingCache[modelId] = {
    promptUSDPerM: promptPrice * 1_000_000,
    completionUSDPerM: completionPrice * 1_000_000
  };
}

export function calculateCost(modelId: string, promptTokens: number, completionTokens: number): number {
  const pricing = dynamicPricingCache[modelId] || DEFAULT_PRICING_TABLE[modelId] || {
    promptUSDPerM: 0.5,
    completionUSDPerM: 1.5
  };

  const promptCost = (promptTokens / 1_000_000) * pricing.promptUSDPerM;
  const completionCost = (completionTokens / 1_000_000) * pricing.completionUSDPerM;
  return Number((promptCost + completionCost).toFixed(6));
}

export function formatCost(usd: number): string {
  if (usd <= 0) return '$0.00';
  if (usd < 0.001) return `<$0.001`;
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(3)}`;
}
