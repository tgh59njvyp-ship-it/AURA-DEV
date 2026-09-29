import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Zap,
  Bot,
  Network,
  Cpu,
  Sliders,
  Layers,
  Info
} from 'lucide-react';
import { ProviderId } from '../../types';

export const ApiKeysView: React.FC = () => {
  const {
    providers,
    updateApiKey,
    testProviderConnection,
    removeApiKey,
    isDemoMode,
    setIsDemoMode,
    resetAllSettings,
    showNotification
  } = useApp();

  // Local draft inputs for key typing so user can edit before saving
  const [draftKeys, setDraftKeys] = useState<Record<string, string>>({});
  const [draftBaseUrls, setDraftBaseUrls] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleKeyChange = (providerId: string, val: string) => {
    setDraftKeys((prev) => ({ ...prev, [providerId]: val }));
  };

  const handleBaseUrlChange = (providerId: string, val: string) => {
    setDraftBaseUrls((prev) => ({ ...prev, [providerId]: val }));
  };

  const toggleVisibility = (providerId: string) => {
    setVisibleKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleSaveAndTest = async (providerId: ProviderId) => {
    const prov = providers.find((p) => p.id === providerId);
    const keyToSave = draftKeys[providerId] !== undefined ? draftKeys[providerId] : prov?.apiKey || '';
    const baseUrlToSave = draftBaseUrls[providerId] !== undefined ? draftBaseUrls[providerId] : prov?.baseUrl;

    setTestingId(providerId);
    await updateApiKey(providerId, keyToSave, baseUrlToSave);
    setTestingId(null);
  };

  const handleTestOnly = async (providerId: ProviderId) => {
    setTestingId(providerId);
    await testProviderConnection(providerId);
    setTestingId(null);
  };

  const handleDelete = (providerId: ProviderId) => {
    removeApiKey(providerId);
    setDraftKeys((prev) => {
      const copy = { ...prev };
      delete copy[providerId];
      return copy;
    });
  };

  const getProviderIcon = (id: ProviderId) => {
    switch (id) {
      case 'gemini':
        return <Sparkles className="w-5 h-5 text-blue-400" />;
      case 'openai':
        return <Bot className="w-5 h-5 text-emerald-400" />;
      case 'openrouter':
        return <Network className="w-5 h-5 text-indigo-400" />;
      case 'groq':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'anthropic':
        return <Cpu className="w-5 h-5 text-orange-400" />;
      default:
        return <Sliders className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider">
            <Key className="w-4 h-4" />
            <span>BRING YOUR OWN KEY (BYOK)</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            AI Providers
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Register your personal API keys to run queries, code generation, and agents directly with AI providers. Your keys remain strictly on your client / secure proxy and are never logged.
          </p>
        </div>

        {/* Global Demo Mode Toggle */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-neutral-900 border border-neutral-800 self-start sm:self-auto">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">Demo Mode</span>
            <span className="text-[11px] text-neutral-400">Preview without key</span>
          </div>
          <button
            onClick={() => {
              setIsDemoMode(!isDemoMode);
              showNotification('info', `Demo Mode ${!isDemoMode ? 'Enabled' : 'Disabled'}`);
            }}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
              isDemoMode ? 'bg-amber-500' : 'bg-neutral-800'
            }`}
            aria-label="Toggle Demo Mode"
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                isDemoMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Security Architecture Note */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-300 leading-relaxed space-y-1">
          <span className="font-semibold text-white">Security & Zero-Leakage Architecture:</span>
          <p className="text-neutral-400">
            API keys are masked on-screen at all times, stored with client-side cryptographic obfuscation, and routed through a stateless server proxy to handle browser CORS without exposing headers or writing keys into telemetry or server logs.
          </p>
        </div>
      </div>

      {/* Priority Providers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-white">Primary Recommended Providers</h2>
          </div>
          <span className="text-xs text-neutral-500">Google Gemini · OpenAI · OpenRouter · Groq</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providers.filter((p) => ['gemini', 'openai', 'openrouter', 'groq'].includes(p.id)).map((prov) => {
            const isVisible = !!visibleKeys[prov.id];
            const currentVal = draftKeys[prov.id] !== undefined ? draftKeys[prov.id] : prov.apiKey;
            const isTesting = testingId === prov.id || prov.isValidating;

            return (
              <div
                key={prov.id}
                className={`rounded-3xl border p-6 flex flex-col justify-between transition ${
                  prov.isConnected
                    ? 'bg-neutral-900/80 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
                    : 'bg-neutral-900/50 border-neutral-800'
                }`}
              >
                <div className="space-y-4">
                  {/* Provider Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-neutral-950 border border-neutral-800">
                        {getProviderIcon(prov.id)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{prov.name}</h3>
                          {prov.isConnected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Connected
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                              Not configured
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">{prov.tagline}</p>
                      </div>
                    </div>

                    <a
                      href={prov.consoleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
                      title="Get API Key from provider console"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold text-neutral-300">API Key</label>
                      <a
                        href={prov.consoleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline text-[11px]"
                      >
                        Get Key ↗
                      </a>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={currentVal}
                        onChange={(e) => handleKeyChange(prov.id, e.target.value)}
                        placeholder={prov.keyPlaceholder}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-600 font-mono tracking-wider focus:outline-none transition pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility(prov.id)}
                        className="absolute right-3 text-neutral-500 hover:text-neutral-300 transition cursor-pointer"
                        title={isVisible ? 'Mask key' : 'Show key'}
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Status / Error message */}
                    {prov.errorMessage && (
                      <div className="text-[11px] text-rose-400 flex items-center gap-1.5 mt-1 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span className="break-all">{prov.errorMessage}</span>
                      </div>
                    )}

                    {prov.isConnected && prov.lastTested && (
                      <div className="text-[10px] text-neutral-500 font-mono">
                        Last verified at {prov.lastTested}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestOnly(prov.id)}
                      disabled={isTesting || !currentVal}
                      className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-xs font-semibold text-neutral-200 transition cursor-pointer flex items-center gap-1.5"
                    >
                      {isTesting ? (
                        <>
                          <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <span>接続テスト</span>
                      )}
                    </button>

                    <button
                      onClick={() => handleSaveAndTest(prov.id)}
                      disabled={isTesting || !currentVal}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Key</span>
                    </button>
                  </div>

                  {prov.apiKey && (
                    <button
                      onClick={() => handleDelete(prov.id)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                      title="Remove Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Providers & Custom Provider Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h2 className="text-base font-bold text-white">Extended & Custom Providers</h2>
          </div>
          <span className="text-xs text-neutral-500">Anthropic · DeepSeek · xAI · Mistral · Cerebras · GitHub · Custom</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.filter((p) => !['gemini', 'openai', 'openrouter', 'groq'].includes(p.id)).map((prov) => {
            const isVisible = !!visibleKeys[prov.id];
            const currentVal = draftKeys[prov.id] !== undefined ? draftKeys[prov.id] : prov.apiKey;
            const currentBaseUrl = draftBaseUrls[prov.id] !== undefined ? draftBaseUrls[prov.id] : prov.baseUrl || '';
            const isTesting = testingId === prov.id || prov.isValidating;

            return (
              <div
                key={prov.id}
                className={`rounded-3xl border p-5 flex flex-col justify-between transition ${
                  prov.isConnected
                    ? 'bg-neutral-900/80 border-emerald-500/30'
                    : 'bg-neutral-900/40 border-neutral-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{prov.name}</h3>
                        {prov.isConnected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{prov.tagline}</p>
                    </div>

                    <a
                      href={prov.consoleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-500 hover:text-white p-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* If custom provider, allow base URL editing */}
                  {prov.isCustom && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-300">Base URL</label>
                      <input
                        type="text"
                        value={currentBaseUrl}
                        onChange={(e) => handleBaseUrlChange(prov.id, e.target.value)}
                        placeholder="http://localhost:11434/v1"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* API Key */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">API Key</label>
                    <div className="relative flex items-center">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={currentVal}
                        onChange={(e) => handleKeyChange(prov.id, e.target.value)}
                        placeholder={prov.keyPlaceholder}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-200 font-mono pr-8 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility(prov.id)}
                        className="absolute right-2.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                      >
                        {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {prov.errorMessage && (
                    <div className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg break-all">
                      {prov.errorMessage}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTestOnly(prov.id)}
                      disabled={isTesting || !currentVal}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-[11px] text-neutral-200 transition cursor-pointer"
                    >
                      {isTesting ? 'Testing...' : '接続テスト'}
                    </button>
                    <button
                      onClick={() => handleSaveAndTest(prov.id)}
                      disabled={isTesting || !currentVal}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-[11px] text-white transition cursor-pointer"
                    >
                      Save
                    </button>
                  </div>

                  {prov.apiKey && (
                    <button
                      onClick={() => handleDelete(prov.id)}
                      className="p-1 text-neutral-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger Zone / Vault Reset */}
      <div className="p-6 rounded-3xl bg-neutral-900/40 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Reset Credentials Vault</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Removes all cached API keys and restores default provider configurations from your local browser.
          </p>
        </div>
        <button
          onClick={resetAllSettings}
          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-rose-950/40 border border-neutral-800 hover:border-rose-500/40 text-xs font-semibold text-neutral-300 hover:text-rose-400 transition cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Credentials</span>
        </button>
      </div>
    </div>
  );
};
