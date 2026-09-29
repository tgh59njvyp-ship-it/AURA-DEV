export type ProviderId =
  | 'gemini'
  | 'openai'
  | 'openrouter'
  | 'groq'
  | 'anthropic'
  | 'mistral'
  | 'cerebras'
  | 'xai'
  | 'deepseek'
  | 'github'
  | 'custom';

export type ModelCategory = 'recommended' | 'fast' | 'reasoning' | 'coding' | 'free' | 'popular' | 'vision';

export interface ModelOption {
  id: string;
  name: string;
  provider: ProviderId;
  category?: ModelCategory;
  contextLength?: number;
  promptPricePerM?: number; // USD per 1M tokens
  completionPricePerM?: number; // USD per 1M tokens
  description?: string;
  isAvailable?: boolean;
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  tagline: string;
  websiteUrl: string;
  consoleUrl: string;
  apiKey: string;
  baseUrl?: string;
  isConnected: boolean;
  isValidating?: boolean;
  lastTested?: string;
  errorMessage?: string;
  defaultModel: string;
  models: ModelOption[];
  iconName: string;
  keyPlaceholder: string;
  isCustom?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'code' | 'text' | 'document';
  size: number;
  content: string; // Base64 or plain text
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  providerUsed?: ProviderId;
  attachments?: Attachment[];
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost?: number;
  };
  isStreaming?: boolean;
  error?: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isModified?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: 'web' | 'react' | 'node' | 'tool' | 'custom';
  files: ProjectFile[];
  activeFileId: string;
  selectedModel: string;
  selectedProvider: ProviderId;
  chatHistory: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  systemPrompt: string;
  provider: ProviderId;
  model: string;
  temperature: number;
  tools: ('web_search' | 'code_generation' | 'file_operations' | 'json_formatting' | 'project_ops')[];
  knowledge: { id: string; name: string; content: string }[];
  memoryEnabled: boolean;
  createdAt: number;
}

export interface UsageRecord {
  id: string;
  timestamp: number;
  provider: ProviderId;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  taskType: 'chat' | 'build' | 'edit' | 'agent';
}

export interface DiffProposal {
  id: string;
  projectId: string;
  fileId: string;
  filePath: string;
  originalContent: string;
  newContent: string;
  instruction: string;
  explanation: string;
  status: 'pending' | 'applied' | 'rejected';
  timestamp: number;
}

export type ActiveTab =
  | 'dashboard'
  | 'chat'
  | 'build'
  | 'projects'
  | 'files'
  | 'agents'
  | 'models'
  | 'apikeys'
  | 'usage';
