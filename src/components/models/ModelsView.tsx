import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ModelOption } from '../../types';
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
  ArrowRight
} from 'lucide-react';

export const ModelsView: React.FC = () => {
  const {
    providers,
    activeModel,
    setActiveModel,
    setActiveProvider,
    refreshOpenRouterCatalog,
    showNotification
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        (m.description && m.description.toLowerCase().includes(search.toLowerCase()));

      const matchCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'free' && (m.category === 'free' || (m.promptPricePerM === 0 && m.completionPricePerM === 0))) ||
        m.category === selectedCategory;

      const matchProvider =
        selectedProviderFilter === 'all' || m.provider === selectedProviderFilter;

      return matchSearch && matchCategory && matchProvider;
    });
  }, [allModels, search, selectedCategory, selectedProviderFilter]);

  const handleSelectModel = (model: ModelOption) => {
    setActiveProvider(model.provider);
    setActiveModel(model.id);
    showNotification('success', `Active model set to ${model.name}`);
  };

  const handleRefreshOpenRouter = async () => {
    setIsRefreshing(true);
    await refreshOpenRouterCatalog();
    setIsRefreshing(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider">
            <Box className="w-4 h-4" />
            <span>MODEL DIRECTORY & CATALOG</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Models Catalog
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Compare pricing, context limits, and reasoning capabilities across Google Gemini, OpenAI, Groq, Anthropic, and OpenRouter.
          </p>
        </div>

        <button
          onClick={handleRefreshOpenRouter}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh OpenRouter Catalog</span>
        </button>
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
            placeholder="Search by model name, provider, or architecture..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Models' },
            { id: 'recommended', label: 'Recommended' },
            { id: 'coding', label: 'Coding' },
            { id: 'reasoning', label: 'Reasoning' },
            { id: 'fast', label: 'Ultra Fast' },
            { id: 'free', label: 'Free Tier' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((m) => {
          const isCurrentActive = activeModel === m.id;
          return (
            <div
              key={`${m.provider}_${m.id}`}
              className={`p-5 rounded-3xl border transition flex flex-col justify-between ${
                isCurrentActive
                  ? 'bg-neutral-900/90 border-indigo-500/50 shadow-lg shadow-indigo-950/20'
                  : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 uppercase">
                      {m.provider}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5 truncate">{m.name}</h3>
                  </div>

                  {m.category && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                      {m.category}
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {m.description || `High-capacity model hosted via ${m.provider}.`}
                </p>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 text-[11px] font-mono">
                  <div>
                    <span className="text-neutral-500 block">Context Window</span>
                    <span className="text-neutral-200 font-semibold">
                      {m.contextLength ? `${(m.contextLength / 1000).toFixed(0)}k tokens` : '128k tokens'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Pricing / 1M</span>
                    <span className="text-emerald-400 font-semibold">
                      {m.promptPricePerM === 0 && m.completionPricePerM === 0
                        ? 'Free'
                        : `$${m.promptPricePerM || 0} / $${m.completionPricePerM || 0}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[140px]">
                  {m.id}
                </span>

                {isCurrentActive ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 font-mono">
                    <Check className="w-3.5 h-3.5" />
                    <span>Active Target</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSelectModel(m)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-indigo-600 text-neutral-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <span>Use Model</span>
                    <ArrowRight className="w-3 h-3" />
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
