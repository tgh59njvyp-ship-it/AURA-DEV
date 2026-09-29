import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  ChevronDown,
  Check,
  Zap,
  Bot,
  Network,
  Cpu,
  Sliders,
  Layers,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Menu,
  Pin,
  PinOff,
  RotateCw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { ProviderId, ModelOption } from '../../types';

export const TopBar: React.FC = () => {
  const {
    activeProvider,
    setActiveProvider,
    activeModel,
    setActiveModel,
    providers,
    isAutoRouter,
    setIsAutoRouter,
    autoRouterInfo,
    activeTab,
    setActiveTab,
    isDemoMode,
    setIsDemoMode,
    hasAnyRealKey,
    activeProject,
    setIsMobileDrawerOpen,
    pinnedModels,
    pinModel,
    unpinModel,
    isModelPinned,
    fetchModelsForProvider,
    pinnedModelDeprecatedWarning
  } = useApp();

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [fetchingProvider, setFetchingProvider] = useState<ProviderId | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeProviderObj = providers.find((p) => p.id === activeProvider);
  const activeModelObj = activeProviderObj?.models.find((m) => m.id === activeModel);
  const isCurrentModelPinned = isModelPinned(activeProvider, activeModel);

  const getProviderIcon = (id: ProviderId) => {
    switch (id) {
      case 'gemini':
        return <Sparkles className="w-3.5 h-3.5 text-blue-400" />;
      case 'openai':
        return <Bot className="w-3.5 h-3.5 text-emerald-400" />;
      case 'openrouter':
        return <Network className="w-3.5 h-3.5 text-indigo-400" />;
      case 'groq':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'anthropic':
        return <Cpu className="w-3.5 h-3.5 text-orange-400" />;
      default:
        return <Sliders className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getStatusBadge = (status: ModelOption['status']) => {
    switch (status) {
      case 'Active':
        return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>;
      case 'Preview':
        return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Preview</span>;
      case 'Deprecated':
        return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">Deprecated</span>;
      case 'Shutdown':
        return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Shutdown</span>;
      default:
        return null;
    }
  };

  const handleFetchModels = async (provId: ProviderId, e: React.MouseEvent) => {
    e.stopPropagation();
    setFetchingProvider(provId);
    await fetchModelsForProvider(provId);
    setFetchingProvider(null);
  };

  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40">
      {/* Zone 1: Brand title & Mobile hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-base font-bold tracking-tight text-white flex items-center gap-2 group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
            A
          </div>
          <span className="font-extrabold tracking-wider bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
            AURA DEV
          </span>
        </a>

        {/* Breadcrumb separator */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 ml-2">
          <span>/</span>
          <span className="capitalize text-neutral-400">{activeTab}</span>
          {activeProject && (activeTab === 'projects' || activeTab === 'build') && (
            <>
              <span>/</span>
              <span className="text-neutral-300 font-medium truncate max-w-[140px]">
                {activeProject.name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Navigation Context / Deprecation warning */}
      <div className="hidden lg:flex items-center gap-3">
        {pinnedModelDeprecatedWarning ? (
          <button
            onClick={() => setIsModelDropdownOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/40 text-xs text-rose-300 animate-pulse cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-medium font-mono">{pinnedModelDeprecatedWarning}</span>
          </button>
        ) : isAutoRouter ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="font-medium">Auto-Router Active</span>
            {autoRouterInfo && (
              <span className="text-neutral-400 text-[11px]">
                · {autoRouterInfo.provider} ({autoRouterInfo.model})
              </span>
            )}
          </div>
        ) : isCurrentModelPinned ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 font-mono">
            <Pin className="w-3 h-3 text-indigo-400 fill-current" />
            <span>固定モデル: {activeModel}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Workspace Ready</span>
          </div>
        )}
      </div>

      {/* Zone 3: Model Selector Dropdown & Primary Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Auto Router Toggle button */}
        <button
          onClick={() => {
            const next = !isAutoRouter;
            setIsAutoRouter(next);
          }}
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
            isAutoRouter
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/30'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
          }`}
          title="Auto Router automatically determines model unless you pin a model"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Auto</span>
        </button>

        {/* Model Selector Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsModelDropdownOpen((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
              activeModelObj?.status === 'Deprecated' || activeModelObj?.status === 'Shutdown'
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                : isCurrentModelPinned
                ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {getProviderIcon(activeProvider)}
              <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[180px]">
                {activeModelObj?.name || activeModel}
              </span>
              {isCurrentModelPinned && (
                <span title="Fixed model">
                  <Pin className="w-3 h-3 text-indigo-400 fill-current shrink-0" />
                </span>
              )}
            </div>

            {activeModelObj?.status === 'Deprecated' ? (
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" title="Deprecated model" />
            ) : activeProviderObj?.isConnected ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Connected" />
            ) : isDemoMode ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Demo mode" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" title="No key" />
            )}

            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-0.5" />
          </button>

          {/* Model Selector Dropdown Menu */}
          {isModelDropdownOpen && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
              {/* Dropdown Header & Search */}
              <div className="p-3 border-b border-neutral-800 bg-neutral-950/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Select & Pin Model</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsModelDropdownOpen(false);
                      setActiveTab('models');
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>Full Catalog</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by Model ID or name..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 font-mono"
                    autoFocus
                  />
                </div>
              </div>

              {/* Models List grouped by Provider */}
              <div className="max-h-96 overflow-y-auto p-2 space-y-3">
                {providers.map((prov) => {
                  const isFetchingThis = fetchingProvider === prov.id || prov.isFetchingModels;
                  const filteredModels = prov.models.filter(
                    (m) =>
                      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                      m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
                      prov.name.toLowerCase().includes(modelSearch.toLowerCase())
                  );

                  if (filteredModels.length === 0 && modelSearch) return null;

                  return (
                    <div key={prov.id} className="space-y-1">
                      {/* Provider Header with Fetch from API button */}
                      <div className="px-2 py-1 flex items-center justify-between text-[11px] text-neutral-400 font-semibold tracking-wider">
                        <div className="flex items-center gap-1.5">
                          {getProviderIcon(prov.id)}
                          <span>{prov.name}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            ({prov.models.length})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Fetch Live Models from Provider API Button */}
                          <button
                            onClick={(e) => handleFetchModels(prov.id, e)}
                            disabled={isFetchingThis}
                            className="p-1 rounded text-neutral-400 hover:text-indigo-400 hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1 text-[10px]"
                            title="Query live models directly from provider API"
                          >
                            <RotateCw className={`w-3 h-3 ${isFetchingThis ? 'animate-spin text-indigo-400' : ''}`} />
                            <span className="hidden sm:inline">API更新</span>
                          </button>

                          {prov.isConnected ? (
                            <span className="text-[10px] text-emerald-400 font-mono">Connected</span>
                          ) : (
                            <span className="text-[10px] text-neutral-500 font-mono">Unset</span>
                          )}
                        </div>
                      </div>

                      {/* Models list */}
                      <div className="space-y-1">
                        {filteredModels.map((m) => {
                          const isSelected = activeProvider === prov.id && activeModel === m.id;
                          const isPinned = isModelPinned(prov.id, m.id);
                          const isDeprecated = m.status === 'Deprecated' || m.status === 'Shutdown';

                          return (
                            <div
                              key={m.id}
                              onClick={() => {
                                setActiveProvider(prov.id);
                                setActiveModel(m.id);
                                setIsAutoRouter(false);
                                setIsModelDropdownOpen(false);
                              }}
                              className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40'
                                  : 'hover:bg-neutral-800/80 text-neutral-300'
                              }`}
                            >
                              <div className="flex flex-col truncate pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold truncate text-white">{m.name}</span>
                                  {getStatusBadge(m.status)}
                                </div>
                                <span className="text-[10px] text-neutral-500 font-mono truncate">
                                  ID: {m.id}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Pin / Unpin button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isPinned) {
                                      unpinModel(prov.id);
                                    } else {
                                      pinModel(prov.id, m.id);
                                    }
                                  }}
                                  disabled={isDeprecated && !isPinned}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition ${
                                    isPinned
                                      ? 'bg-indigo-600 text-white shadow-sm'
                                      : isDeprecated
                                      ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                                  }`}
                                  title={
                                    isDeprecated
                                      ? 'Deprecated models cannot be pinned'
                                      : isPinned
                                      ? 'Unpin fixed model'
                                      : 'Pin as permanent fixed model'
                                  }
                                >
                                  <Pin className={`w-2.5 h-2.5 ${isPinned ? 'fill-current' : ''}`} />
                                  <span>{isPinned ? '固定中' : '固定'}</span>
                                </button>

                                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dropdown Footer */}
              <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-[11px] text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>固定したモデルは自動フォールバックされません</span>
                </div>
                <button
                  onClick={() => {
                    setIsDemoMode(!isDemoMode);
                    setIsModelDropdownOpen(false);
                  }}
                  className="text-neutral-300 hover:text-white underline cursor-pointer"
                >
                  {isDemoMode ? 'Turn off Demo' : 'Turn on Demo'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Demo Mode Toggle Badge */}
        {isDemoMode && (
          <button
            onClick={() => setActiveTab('apikeys')}
            className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition hover:bg-amber-500/20 cursor-pointer"
            title="Click to add real API keys"
          >
            <span>Demo</span>
          </button>
        )}
      </div>
    </header>
  );
};
