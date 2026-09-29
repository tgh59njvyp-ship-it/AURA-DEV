import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ModelOption, ProviderId, ModelLifecycleStatus } from '../../types';
import {
  Box,
  Search,
  Filter,
  Sparkles,
  Zap,
  Check,
  RotateCw,
  ExternalLink,
  Layers,
  ArrowRight,
  Pin,
  PinOff,
  Copy,
  AlertTriangle,
  Image as ImageIcon,
  FileCode,
  Type,
  ShieldCheck,
  Info
} from 'lucide-react';

export const ModelsView: React.FC = () => {
  const {
    providers,
    activeModel,
    activeProvider,
    setActiveModel,
    setActiveProvider,
    pinnedModels,
    pinModel,
    unpinModel,
    isModelPinned,
    fetchModelsForProvider,
    fetchAllConnectedModels,
    pinnedModelDeprecatedWarning,
    showNotification
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<ProviderId | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Aggregate all models across all providers
  const allModels: ModelOption[] = useMemo(() => {
    const list: ModelOption[] = [];
    providers.forEach((prov) => {
      prov.models.forEach((m) => {
        list.push(m);
      });
    });
    return list;
  }, [providers]);

  const filteredModels = useMemo(() => {
    return allModels.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase()) ||
        m.provider.toLowerCase().includes(search.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        selectedStatusFilter === 'all' ||
        m.status === selectedStatusFilter ||
        (selectedStatusFilter === 'pinned' && isModelPinned(m.provider, m.id));

      const matchProvider =
        selectedProviderFilter === 'all' || m.provider === selectedProviderFilter;

      return matchSearch && matchStatus && matchProvider;
    });
  }, [allModels, search, selectedStatusFilter, selectedProviderFilter, isModelPinned]);

  const handleCopyId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      showNotification('info', `Model ID コピー: ${id}`);
    } catch {}
  };

  const handleSyncProvider = async (providerId: ProviderId) => {
    setSyncingProvider(providerId);
    await fetchModelsForProvider(providerId);
    setSyncingProvider(null);
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    await fetchAllConnectedModels();
    setIsSyncingAll(false);
    showNotification('success', '全接続プロバイダーのモデル一覧をAPIから更新しました');
  };

  const getStatusBadge = (status: ModelLifecycleStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            ● Active
          </span>
        );
      case 'Preview':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
            ▲ Preview
          </span>
        );
      case 'Deprecated':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
            ⚠️ Deprecated
          </span>
        );
      case 'Shutdown':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
            ✕ Shutdown
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Deprecated Fixed Model Warning Banner */}
      {pinnedModelDeprecatedWarning && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-200 flex items-start gap-3 animate-in slide-in-from-top-2 duration-150">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold text-sm text-white">Your fixed model is deprecated / unavailable</span>
            <p className="text-rose-300 leading-relaxed">
              「{pinnedModelDeprecatedWarning}」
              <br />
              AURA DEVの固定モデル原則に基づき、自動でのフォールバックは行われません。下記の利用可能なモデルから新しいモデルを選択し「固定」してください。
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider">
            <Box className="w-4 h-4" />
            <span>DYNAMIC MODEL DISCOVERY & PINNING</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Models Catalog
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5 max-w-2xl">
            プロバイダーAPIから現在提供されている公式モデル一覧を動的に同期・表示します。モデルを選択して「固定」すると、自動フォールバックなしで確実に指定Model IDを使用します。
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>全プロバイダーAPIと同期</span>
          </button>
        </div>
      </div>

      {/* Provider Quick-Sync Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="font-semibold text-white">Provider API Sync</span>
          <span className="text-[11px] text-neutral-500">
            新モデル追加時もコード修正なしで最新モデルを即時取得
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {providers.map((prov) => {
            const isSyncing = syncingProvider === prov.id || prov.isFetchingModels;
            return (
              <button
                key={prov.id}
                onClick={() => handleSyncProvider(prov.id)}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-indigo-500/40 text-xs text-neutral-300 hover:text-white transition cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-indigo-400' : 'text-neutral-500'}`} />
                <span>{prov.name}</span>
                <span className="font-mono text-[10px] text-neutral-500">
                  ({prov.models.length})
                </span>
                {prov.pinnedModelId && (
                  <Pin className="w-2.5 h-2.5 text-indigo-400 fill-current ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Model ID (e.g. gemini-2.5-flash, gpt-4o, llama-3.3-70b)..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Status & Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* Provider dropdown filter */}
          <select
            value={selectedProviderFilter}
            onChange={(e) => setSelectedProviderFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
          >
            <option value="all">全プロバイダー</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Tabs */}
          {[
            { id: 'all', label: 'All Status' },
            { id: 'pinned', label: '固定中 (Pinned)' },
            { id: 'Active', label: 'Active' },
            { id: 'Preview', label: 'Preview' },
            { id: 'Deprecated', label: 'Deprecated' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedStatusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModels.map((m) => {
          const isPinned = isModelPinned(m.provider, m.id);
          const isCurrentActive = activeProvider === m.provider && activeModel === m.id;
          const isDeprecatedOrShutdown = m.status === 'Deprecated' || m.status === 'Shutdown';

          return (
            <div
              key={`${m.provider}_${m.id}`}
              className={`p-5 rounded-3xl border transition flex flex-col justify-between ${
                isPinned
                  ? 'bg-indigo-950/20 border-indigo-500/60 shadow-lg shadow-indigo-950/30 ring-1 ring-indigo-500/30'
                  : isCurrentActive
                  ? 'bg-neutral-900/90 border-indigo-500/30'
                  : isDeprecatedOrShutdown
                  ? 'bg-neutral-900/40 border-neutral-800/60 opacity-80'
                  : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="space-y-3">
                {/* Provider badge, status badge, pin badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 uppercase font-semibold">
                      {m.provider}
                    </span>
                    {getStatusBadge(m.status)}
                    {isPinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm">
                        <Pin className="w-2.5 h-2.5 fill-current" />
                        固定中
                      </span>
                    )}
                  </div>
                </div>

                {/* Model display name */}
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {m.name}
                  </h3>
                  {/* Formal Model ID with Copy action */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-neutral-500 text-[10px]">Model ID:</span>
                    <button
                      onClick={(e) => handleCopyId(m.id, e)}
                      className="inline-flex items-center gap-1 font-mono text-xs text-indigo-300 hover:text-white bg-neutral-950/80 px-2 py-0.5 rounded border border-neutral-800 hover:border-indigo-500 transition cursor-pointer"
                      title="APIリクエストに使用される正式なModel IDをコピー"
                    >
                      <span>{m.id}</span>
                      {copiedId === m.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-neutral-500" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {m.description || `${m.provider} からAPI経由で取得された公式モデル (${m.id})。`}
                </p>

                {/* Capabilities Badges */}
                <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800 flex items-center gap-1">
                    <Type className="w-3 h-3 text-blue-400" />
                    <span>Text In/Out</span>
                  </span>

                  {m.supportsImage && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-indigo-400" />
                      <span>画像対応</span>
                    </span>
                  )}

                  {m.supportsCode && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <FileCode className="w-3 h-3 text-emerald-400" />
                      <span>Code</span>
                    </span>
                  )}
                </div>

                {/* Specs: Context & Pricing */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 text-[11px] font-mono">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">コンテキスト長</span>
                    <span className="text-neutral-200 font-semibold">
                      {m.contextLength
                        ? `${(m.contextLength / 1000).toFixed(0)}k tokens`
                        : m.inputTokenLimit
                        ? `${(m.inputTokenLimit / 1000).toFixed(0)}k tokens`
                        : '128k tokens'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">料金 (Prompt / Comp)</span>
                    <span className="text-emerald-400 font-semibold">
                      {m.promptPricePerM === 0 && m.completionPricePerM === 0
                        ? 'Free Tier'
                        : m.promptPricePerM !== undefined
                        ? `$${m.promptPricePerM} / $${m.completionPricePerM || 0}`
                        : 'Provider Standard'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Pin / Select */}
              <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                {/* Pin / Unpin button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isPinned) {
                      unpinModel(m.provider);
                    } else {
                      pinModel(m.provider, m.id);
                    }
                  }}
                  disabled={isDeprecatedOrShutdown && !isPinned}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    isPinned
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-rose-300 border border-rose-500/30'
                      : isDeprecatedOrShutdown
                      ? 'bg-neutral-950 border border-neutral-800 text-neutral-600 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                  }`}
                  title={
                    isDeprecatedOrShutdown
                      ? 'Deprecated / Shutdown models cannot be pinned'
                      : isPinned
                      ? '固定を解除'
                      : 'このモデルを使用モデルとして固定する'
                  }
                >
                  {isPinned ? (
                    <>
                      <PinOff className="w-3.5 h-3.5" />
                      <span>固定解除</span>
                    </>
                  ) : (
                    <>
                      <Pin className="w-3.5 h-3.5" />
                      <span>{isDeprecatedOrShutdown ? '新規固定不可' : 'モデルを固定'}</span>
                    </>
                  )}
                </button>

                {/* Quick Select button (if not already active) */}
                {!isCurrentActive && !isPinned && (
                  <button
                    onClick={() => {
                      setActiveProvider(m.provider);
                      setActiveModel(m.id);
                      showNotification('info', `一時選択: ${m.name}`);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition cursor-pointer"
                  >
                    選択
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
