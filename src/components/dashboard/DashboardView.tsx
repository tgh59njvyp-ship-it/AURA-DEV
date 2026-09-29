import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  MessageSquare,
  Key,
  FolderGit2,
  Wand2,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  DollarSign,
  ChevronRight,
  Layers,
  Sparkles,
  Bot
} from 'lucide-react';
import { getUsageSummary } from '../../services/usageTracker';
import { formatCost } from '../../utils/pricing';

export const DashboardView: React.FC = () => {
  const {
    projects,
    setActiveProjectId,
    setActiveTab,
    providers,
    hasAnyRealKey,
    createProject,
    activeModel
  } = useApp();

  const usageSummary = useMemo(() => getUsageSummary(), []);
  const connectedProviders = providers.filter((p) => p.isConnected && p.apiKey.trim().length > 0);

  const topPriorityProviders = providers.filter((p) =>
    ['gemini', 'openai', 'openrouter', 'groq'].includes(p.id)
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI DEVELOPER WORKSPACE</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl">
            Bring-your-own-key multi-provider hub. Build applications, chat, refactor code with diffs, and deploy agents with zero provider lock-in.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              createProject('My New Web App', 'Autonomous web project generated in AURA DEV');
              setActiveTab('build');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            <span>AI Builder</span>
          </button>

          <button
            onClick={() => {
              createProject(`Project ${projects.length + 1}`, 'Developer project');
              setActiveTab('projects');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-neutral-400" />
            <span>Create Project</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-semibold transition cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-neutral-400" />
            <span>New Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('apikeys')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-semibold transition cursor-pointer"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Add API Key</span>
          </button>
        </div>
      </div>

      {/* First-time setup banner if no keys connected */}
      {!hasAnyRealKey && (
        <div className="rounded-3xl bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-neutral-900 border border-indigo-500/30 p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>FIRST STEP</span>
              </div>
              <h2 className="text-xl font-bold text-white">Connect your first AI provider</h2>
              <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
                AURA DEV operates entirely with your own keys. Your keys are encrypted locally and never logged. Choose any provider below to start using real models:
              </p>
            </div>
            <button
              onClick={() => setActiveTab('apikeys')}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>View All 11 Providers</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Connect Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topPriorityProviders.map((prov) => (
              <div
                key={prov.id}
                onClick={() => setActiveTab('apikeys')}
                className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 hover:border-indigo-500/40 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition">
                      {prov.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                      {prov.isConnected ? 'Connected' : 'Setup'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-2">{prov.tagline}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between text-[11px] text-indigo-400">
                  <span>Enter API key</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snapshot Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Connected Providers</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {connectedProviders.length}
            <span className="text-xs text-neutral-500 font-normal ml-1">/ {providers.length}</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {connectedProviders.length > 0 ? 'BYOK Active' : 'Demo Mode Active'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Total Requests</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {usageSummary.totalRequests.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Workspace executions</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Tokens Processed</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {usageSummary.totalTokens.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Prompt & Completion</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Estimated Cost</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {formatCost(usageSummary.totalCostUSD)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Based on provider rates</div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Projects & Quick Build (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Recent Projects</h2>
            </div>
            <button
              onClick={() => setActiveTab('projects')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            >
              View all ({projects.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.slice(0, 4).map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  setActiveProjectId(proj.id);
                  setActiveTab('projects');
                }}
                className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/50 uppercase">
                      {proj.category}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {proj.files.length} files
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition truncate">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                    {proj.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
                  <span>Model: {proj.selectedModel}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))}
          </div>

          {/* Quick AI Builder Prompt Box */}
          <div className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Generate Web App or Tool</h3>
            </div>
            <p className="text-xs text-neutral-400">
              Prompt the AI to build complete multi-file web applications, tools, or UI components with immediate live preview:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'ポケモンカードの価格を検索できるサイトを作って',
                'リアルタイム暗号資産トラッカーを作って',
                'Material 3 スタイルのカンバンタスクボードを作って',
                'オーディオシンセサイザー & ビジュアライザーを作って'
              ].map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => {
                    createProject(`App: ${promptText.slice(0, 15)}...`, promptText);
                    setActiveTab('build');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-purple-500/40 text-xs text-neutral-300 hover:text-white transition cursor-pointer text-left"
                >
                  ✨ {promptText}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Providers & Active Model status */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">AI Connections</h2>
            </div>
            <button
              onClick={() => setActiveTab('apikeys')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            >
              Configure
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
            <div className="text-xs text-neutral-400 pb-2 border-b border-neutral-800 flex justify-between items-center">
              <span>Current Target Model</span>
              <span className="font-mono text-indigo-300 font-semibold">{activeModel}</span>
            </div>

            <div className="space-y-2">
              {providers.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-200">{p.name}</span>
                  </div>
                  {p.isConnected ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Connected
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveTab('apikeys')}
                      className="text-[11px] text-neutral-500 hover:text-indigo-400 transition cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('models')}
              className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Explore All Model Catalogs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
