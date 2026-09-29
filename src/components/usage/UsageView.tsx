import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getUsageRecords,
  getUsageSummary,
  clearUsageRecords
} from '../../services/usageTracker';
import { formatCost } from '../../utils/pricing';
import {
  BarChart3,
  DollarSign,
  Zap,
  Activity,
  Trash2,
  Download,
  Calendar,
  Layers,
  Bot
} from 'lucide-react';

export const UsageView: React.FC = () => {
  const { showNotification } = useApp();
  const [records, setRecords] = useState(getUsageRecords);

  const summary = useMemo(() => getUsageSummary(), [records]);

  const handleClear = () => {
    clearUsageRecords();
    setRecords([]);
    showNotification('info', 'Usage records cleared');
  };

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Timestamp,Provider,Model,Task,PromptTokens,CompletionTokens,TotalTokens,EstimatedCostUSD']
        .concat(
          records.map(
            (r) =>
              `${new Date(r.timestamp).toISOString()},${r.provider},${r.model},${r.taskType},${r.promptTokens},${r.completionTokens},${r.totalTokens},${r.estimatedCost}`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aura_dev_usage_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>CONSUMPTION & BILLING TELEMETRY</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Usage & Cost Analytics
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Monitor real-time token counts, estimated charges, and provider load distributions across all BYOK executions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExport}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-semibold disabled:opacity-40 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleClear}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-rose-950/40 border border-neutral-800 text-neutral-300 hover:text-rose-400 text-xs font-semibold disabled:opacity-40 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Records</span>
          </button>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Estimated Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-2">
            {formatCost(summary.totalCostUSD)}
          </div>
          <span className="text-[11px] text-neutral-500 font-mono mt-1 block">
            USD billed directly by providers
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Total Tokens</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mt-2">
            {summary.totalTokens.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            Prompt: {summary.totalPromptTokens.toLocaleString()} · Comp:{' '}
            {summary.totalCompletionTokens.toLocaleString()}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Total Requests</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mt-2">
            {summary.totalRequests.toLocaleString()}
          </div>
          <span className="text-[11px] text-neutral-500 font-mono mt-1 block">
            API calls executed
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Active Models</span>
            <Bot className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mt-2">
            {Object.keys(summary.modelBreakdown).length}
          </div>
          <span className="text-[11px] text-neutral-500 font-mono mt-1 block">
            Distinct models invoked
          </span>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Provider Breakdown */}
        <div className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Provider Breakdown</span>
            </h3>
            <span className="text-xs text-neutral-500">Volume & Charges</span>
          </div>

          <div className="space-y-3">
            {Object.keys(summary.providerBreakdown).length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs">
                No provider requests recorded yet
              </div>
            ) : (
              Object.entries(summary.providerBreakdown).map(([prov, data]) => {
                const percent = summary.totalTokens > 0 ? (data.tokens / summary.totalTokens) * 100 : 0;
                return (
                  <div key={prov} className="space-y-1 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="capitalize text-white font-medium">{prov}</span>
                      <div className="space-x-2 text-neutral-400">
                        <span>{data.tokens.toLocaleString()} tok</span>
                        <span className="text-emerald-400">{formatCost(data.cost)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${Math.max(4, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Model Breakdown */}
        <div className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <span>Model Distribution</span>
            </h3>
            <span className="text-xs text-neutral-500">Invocations</span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {Object.keys(summary.modelBreakdown).length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs">
                No model requests recorded yet
              </div>
            ) : (
              Object.entries(summary.modelBreakdown).map(([mdl, data]) => (
                <div
                  key={mdl}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs font-mono"
                >
                  <span className="truncate text-neutral-200">{mdl}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-neutral-500">{data.requests} calls</span>
                    <span className="text-emerald-400 font-semibold">{formatCost(data.cost)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Request Logs Table */}
      <div className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Recent Execution Logs</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500 pb-2">
                <th className="py-2">Timestamp</th>
                <th className="py-2">Provider</th>
                <th className="py-2">Model</th>
                <th className="py-2">Task</th>
                <th className="py-2 text-right">Tokens</th>
                <th className="py-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850 text-neutral-300">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500">
                    No execution records in log
                  </td>
                </tr>
              ) : (
                records.slice(0, 20).map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-800/40">
                    <td className="py-2.5 text-neutral-500">
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 capitalize">{r.provider}</td>
                    <td className="py-2.5 text-indigo-300 truncate max-w-[180px]">{r.model}</td>
                    <td className="py-2.5 uppercase text-[10px] text-neutral-400">{r.taskType}</td>
                    <td className="py-2.5 text-right">{r.totalTokens.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-emerald-400">{formatCost(r.estimatedCost)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
