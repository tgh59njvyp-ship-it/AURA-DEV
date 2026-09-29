import { UsageRecord, ProviderId } from '../types';

const USAGE_STORAGE_KEY = 'aura_dev_usage_records_v1';

export function getUsageRecords(): UsageRecord[] {
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordUsage(record: Omit<UsageRecord, 'id' | 'timestamp'>): UsageRecord {
  const fullRecord: UsageRecord = {
    ...record,
    id: 'use_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: Date.now()
  };

  try {
    const records = getUsageRecords();
    records.unshift(fullRecord);
    // Keep last 500 records
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(records.slice(0, 500)));
  } catch {}

  return fullRecord;
}

export function clearUsageRecords(): void {
  try {
    localStorage.removeItem(USAGE_STORAGE_KEY);
  } catch {}
}

export interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostUSD: number;
  providerBreakdown: Record<ProviderId, { requests: number; tokens: number; cost: number }>;
  modelBreakdown: Record<string, { requests: number; tokens: number; cost: number }>;
}

export function getUsageSummary(): UsageSummary {
  const records = getUsageRecords();
  const summary: UsageSummary = {
    totalRequests: records.length,
    totalTokens: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalCostUSD: 0,
    providerBreakdown: {} as any,
    modelBreakdown: {}
  };

  for (const r of records) {
    summary.totalTokens += r.totalTokens || 0;
    summary.totalPromptTokens += r.promptTokens || 0;
    summary.totalCompletionTokens += r.completionTokens || 0;
    summary.totalCostUSD += r.estimatedCost || 0;

    if (!summary.providerBreakdown[r.provider]) {
      summary.providerBreakdown[r.provider] = { requests: 0, tokens: 0, cost: 0 };
    }
    summary.providerBreakdown[r.provider].requests += 1;
    summary.providerBreakdown[r.provider].tokens += r.totalTokens || 0;
    summary.providerBreakdown[r.provider].cost += r.estimatedCost || 0;

    if (!summary.modelBreakdown[r.model]) {
      summary.modelBreakdown[r.model] = { requests: 0, tokens: 0, cost: 0 };
    }
    summary.modelBreakdown[r.model].requests += 1;
    summary.modelBreakdown[r.model].tokens += r.totalTokens || 0;
    summary.modelBreakdown[r.model].cost += r.estimatedCost || 0;
  }

  return summary;
}
