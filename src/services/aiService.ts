import { ChatMessage, ProviderConfig, ProviderId } from '../types';
import { calculateCost } from '../utils/pricing';
import { sanitizeErrorMessage } from '../utils/security';
import { getAdapter } from './adapters';
import { recordUsage } from './usageTracker';

export interface ExecuteAIParams {
  provider: ProviderId;
  model: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  providerConfig?: ProviderConfig;
  temperature?: number;
  maxTokens?: number;
  isDemoMode?: boolean;
  taskType?: 'chat' | 'build' | 'edit' | 'agent';
  onChunk: (chunk: string) => void;
  signal?: AbortSignal;
}

export interface AIExecutionResult {
  fullText: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

// Categorize raw AI API errors into friendly actionable messages
export function formatAIError(rawError: string): { title: string; description: string; canSwitchModel: boolean } {
  const err = (rawError || '').toLowerCase();

  if (err.includes('invalid api key') || err.includes('unauthorized') || err.includes('401') || err.includes('api_key_invalid')) {
    return {
      title: 'Invalid API Key',
      description: 'The API key provided was rejected by the provider. Please verify your API key in Settings > AI Providers.',
      canSwitchModel: true
    };
  }

  if (err.includes('rate limit') || err.includes('429') || err.includes('quota') || err.includes('resource_exhausted')) {
    return {
      title: 'Rate Limit Exceeded',
      description: 'You have hit the rate limit or quota for this model. Try again in a few moments or switch to another provider.',
      canSwitchModel: true
    };
  }

  if (err.includes('credit') || err.includes('insufficient') || err.includes('billing') || err.includes('balance')) {
    return {
      title: 'Insufficient Credits',
      description: 'Your account with this provider does not have sufficient credits or an active billing plan.',
      canSwitchModel: true
    };
  }

  if (err.includes('model not found') || err.includes('404') || err.includes('does not exist')) {
    return {
      title: 'Model Not Found',
      description: 'The requested model is unavailable or your API key does not have permission to access it.',
      canSwitchModel: true
    };
  }

  return {
    title: 'Provider Error',
    description: sanitizeErrorMessage(rawError),
    canSwitchModel: true
  };
}

export async function executeAIRequest(params: ExecuteAIParams): Promise<AIExecutionResult> {
  const {
    provider,
    model,
    messages,
    providerConfig,
    temperature = 0.7,
    maxTokens = 4096,
    isDemoMode = false,
    taskType = 'chat',
    onChunk,
    signal
  } = params;

  // Check if real key is present
  const apiKey = providerConfig?.apiKey?.trim() || '';

  // Check model lifecycle status: reject Deprecated or Shutdown models without automatic fallback
  const targetModelOption = providerConfig?.models.find((m) => m.id === model);
  if (targetModelOption && (targetModelOption.status === 'Deprecated' || targetModelOption.status === 'Shutdown')) {
    throw new Error(`このモデル (${model}) は現在利用できません (${targetModelOption.status})。新しいモデルを選択してください。`);
  }

  // If Demo Mode or Key is missing, generate realistic demo stream
  if (isDemoMode || !apiKey) {
    return executeDemoSimulation(messages, model, provider, onChunk, signal);
  }

  const adapter = getAdapter(provider);

  try {
    const result = await adapter.streamText({
      model,
      messages,
      apiKey,
      baseUrl: providerConfig?.baseUrl,
      temperature,
      maxTokens,
      onChunk,
      signal
    });

    const totalTokens = result.promptTokens + result.completionTokens;
    const estimatedCost = calculateCost(model, result.promptTokens, result.completionTokens);

    // Record usage
    recordUsage({
      provider,
      model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens,
      estimatedCost,
      taskType
    });

    return {
      fullText: result.content,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens,
      estimatedCost
    };
  } catch (err: any) {
    const sanitized = sanitizeErrorMessage(err.message || String(err), [apiKey]);
    throw new Error(sanitized);
  }
}

// Realistic demo simulation when user runs in Demo Mode
async function executeDemoSimulation(
  messages: { role: string; content: string }[],
  model: string,
  provider: ProviderId,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<AIExecutionResult> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const queryLower = lastUserMsg.toLowerCase();

  let responseTemplate = '';

  if (queryLower.includes('ポケモン') || queryLower.includes('pokemon')) {
    responseTemplate = `### ⚡ ポケモンカード価格検索 & トラッカー Webアプリ

ポケモンのカード価格・レアリティ・相場推移を即座に検索・比較できるダッシュボードのコードを生成しました。

\`\`\`html
<!DOCTYPE html>
<html lang="ja" class="dark">
<head>
  <meta charset="UTF-8">
  <title>PokéCard Market Tracker</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-neutral-950 text-neutral-100 min-h-screen p-6">
  <div class="max-w-5xl mx-auto space-y-6">
    <header class="flex justify-between items-center border-b border-neutral-800 pb-4">
      <div>
        <h1 class="text-2xl font-bold text-amber-400">⚡ PokéCard Market</h1>
        <p class="text-xs text-neutral-400">リアルタイム相場・レアリティ検索</p>
      </div>
      <div class="flex gap-2">
        <input id="searchInput" type="text" placeholder="カード名を入力 (例: リザードン, ピカチュウ)..." class="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:border-amber-400">
        <button onclick="filterCards()" class="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 py-1.5 rounded-lg text-sm font-semibold transition">検索</button>
      </div>
    </header>

    <div id="cardGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <!-- カードリストはJavaScriptで自動生成 -->
    </div>
  </div>

  <script>
    const mockCards = [
      { name: "リザードン ex (SAR)", set: "黒炎の支配者", price: 34800, change: "+12.4%", rarity: "SAR", img: "🔥" },
      { name: "ピカチュウ (プロモ)", set: "プレシャスコレクター", price: 68000, change: "+3.8%", rarity: "PROMO", img: "⚡" },
      { name: "ナンジャモ (SAR)", set: "クレイバースト", price: 82000, change: "-1.2%", rarity: "SAR", img: "🌟" },
      { name: "ミュウ ex (UR)", set: "151", price: 15200, change: "+5.1%", rarity: "UR", img: "🔮" },
      { name: "ギラティナ V (SA)", set: "ロストアビス", price: 54000, change: "+8.9%", rarity: "SA", img: "🌌" },
      { name: "イーブイ (AR)", set: "クリムゾンヘイズ", price: 3400, change: "0.0%", rarity: "AR", img: "🦊" }
    ];

    function renderCards(cards) {
      const grid = document.getElementById('cardGrid');
      grid.innerHTML = cards.map(c => \`
        <div class="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/50 transition">
          <div class="flex justify-between items-start mb-4">
            <span class="text-4xl">\${c.img}</span>
            <span class="text-xs px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-mono">\${c.rarity}</span>
          </div>
          <div>
            <div class="text-xs text-neutral-400">\${c.set}</div>
            <div class="font-bold text-lg text-white mb-2">\${c.name}</div>
          </div>
          <div class="flex justify-between items-end border-t border-neutral-800 pt-3 mt-2">
            <div>
              <div class="text-[10px] text-neutral-500">最新市場価格</div>
              <div class="text-xl font-bold font-mono text-amber-400">¥\${c.price.toLocaleString()}</div>
            </div>
            <span class="text-xs font-mono font-semibold \${c.change.startsWith('+') ? 'text-emerald-400' : c.change.startsWith('-') ? 'text-rose-400' : 'text-neutral-400'}">\${c.change}</span>
          </div>
        </div>
      \`).join('');
    }

    function filterCards() {
      const q = document.getElementById('searchInput').value.trim().toLowerCase();
      renderCards(mockCards.filter(c => c.name.toLowerCase().includes(q) || c.set.toLowerCase().includes(q)));
    }

    renderCards(mockCards);
  </script>
</body>
</html>
\`\`\`

**特徴:**
- リアルタイム検索フィルター & レアリティ別タグ表示
- Material 3 ExpressiveスタイルのダークテーマUI
- 上部「Run」ボタンを押すとサンドボックスでプレビュー可能です。`;
  } else if (queryLower.includes('修正') || queryLower.includes('バグ') || queryLower.includes('fix') || queryLower.includes('diff')) {
    responseTemplate = `コードを精査し、以下の最適化とバグ修正を適用しました。

**修正ハイライト:**
1. \`useEffect\` の依存配列の不整合による無限再レンダリングを修正
2. メモリリーク防止のためイベントリスナーのクリーンアップを追加
3. ユーザー入力に対するサニタイズ処理を追加しXSSを防御
4. Material 3 Expressive トークンに合わせたパディング・角丸の統一

\`\`\`typescript
import React, { useState, useEffect, useCallback } from 'react';

export function OptimizedComponent() {
  const [data, setData] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 安全なデータ取得
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Fetch failed');
      const items = await res.json();
      setData(items);
    } catch (err) {
      console.warn('Recoverable fetch error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
      <h2 className="text-lg font-semibold text-white">Data List</h2>
      {isLoading ? (
        <div className="text-neutral-400 text-sm mt-2">Loading...</div>
      ) : (
        <ul className="mt-4 space-y-2">
          {data.map((item, idx) => (
            <li key={idx} className="p-2 bg-neutral-950 rounded-lg text-sm text-neutral-300">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
\`\`\`

Diff Viewerで変更差分を確認し「Apply」を押すことでワンクリック反映できます。`;
  } else {
    responseTemplate = `こんにちは！**AURA DEV** へようこそ。

現在 **Demo Mode** で動作しています。実際のAIモデル（Gemini 2.5 Pro, GPT-4o, Claude 3.5 Sonnet, Groq Llama 3.3 など）で高速・高精度な応答を得るには、画面右上の「AI Providers」またはサイドバーの「API Keys」からご自身のAPIキーを登録してください。

### AURA DEV でできること
1. **BYOK (Bring Your Own Key)**:
   - Google Gemini、OpenAI、OpenRouter、Groq、Anthropic Claude、Mistral、Cerebras、xAI、DeepSeek、Custom OpenAI互換APIのキーを登録
2. **Auto Router**:
   - 登録されたAPIキーの中から、速度や推論タスクに最適なモデルを自動選択
3. **Build Mode (Web App生成)**:
   - 自然言語の指示から複数ファイルで構成された完全なWebアプリケーションを即座に生成
   - 画面内で直接インタラクティブに動作確認できるサンドボックスプレビュー
4. **Project & AI Code Edit (Diff Viewer)**:
   - ファイルツリー管理、コードエディタ、差分を視覚化して「Apply/Reject」できるAIコード修正
5. **Custom Agents**:
   - 独自のシステムプロンプト、ツール、ナレッジを備えた専任AIエージェントの作成

何か具体的なコード生成やプロジェクト作成をお手伝いしましょうか？`;
  }

  // Stream in realistic chunks
  const chunkSize = 16;
  for (let i = 0; i < responseTemplate.length; i += chunkSize) {
    if (signal?.aborted) break;
    const chunk = responseTemplate.slice(i, i + chunkSize);
    onChunk(chunk);
    await new Promise((resolve) => setTimeout(resolve, 15));
  }

  const promptTokens = Math.round(lastUserMsg.length / 4) + 20;
  const completionTokens = Math.round(responseTemplate.length / 4);

  return {
    fullText: responseTemplate,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    estimatedCost: 0
  };
}
