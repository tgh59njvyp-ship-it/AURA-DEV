import { ModelOption, ProviderId } from '../../types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  availableModels?: string[];
  meta?: any;
}

export interface StreamParams {
  model: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

export interface GenerateResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
}

export interface AIProviderAdapter {
  id: ProviderId;
  name: string;
  tagline: string;
  defaultModel: string;
  keyPlaceholder: string;
  websiteUrl: string;
  consoleUrl: string;
  models: ModelOption[];
  validateApiKey(apiKey: string, baseUrl?: string): Promise<ValidationResult>;
  listModels(apiKey?: string, baseUrl?: string): Promise<ModelOption[]>;
  streamText(params: StreamParams): Promise<GenerateResult>;
}
