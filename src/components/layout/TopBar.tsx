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
  Menu
} from 'lucide-react';
import { ProviderId } from '../../types';

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
    setIsMobileDrawerOpen
  } = useApp();

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
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

      {/* Zone 2: Navigation Context / Mode indicator */}
      <div className="hidden lg:flex items-center gap-3">
        {isAutoRouter ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="font-medium">Auto-Router Active</span>
            {autoRouterInfo && (
              <span className="text-neutral-400 text-[11px]">
                · {autoRouterInfo.provider} ({autoRouterInfo.model})
              </span>
            )}
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
          title="Auto Router intelligently switches models based on prompt complexity"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Auto</span>
        </button>

        {/* Model Selector Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsModelDropdownOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              {getProviderIcon(activeProvider)}
              <span className="font-semibold text-white">
                {activeModelObj?.name || activeModel}
              </span>
            </div>

            {activeProviderObj?.isConnected ? (
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
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
              {/* Dropdown Header & Search */}
              <div className="p-3 border-b border-neutral-800 bg-neutral-950/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-300">
                    Select AI Model
                  </span>
                  <button
                    onClick={() => {
                      setIsModelDropdownOpen(false);
                      setActiveTab('apikeys');
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage Keys</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search models (Gemini, GPT-4o, Groq...)"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Models List grouped by Provider */}
              <div className="max-h-80 overflow-y-auto p-2 space-y-3">
                {providers.map((prov) => {
                  const filteredModels = prov.models.filter(
                    (m) =>
                      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                      m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
                      prov.name.toLowerCase().includes(modelSearch.toLowerCase())
                  );

                  if (filteredModels.length === 0) return null;

                  return (
                    <div key={prov.id} className="space-y-1">
                      {/* Provider Header */}
                      <div className="px-2 py-1 flex items-center justify-between text-[11px] text-neutral-400 font-semibold tracking-wider">
                        <div className="flex items-center gap-1.5">
                          {getProviderIcon(prov.id)}
                          <span>{prov.name}</span>
                        </div>
                        {prov.isConnected ? (
                          <span className="text-[10px] text-emerald-400 font-mono">Connected</span>
                        ) : (
                          <span className="text-[10px] text-neutral-500 font-mono">Unset</span>
                        )}
                      </div>

                      {/* Models of this provider */}
                      <div className="space-y-0.5">
                        {filteredModels.map((m) => {
                          const isSelected = activeProvider === prov.id && activeModel === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() => {
                                setActiveProvider(prov.id);
                                setActiveModel(m.id);
                                setIsAutoRouter(false);
                                setIsModelDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40'
                                  : 'hover:bg-neutral-800/80 text-neutral-300'
                              }`}
                            >
                              <div className="flex flex-col truncate pr-2">
                                <span className="font-medium truncate">{m.name}</span>
                                {m.description && (
                                  <span className="text-[10px] text-neutral-500 truncate">
                                    {m.description}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {m.promptPricePerM !== undefined && (
                                  <span className="text-[10px] text-neutral-500 font-mono">
                                    ${m.promptPricePerM}/M
                                  </span>
                                )}
                                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dropdown Footer */}
              <div className="p-2 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-[11px] text-neutral-400">
                <div className="flex items-center gap-1">
                  {hasAnyRealKey ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{hasAnyRealKey ? 'Using your API key' : 'Demo Mode enabled'}</span>
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
