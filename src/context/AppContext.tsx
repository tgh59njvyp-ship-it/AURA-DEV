import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActiveTab,
  AIAgent,
  ModelOption,
  Project,
  ProjectFile,
  ProviderConfig,
  ProviderId
} from '../types';
import {
  loadKeysFromVault,
  saveKeysToVault,
  clearKeysVault
} from '../utils/security';
import {
  ADAPTER_REGISTRY,
  openRouterAdapter,
  selectAutoModel
} from '../services/adapters';
import {
  getStoredProjects,
  saveProjects,
  STARTER_PROJECTS
} from '../services/projectService';
import { clearUsageRecords } from '../services/usageTracker';

export interface NotificationState {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;

  // Providers & BYOK
  providers: ProviderConfig[];
  activeProvider: ProviderId;
  setActiveProvider: (id: ProviderId) => void;
  activeModel: string;
  setActiveModel: (model: string) => void;
  isAutoRouter: boolean;
  setIsAutoRouter: (enabled: boolean) => void;
  autoRouterInfo: { provider: ProviderId; model: string; reason: string } | null;
  evaluateAutoRoute: (query: string) => { provider: ProviderId; model: string; reason: string } | null;

  updateApiKey: (id: ProviderId, apiKey: string, baseUrl?: string) => Promise<boolean>;
  testProviderConnection: (id: ProviderId) => Promise<boolean>;
  removeApiKey: (id: ProviderId) => void;
  refreshOpenRouterCatalog: () => Promise<void>;

  // Pinned / Fixed Models
  pinnedModels: Record<string, string>;
  pinModel: (providerId: ProviderId, modelId: string) => void;
  unpinModel: (providerId: ProviderId) => void;
  isModelPinned: (providerId: ProviderId, modelId: string) => boolean;

  // Dynamic Provider Model Fetcher
  fetchModelsForProvider: (providerId: ProviderId) => Promise<ModelOption[]>;
  fetchAllConnectedModels: () => Promise<void>;
  pinnedModelDeprecatedWarning: string | null;

  // Demo Mode
  isDemoMode: boolean;
  setIsDemoMode: (demo: boolean) => void;
  hasAnyRealKey: boolean;

  // Projects
  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  activeProject: Project | undefined;
  createProject: (name: string, description: string, category?: Project['category']) => Project;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  updateFileContent: (projectId: string, fileId: string, newContent: string) => void;
  createFileInProject: (projectId: string, fileName: string, initialContent?: string) => void;
  deleteFileInProject: (projectId: string, fileId: string) => void;

  // Agents
  agents: AIAgent[];
  createAgent: (agentData: Omit<AIAgent, 'id' | 'createdAt'>) => AIAgent;
  updateAgent: (agent: AIAgent) => void;
  deleteAgent: (id: string) => void;

  // Notifications
  notification: NotificationState | null;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  clearNotification: () => void;

  // Reset
  resetAllSettings: () => void;
}

const INITIAL_PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    tagline: 'Next-gen multimodal intelligence with up to 2M tokens context',
    websiteUrl: 'https://ai.google.dev',
    consoleUrl: 'https://aistudio.google.com/app/apikey',
    apiKey: '',
    isConnected: false,
    defaultModel: 'gemini-2.5-flash',
    models: ADAPTER_REGISTRY.gemini.models,
    iconName: 'Sparkles',
    keyPlaceholder: 'AIzaSy...'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    tagline: 'GPT-4o, GPT-4o mini, o3-mini & frontier reasoning models',
    websiteUrl: 'https://openai.com',
    consoleUrl: 'https://platform.openai.com/api-keys',
    apiKey: '',
    isConnected: false,
    defaultModel: 'gpt-4o',
    models: ADAPTER_REGISTRY.openai.models,
    iconName: 'Bot',
    keyPlaceholder: 'sk-proj-...'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    tagline: 'Universal gateway to 200+ models with dynamic pricing & free tiers',
    websiteUrl: 'https://openrouter.ai',
    consoleUrl: 'https://openrouter.ai/keys',
    apiKey: '',
    isConnected: false,
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: ADAPTER_REGISTRY.openrouter.models,
    iconName: 'Network',
    keyPlaceholder: 'sk-or-v1-...'
  },
  {
    id: 'groq',
    name: 'Groq',
    tagline: 'LPU™ inference engine delivering extreme 500+ tokens/sec speeds',
    websiteUrl: 'https://groq.com',
    consoleUrl: 'https://console.groq.com/keys',
    apiKey: '',
    isConnected: false,
    defaultModel: 'llama-3.3-70b-versatile',
    models: ADAPTER_REGISTRY.groq.models,
    iconName: 'Zap',
    keyPlaceholder: 'gsk_...'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    tagline: 'Claude 3.7 & 3.5 Sonnet benchmark software engineering models',
    websiteUrl: 'https://anthropic.com',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    apiKey: '',
    isConnected: false,
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ADAPTER_REGISTRY.anthropic.models,
    iconName: 'Cpu',
    keyPlaceholder: 'sk-ant-api03-...'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    tagline: 'DeepSeek V3 & R1 reasoning and code synthesis',
    websiteUrl: 'https://deepseek.com',
    consoleUrl: 'https://platform.deepseek.com/api_keys',
    apiKey: '',
    isConnected: false,
    defaultModel: 'deepseek-chat',
    models: ADAPTER_REGISTRY.deepseek.models,
    iconName: 'Brain',
    keyPlaceholder: 'sk-...'
  },
  {
    id: 'xai',
    name: 'xAI Grok',
    tagline: 'Grok 2 frontier reasoning and real-time comprehension',
    websiteUrl: 'https://x.ai',
    consoleUrl: 'https://console.x.ai',
    apiKey: '',
    isConnected: false,
    defaultModel: 'grok-2-1212',
    models: ADAPTER_REGISTRY.xai.models,
    iconName: 'Flame',
    keyPlaceholder: 'xai-...'
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    tagline: 'Mistral Large 2 and Codestral 256k context models',
    websiteUrl: 'https://mistral.ai',
    consoleUrl: 'https://console.mistral.ai',
    apiKey: '',
    isConnected: false,
    defaultModel: 'mistral-large-latest',
    models: ADAPTER_REGISTRY.mistral.models,
    iconName: 'Wind',
    keyPlaceholder: '...'
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    tagline: 'World-record 2100+ tokens/sec on wafer-scale inference engine',
    websiteUrl: 'https://cerebras.ai',
    consoleUrl: 'https://cloud.cerebras.ai',
    apiKey: '',
    isConnected: false,
    defaultModel: 'llama3.1-70b',
    models: ADAPTER_REGISTRY.cerebras.models,
    iconName: 'Gauge',
    keyPlaceholder: 'csk-...'
  },
  {
    id: 'github',
    name: 'GitHub Models',
    tagline: 'Free prototype inference playground for GitHub developers',
    websiteUrl: 'https://github.com/marketplace/models',
    consoleUrl: 'https://github.com/settings/tokens',
    apiKey: '',
    isConnected: false,
    defaultModel: 'gpt-4o',
    models: ADAPTER_REGISTRY.github.models,
    iconName: 'Github',
    keyPlaceholder: 'ghp_...'
  },
  {
    id: 'custom',
    name: 'Custom (OpenAI-compatible)',
    tagline: 'Connect local Ollama, vLLM, LM Studio, or private LLM endpoints',
    websiteUrl: 'https://platform.openai.com/docs/api-reference',
    consoleUrl: 'http://localhost:11434',
    apiKey: '',
    baseUrl: 'http://localhost:11434/v1',
    isConnected: false,
    defaultModel: 'custom-model-1',
    models: ADAPTER_REGISTRY.custom.models,
    iconName: 'Sliders',
    keyPlaceholder: 'Bearer key (optional for local Ollama)',
    isCustom: true
  }
];

const STARTER_AGENTS: AIAgent[] = [
  {
    id: 'agent_frontend',
    name: 'Frontend Architect',
    description: 'Material 3 Expressive, React 19, Tailwind CSS, TypeScriptのスペシャリスト',
    avatar: '🎨',
    systemPrompt: 'You are an elite Frontend Architect. You craft pristine, modular, accessible web user interfaces adhering strictly to modern design principles, fluid typography, dark mode contrast, and zero layout clutters.',
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    temperature: 0.5,
    tools: ['code_generation', 'file_operations'],
    knowledge: [],
    memoryEnabled: true,
    createdAt: Date.now() - 86400000
  },
  {
    id: 'agent_debugger',
    name: 'Fullstack Debugger',
    description: '非同期処理の競合、メモリリーク、セキュリティ脆弱性を瞬時に特定',
    avatar: '🔍',
    systemPrompt: 'You are a veteran Fullstack Debugger. Analyze stack traces, identify concurrency issues, verify memory consumption, and propose precise minimal diffs.',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    tools: ['code_generation', 'file_operations', 'project_ops'],
    knowledge: [],
    memoryEnabled: true,
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'agent_api',
    name: 'API Integrator',
    description: 'OpenAPI仕様、Webhook、レートリミット対策、型安全なクライアント生成',
    avatar: '🔌',
    systemPrompt: 'You are an API Integration Specialist. Design resilient HTTP clients, retry logic with exponential backoff, and robust error handlers.',
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.4,
    tools: ['json_formatting', 'code_generation'],
    knowledge: [],
    memoryEnabled: false,
    createdAt: Date.now() - 86400000 * 3
  }
];

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [providers, setProviders] = useState<ProviderConfig[]>(INITIAL_PROVIDERS);
  const [activeProvider, setActiveProvider] = useState<ProviderId>('gemini');
  const [activeModel, setActiveModel] = useState<string>('gemini-2.5-flash');
  const [isAutoRouter, setIsAutoRouter] = useState<boolean>(false);
  const [autoRouterInfo, setAutoRouterInfo] = useState<{ provider: ProviderId; model: string; reason: string } | null>(null);

  // Pinned Models state per provider
  const [pinnedModels, setPinnedModels] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('aura_dev_pinned_models_v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [projects, setProjects] = useState<Project[]>(getStoredProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || 'proj_pokecard');

  const [agents, setAgents] = useState<AIAgent[]>(() => {
    try {
      const stored = localStorage.getItem('aura_dev_agents_v1');
      return stored ? JSON.parse(stored) : STARTER_AGENTS;
    } catch {
      return STARTER_AGENTS;
    }
  });

  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  }, []);

  const clearNotification = useCallback(() => setNotification(null), []);

  // Determine if any provider has an active real API key
  const hasAnyRealKey = useMemo(() => {
    return providers.some((p) => p.isConnected && p.apiKey.trim().length > 0);
  }, [providers]);

  // Demo mode state: defaults to false if a key is connected, otherwise true
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!hasAnyRealKey);

  // Sync demo mode when keys are added/removed
  useEffect(() => {
    if (hasAnyRealKey) {
      setIsDemoMode(false);
    }
  }, [hasAnyRealKey]);

  // Load vault on initial mount
  useEffect(() => {
    const vault = loadKeysFromVault();
    let hasKeys = false;
    setProviders((prev) =>
      prev.map((p) => {
        const stored = vault[p.id];
        if (stored && stored.apiKey) {
          hasKeys = true;
          return {
            ...p,
            apiKey: stored.apiKey,
            baseUrl: stored.baseUrl || p.baseUrl,
            isConnected: !!stored.isConnected
          };
        }
        return p;
      })
    );
    if (!hasKeys) {
      setIsDemoMode(true);
    }

    // Load cached dynamic models if any
    try {
      const cachedModelsRaw = localStorage.getItem('aura_dev_dynamic_models_v1');
      if (cachedModelsRaw) {
        const cachedModels = JSON.parse(cachedModelsRaw);
        setProviders((curr) =>
          curr.map((p) => {
            const dynamicList = cachedModels[p.id];
            if (Array.isArray(dynamicList) && dynamicList.length > 0) {
              return { ...p, models: dynamicList };
            }
            return p;
          })
        );
      }
    } catch {}

    // Also fetch OpenRouter models dynamically in background
    openRouterAdapter.fetchDynamicModels().then((models) => {
      if (models.length > 0) {
        setProviders((curr) =>
          curr.map((p) => (p.id === 'openrouter' ? { ...p, models } : p))
        );
      }
    });
  }, []);

  const toggleSidebar = useCallback(() => setIsSidebarCollapsed((v) => !v), []);

  // Fetch models directly from provider API without hardcoding
  const fetchModelsForProvider = useCallback(async (providerId: ProviderId, explicitApiKey?: string): Promise<ModelOption[]> => {
    const prov = providers.find((p) => p.id === providerId);
    const keyToUse = explicitApiKey || prov?.apiKey || '';

    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, isFetchingModels: true } : p))
    );

    try {
      const res = await fetch('/api/ai/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          apiKey: keyToUse,
          baseUrl: prov?.baseUrl
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error || `HTTP ${res.status}: Failed to fetch models`;
        setProviders((prev) =>
          prev.map((p) => (p.id === providerId ? { ...p, isFetchingModels: false } : p))
        );
        showNotification('error', `${prov?.name || providerId}: ${msg}`);
        return prov?.models || [];
      }

      const data = await res.json();
      const currentPinned = pinnedModels[providerId];
      const fetched: ModelOption[] = (data.models || []).map((m: any) => ({
        ...m,
        isPinned: currentPinned === m.id,
        fetchedAt: Date.now()
      }));

      if (fetched.length > 0) {
        setProviders((prev) =>
          prev.map((p) => {
            if (p.id !== providerId) return p;
            return {
              ...p,
              isFetchingModels: false,
              models: fetched,
              lastModelsFetched: new Date().toLocaleTimeString()
            };
          })
        );

        // Cache dynamic models in local storage
        try {
          const storedDynamic = JSON.parse(localStorage.getItem('aura_dev_dynamic_models_v1') || '{}');
          storedDynamic[providerId] = fetched;
          localStorage.setItem('aura_dev_dynamic_models_v1', JSON.stringify(storedDynamic));
        } catch {}

        showNotification('success', `${prov?.name || providerId}: ${fetched.length} 件のモデルをAPIから更新しました`);

        // Check if currently pinned model became deprecated or is missing
        if (currentPinned) {
          const pinnedObj = fetched.find((m) => m.id === currentPinned);
          if (!pinnedObj) {
            showNotification('error', `注意: 固定中のモデル (${currentPinned}) はプロバイダーAPIの利用可能一覧に見つかりません。`);
          } else if (pinnedObj.status === 'Deprecated' || pinnedObj.status === 'Shutdown') {
            showNotification('error', `警告: 固定中のモデル (${currentPinned}) は現在利用不可 (${pinnedObj.status}) です。新しいモデルを選択してください。`);
          }
        }

        return fetched;
      }
    } catch (err: any) {
      setProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, isFetchingModels: false } : p))
      );
      showNotification('error', `${prov?.name || providerId}: ${err.message || 'モデル取得エラー'}`);
    }

    return prov?.models || [];
  }, [providers, pinnedModels, showNotification]);

  const fetchAllConnectedModels = useCallback(async () => {
    const connected = providers.filter((p) => p.isConnected && p.apiKey.trim().length > 0);
    for (const prov of connected) {
      await fetchModelsForProvider(prov.id);
    }
  }, [providers, fetchModelsForProvider]);

  // Model Pinning ("固定")
  const pinModel = useCallback((providerId: ProviderId, modelId: string) => {
    const prov = providers.find((p) => p.id === providerId);
    const targetModel = prov?.models.find((m) => m.id === modelId);

    // Deprecated or Shutdown models cannot be pinned
    if (targetModel && (targetModel.status === 'Deprecated' || targetModel.status === 'Shutdown')) {
      showNotification(
        'error',
        `このモデル (${modelId}) は現在 ${targetModel.status} のため固定できません。利用可能なモデルを選択してください。`
      );
      return;
    }

    setPinnedModels((prev) => {
      const next = { ...prev, [providerId]: modelId };
      try {
        localStorage.setItem('aura_dev_pinned_models_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Update isPinned flag on provider's models
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== providerId) return p;
        return {
          ...p,
          pinnedModelId: modelId,
          models: p.models.map((m) => ({ ...m, isPinned: m.id === modelId }))
        };
      })
    );

    setActiveProvider(providerId);
    setActiveModel(modelId);
    setIsAutoRouter(false);
    showNotification('success', `${prov?.name || providerId} のモデルを「${targetModel?.name || modelId}」に固定しました`);
  }, [providers, showNotification]);

  const unpinModel = useCallback((providerId: ProviderId) => {
    setPinnedModels((prev) => {
      const next = { ...prev };
      delete next[providerId];
      try {
        localStorage.setItem('aura_dev_pinned_models_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== providerId) return p;
        return {
          ...p,
          pinnedModelId: undefined,
          models: p.models.map((m) => ({ ...m, isPinned: false }))
        };
      })
    );

    showNotification('info', `固定を解除しました`);
  }, [showNotification]);

  const isModelPinned = useCallback((providerId: ProviderId, modelId: string) => {
    return pinnedModels[providerId] === modelId;
  }, [pinnedModels]);

  // Deprecated pinned model check for active provider
  const pinnedModelDeprecatedWarning = useMemo(() => {
    const pinnedId = pinnedModels[activeProvider];
    if (!pinnedId) return null;
    const prov = providers.find((p) => p.id === activeProvider);
    const modelObj = prov?.models.find((m) => m.id === pinnedId);
    if (modelObj && (modelObj.status === 'Deprecated' || modelObj.status === 'Shutdown')) {
      return `固定中のモデル (${pinnedId}) は現在利用不可 (${modelObj.status}) です。新しいモデルを選択してください。`;
    }
    return null;
  }, [pinnedModels, activeProvider, providers]);

  // Test provider connection
  const testProviderConnection = useCallback(async (providerId: ProviderId): Promise<boolean> => {
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, isValidating: true, errorMessage: undefined } : p))
    );

    const prov = providers.find((p) => p.id === providerId);
    if (!prov || !prov.apiKey.trim()) {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? { ...p, isValidating: false, isConnected: false, errorMessage: 'API Key is empty' }
            : p
        )
      );
      showNotification('error', `${prov?.name || providerId}: Please enter an API key`);
      return false;
    }

    try {
      const adapter = ADAPTER_REGISTRY[providerId];
      const result = await adapter.validateApiKey(prov.apiKey, prov.baseUrl);

      if (result.valid) {
        setProviders((prev) =>
          prev.map((p) =>
            p.id === providerId
              ? {
                  ...p,
                  isValidating: false,
                  isConnected: true,
                  lastTested: new Date().toLocaleTimeString(),
                  errorMessage: undefined
                }
              : p
          )
        );

        // Update vault
        const currentVault = loadKeysFromVault();
        currentVault[providerId] = {
          apiKey: prov.apiKey,
          baseUrl: prov.baseUrl,
          isConnected: true
        };
        saveKeysToVault(currentVault);

        showNotification('success', `${prov.name}: Connected successfully!`);
        // Automatically query live models from provider API
        fetchModelsForProvider(providerId, prov.apiKey);
        return true;
      } else {
        const err = result.error || 'Connection test failed';
        setProviders((prev) =>
          prev.map((p) =>
            p.id === providerId
              ? {
                  ...p,
                  isValidating: false,
                  isConnected: false,
                  errorMessage: err
                }
              : p
          )
        );
        showNotification('error', `${prov.name}: ${err}`);
        return false;
      }
    } catch (err: any) {
      const msg = err.message || 'Connection test error';
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? { ...p, isValidating: false, isConnected: false, errorMessage: msg }
            : p
        )
      );
      showNotification('error', `${prov.name}: ${msg}`);
      return false;
    }
  }, [providers, showNotification]);

  // Update API Key
  const updateApiKey = useCallback(async (providerId: ProviderId, apiKey: string, baseUrl?: string): Promise<boolean> => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? {
              ...p,
              apiKey: apiKey.trim(),
              baseUrl: baseUrl !== undefined ? baseUrl : p.baseUrl,
              errorMessage: undefined
            }
          : p
      )
    );

    // Auto-test on save
    const prov = providers.find((p) => p.id === providerId);
    if (!apiKey.trim()) {
      removeApiKey(providerId);
      return false;
    }

    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, isValidating: true } : p))
    );

    const adapter = ADAPTER_REGISTRY[providerId];
    const validation = await adapter.validateApiKey(apiKey.trim(), baseUrl || prov?.baseUrl);

    const isConnected = !!validation.valid;
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? {
              ...p,
              isValidating: false,
              isConnected,
              lastTested: isConnected ? new Date().toLocaleTimeString() : undefined,
              errorMessage: isConnected ? undefined : validation.error
            }
          : p
      )
    );

    const currentVault = loadKeysFromVault();
    currentVault[providerId] = {
      apiKey: apiKey.trim(),
      baseUrl: baseUrl || prov?.baseUrl,
      isConnected
    };
    saveKeysToVault(currentVault);

    if (isConnected) {
      showNotification('success', `${prov?.name || providerId} key saved and connected!`);
      // Automatically query live models from provider API
      fetchModelsForProvider(providerId, apiKey.trim());
      return true;
    } else {
      showNotification('error', `${prov?.name || providerId}: ${validation.error || 'Invalid key'}`);
      return false;
    }
  }, [providers, showNotification]);

  const removeApiKey = useCallback((providerId: ProviderId) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? {
              ...p,
              apiKey: '',
              isConnected: false,
              lastTested: undefined,
              errorMessage: undefined
            }
          : p
      )
    );

    const currentVault = loadKeysFromVault();
    delete currentVault[providerId];
    saveKeysToVault(currentVault);

    showNotification('info', `Removed API key for ${providerId}`);
  }, [showNotification]);

  const refreshOpenRouterCatalog = useCallback(async () => {
    showNotification('info', 'Refreshing OpenRouter models catalog...');
    const list = await openRouterAdapter.fetchDynamicModels();
    setProviders((prev) =>
      prev.map((p) => (p.id === 'openrouter' ? { ...p, models: list } : p))
    );
    showNotification('success', `Loaded ${list.length} models from OpenRouter!`);
  }, [showNotification]);

  // Auto Router Evaluator
  const evaluateAutoRoute = useCallback((query: string) => {
    const route = selectAutoModel(query, providers);
    setAutoRouterInfo(route);
    if (route) {
      setActiveProvider(route.provider);
      setActiveModel(route.model);
    }
    return route;
  }, [providers]);

  // Project management
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0];
  }, [projects, activeProjectId]);

  const createProject = useCallback((name: string, description: string, category: Project['category'] = 'web'): Project => {
    const newProj: Project = {
      id: 'proj_' + Date.now(),
      name: name.trim() || 'New Project',
      description: description.trim() || 'A new AI project workspace',
      category,
      selectedModel: activeModel,
      selectedProvider: activeProvider,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeFileId: 'file_index',
      files: [
        {
          id: 'file_index',
          name: 'index.html',
          path: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-neutral-950 text-white min-h-screen flex items-center justify-center p-6">
  <div class="text-center space-y-4">
    <h1 class="text-3xl font-bold">${name}</h1>
    <p class="text-neutral-400">${description || 'Generated with AURA DEV'}</p>
  </div>
</body>
</html>`
        }
      ],
      chatHistory: []
    };

    setProjects((prev) => {
      const updated = [newProj, ...prev];
      saveProjects(updated);
      return updated;
    });
    setActiveProjectId(newProj.id);
    showNotification('success', `Created project "${newProj.name}"`);
    return newProj;
  }, [activeModel, activeProvider, showNotification]);

  const updateProject = useCallback((project: Project) => {
    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === project.id ? { ...project, updatedAt: Date.now() } : p));
      saveProjects(updated);
      return updated;
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      const remaining = filtered.length > 0 ? filtered : STARTER_PROJECTS;
      saveProjects(remaining);
      setActiveProjectId(remaining[0].id);
      return remaining;
    });
    showNotification('info', 'Project deleted');
  }, [showNotification]);

  const updateFileContent = useCallback((projectId: string, fileId: string, newContent: string) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        const newFiles = p.files.map((f) => (f.id === fileId ? { ...f, content: newContent, isModified: true } : f));
        return { ...p, files: newFiles, updatedAt: Date.now() };
      });
      saveProjects(updated);
      return updated;
    });
  }, []);

  const createFileInProject = useCallback((projectId: string, fileName: string, initialContent = '') => {
    const ext = fileName.split('.').pop() || 'txt';
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown'
    };
    const fileId = 'file_' + Date.now();
    const newFile: ProjectFile = {
      id: fileId,
      name: fileName,
      path: fileName,
      language: langMap[ext] || 'plaintext',
      content: initialContent
    };

    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          files: [...p.files, newFile],
          activeFileId: fileId,
          updatedAt: Date.now()
        };
      });
      saveProjects(updated);
      return updated;
    });
    showNotification('success', `Created file ${fileName}`);
  }, [showNotification]);

  const deleteFileInProject = useCallback((projectId: string, fileId: string) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== projectId) return p;
        const remainingFiles = p.files.filter((f) => f.id !== fileId);
        const newActiveFileId = remainingFiles[0]?.id || '';
        return {
          ...p,
          files: remainingFiles,
          activeFileId: newActiveFileId,
          updatedAt: Date.now()
        };
      });
      saveProjects(updated);
      return updated;
    });
    showNotification('info', 'File deleted');
  }, [showNotification]);

  // Agents
  const createAgent = useCallback((agentData: Omit<AIAgent, 'id' | 'createdAt'>): AIAgent => {
    const newAgent: AIAgent = {
      ...agentData,
      id: 'agent_' + Date.now(),
      createdAt: Date.now()
    };
    setAgents((prev) => {
      const updated = [newAgent, ...prev];
      try {
        localStorage.setItem('aura_dev_agents_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showNotification('success', `Agent "${newAgent.name}" created`);
    return newAgent;
  }, [showNotification]);

  const updateAgent = useCallback((agent: AIAgent) => {
    setAgents((prev) => {
      const updated = prev.map((a) => (a.id === agent.id ? agent : a));
      try {
        localStorage.setItem('aura_dev_agents_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showNotification('success', `Agent "${agent.name}" updated`);
  }, [showNotification]);

  const deleteAgent = useCallback((id: string) => {
    setAgents((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem('aura_dev_agents_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showNotification('info', 'Agent removed');
  }, [showNotification]);

  const resetAllSettings = useCallback(() => {
    clearKeysVault();
    clearUsageRecords();
    setProviders(INITIAL_PROVIDERS);
    setIsDemoMode(true);
    showNotification('info', 'Vault and configuration reset.');
  }, [showNotification]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isSidebarCollapsed,
        toggleSidebar,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
        providers,
        activeProvider,
        setActiveProvider,
        activeModel,
        setActiveModel,
        isAutoRouter,
        setIsAutoRouter,
        autoRouterInfo,
        evaluateAutoRoute,
        updateApiKey,
        testProviderConnection,
        removeApiKey,
        refreshOpenRouterCatalog,

        // Pinned Models & Dynamic Fetch
        pinnedModels,
        pinModel,
        unpinModel,
        isModelPinned,
        fetchModelsForProvider,
        fetchAllConnectedModels,
        pinnedModelDeprecatedWarning,

        isDemoMode,
        setIsDemoMode,
        hasAnyRealKey,
        projects,
        activeProjectId,
        setActiveProjectId,
        activeProject,
        createProject,
        updateProject,
        deleteProject,
        updateFileContent,
        createFileInProject,
        deleteFileInProject,
        agents,
        createAgent,
        updateAgent,
        deleteAgent,
        notification,
        showNotification,
        clearNotification,
        resetAllSettings
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
