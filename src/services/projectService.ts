import JSZip from 'jszip';
import { Project, ProjectFile, DiffProposal } from '../types';

const PROJECTS_STORAGE_KEY = 'aura_dev_projects_v1';

export const STARTER_PROJECTS: Project[] = [
  {
    id: 'proj_pokecard',
    name: 'PokéCard Market Tracker',
    description: 'ポケモンカードのリアルタイム価格・レアリティ検索 & トレンド比較ツール',
    category: 'web',
    selectedModel: 'gemini-2.5-flash',
    selectedProvider: 'gemini',
    createdAt: Date.now() - 3600000 * 24 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    activeFileId: 'file_html_1',
    files: [
      {
        id: 'file_html_1',
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="ja" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PokéCard Market Tracker</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-neutral-950 text-neutral-100 min-h-screen p-6">
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-5">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-2xl">⚡</span>
          <h1 class="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">PokéCard Market</h1>
        </div>
        <p class="text-xs text-neutral-400 mt-1">最新の市場落札相場・レアリティフィルター・価格推移分析</p>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <div class="relative flex-1 sm:w-72">
          <input
            id="searchInput"
            type="text"
            placeholder="カード名、セット名で検索..."
            class="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
        <select id="rarityFilter" class="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-300 focus:outline-none focus:border-amber-500">
          <option value="ALL">全レアリティ</option>
          <option value="SAR">SAR</option>
          <option value="UR">UR</option>
          <option value="SA">SA</option>
          <option value="PROMO">PROMO</option>
        </select>
      </div>
    </header>

    <!-- Metrics overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4">
        <span class="text-xs text-neutral-400">平均取引価格</span>
        <div class="text-xl font-bold font-mono text-white mt-1">¥42,850</div>
        <span class="text-[11px] text-emerald-400">前週比 +8.4%</span>
      </div>
      <div class="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4">
        <span class="text-xs text-neutral-400">取引成立数 (24h)</span>
        <div class="text-xl font-bold font-mono text-white mt-1">1,420 件</div>
        <span class="text-[11px] text-emerald-400">活況</span>
      </div>
      <div class="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4">
        <span class="text-xs text-neutral-400">注目急上昇</span>
        <div class="text-xl font-bold text-amber-400 mt-1 truncate">リザードン ex</div>
        <span class="text-[11px] text-emerald-400">+14.2% (SAR)</span>
      </div>
      <div class="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4">
        <span class="text-xs text-neutral-400">監視カード数</span>
        <div class="text-xl font-bold font-mono text-white mt-1">2,850 枚</div>
        <span class="text-[11px] text-neutral-500">自動更新中</span>
      </div>
    </div>

    <!-- Cards Grid -->
    <div id="cardGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <!-- Injected via app.js -->
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>`
      },
      {
        id: 'file_css_1',
        name: 'styles.css',
        path: 'styles.css',
        language: 'css',
        content: `body {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

.card-hover {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s;
}

.card-hover:hover {
  transform: translateY(-2px);
  border-color: rgba(245, 158, 11, 0.4);
}`
      },
      {
        id: 'file_js_1',
        name: 'app.js',
        path: 'app.js',
        language: 'javascript',
        content: `const cardsData = [
  { id: 1, name: "リザードン ex (SAR)", set: "黒炎の支配者", price: 34800, change: "+12.4%", rarity: "SAR", icon: "🔥", volume: 38 },
  { id: 2, name: "ピカチュウ (プロモ)", set: "プレシャスコレクターBOX", price: 68000, change: "+3.8%", rarity: "PROMO", icon: "⚡", volume: 15 },
  { id: 3, name: "ナンジャモ (SAR)", set: "クレイバースト", price: 82000, change: "-1.2%", rarity: "SAR", icon: "🌟", volume: 44 },
  { id: 4, name: "ギラティナ V (SA)", set: "ロストアビス", price: 54000, change: "+8.9%", rarity: "SA", icon: "🌌", volume: 21 },
  { id: 5, name: "ミュウ ex (UR)", set: "ポケモンカード151", price: 15200, change: "+5.1%", rarity: "UR", icon: "🔮", volume: 56 },
  { id: 6, name: "ブラッキー VMAX (SA)", set: "イーブイヒーローズ", price: 295000, change: "+4.2%", rarity: "SA", icon: "🌙", volume: 9 },
  { id: 7, name: "ルギア V (SA)", set: "パラダイムトリガー", price: 42000, change: "+1.8%", rarity: "SA", icon: "🌊", volume: 27 },
  { id: 8, name: "ゲンガー VMAX (SA)", set: "ハイクラスデッキ", price: 78000, change: "-0.5%", rarity: "SA", icon: "👻", volume: 12 }
];

function render(list) {
  const container = document.getElementById('cardGrid');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = '<div class="col-span-full py-12 text-center text-neutral-500">該当するカードが見つかりませんでした</div>';
    return;
  }

  container.innerHTML = list.map(c => \`
    <div class="card-hover bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between mb-4">
          <span class="text-4xl p-2 bg-neutral-800/70 rounded-xl">\${c.icon}</span>
          <span class="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">\${c.rarity}</span>
        </div>
        <div class="text-xs text-neutral-400 mb-1">\${c.set}</div>
        <h3 class="text-lg font-bold text-white">\${c.name}</h3>
      </div>

      <div class="mt-6 border-t border-neutral-800/80 pt-4 flex items-end justify-between">
        <div>
          <span class="text-[10px] text-neutral-500 block">参考市場相場</span>
          <span class="text-2xl font-bold font-mono text-amber-400">¥\${c.price.toLocaleString()}</span>
        </div>
        <div class="text-right">
          <span class="text-xs font-mono font-semibold \${c.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}">\${c.change}</span>
          <span class="text-[10px] text-neutral-500 block">24h 出来高: \${c.volume}件</span>
        </div>
      </div>
    </div>
  \`).join('');
}

function handleFilter() {
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const rarity = document.getElementById('rarityFilter')?.value || 'ALL';

  const filtered = cardsData.filter(c => {
    const matchQuery = c.name.toLowerCase().includes(query) || c.set.toLowerCase().includes(query);
    const matchRarity = rarity === 'ALL' || c.rarity === rarity;
    return matchQuery && matchRarity;
  });

  render(filtered);
}

document.getElementById('searchInput')?.addEventListener('input', handleFilter);
document.getElementById('rarityFilter')?.addEventListener('change', handleFilter);

render(cardsData);`
      }
    ],
    chatHistory: [
      {
        id: 'msg_init',
        role: 'assistant',
        content: 'ポケモンカードの価格相場・レアリティ検索アプリの初期コードを生成しました。ファイルツリーから各ファイルを確認・編集できます。',
        timestamp: Date.now() - 3600000 * 2
      }
    ]
  },
  {
    id: 'proj_react_starter',
    name: 'Modern React App',
    description: 'TypeScript, Tailwind CSS, Material 3 Expressive UI を活用したコンポーネント構成',
    category: 'react',
    selectedModel: 'gpt-4o',
    selectedProvider: 'openai',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000,
    activeFileId: 'file_react_page',
    files: [
      {
        id: 'file_react_pkg',
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: `{
  "name": "aura-react-starter",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.546.0"
  }
}`
      },
      {
        id: 'file_react_page',
        name: 'App.tsx',
        path: 'src/App.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-6">
        <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 text-3xl">
          ✨
        </div>
        <h1 className="text-2xl font-bold tracking-tight">AURA DEV Starter</h1>
        <p class="text-sm text-neutral-400">
          Clean Material 3 Expressive layout with responsive state management.
        </p>
        <button
          onClick={() => setCount(c => c + 1)}
          className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition"
        >
          Clicked {count} times
        </button>
      </div>
    </div>
  );
}`
      }
    ],
    chatHistory: []
  }
];

export function getStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(STARTER_PROJECTS));
      return STARTER_PROJECTS;
    }
    return JSON.parse(raw);
  } catch {
    return STARTER_PROJECTS;
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch {}
}

export async function exportProjectAsZip(project: Project): Promise<void> {
  const zip = new JSZip();

  for (const file of project.files) {
    zip.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportProjectAsJson(project: Project): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
