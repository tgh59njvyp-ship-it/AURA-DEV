import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wand2,
  Play,
  RotateCw,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Download,
  FolderPlus,
  Send,
  Square,
  Sparkles,
  Code,
  Eye,
  Check,
  FileCode,
  AlertTriangle
} from 'lucide-react';
import { executeAIRequest } from '../../services/aiService';
import { exportProjectAsZip } from '../../services/projectService';
import { Project, ProjectFile } from '../../types';

export const BuildView: React.FC = () => {
  const {
    activeProvider,
    activeModel,
    providers,
    isDemoMode,
    createProject,
    setActiveTab,
    showNotification,
    pinnedModelDeprecatedWarning
  } = useApp();

  const [prompt, setPrompt] = useState('ポケモンカードの価格を検索できるサイトを作って');
  const [isGenerating, setIsGenerating] = useState(false);
  const [deviceViewport, setDeviceViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTabMode, setActiveTabMode] = useState<'preview' | 'code'>('preview');
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  // Multi-file generated application state
  const [files, setFiles] = useState<ProjectFile[]>([
    {
      id: 'f_html',
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
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .card-transition { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    .card-transition:hover { transform: translateY(-3px); border-color: rgba(245, 158, 11, 0.4); }
  </style>
</head>
<body class="bg-neutral-950 text-neutral-100 min-h-screen p-6">
  <div class="max-w-6xl mx-auto space-y-6">
    <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-5">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-3xl">⚡</span>
          <h1 class="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">PokéCard Market</h1>
        </div>
        <p class="text-xs text-neutral-400 mt-1">リアルタイム落札価格・レアリティフィルター・24h出来高分析</p>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <input
          id="searchInput"
          type="text"
          placeholder="カード名で検索 (例: リザードン, ピカチュウ)..."
          class="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition w-full sm:w-64"
        />
        <select id="rarityFilter" class="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-amber-400">
          <option value="ALL">全レアリティ</option>
          <option value="SAR">SAR</option>
          <option value="UR">UR</option>
          <option value="SA">SA</option>
          <option value="PROMO">PROMO</option>
        </select>
      </div>
    </header>

    <!-- Cards Grid -->
    <div id="cardGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"></div>
  </div>

  <script src="app.js"></script>
</body>
</html>`
    },
    {
      id: 'f_js',
      name: 'app.js',
      path: 'app.js',
      language: 'javascript',
      content: `const cardsData = [
  { id: 1, name: "リザードン ex (SAR)", set: "黒炎の支配者", price: 34800, change: "+12.4%", rarity: "SAR", icon: "🔥", volume: 38 },
  { id: 2, name: "ピカチュウ (プロモ)", set: "プレシャスコレクターBOX", price: 68000, change: "+3.8%", rarity: "PROMO", icon: "⚡", volume: 15 },
  { id: 3, name: "ナンジャモ (SAR)", set: "クレイバースト", price: 82000, change: "-1.2%", rarity: "SAR", icon: "🌟", volume: 44 },
  { id: 4, name: "ギラティナ V (SA)", set: "ロストアビス", price: 54000, change: "+8.9%", rarity: "SA", icon: "🌌", volume: 21 },
  { id: 5, name: "ミュウ ex (UR)", set: "151", price: 15200, change: "+5.1%", rarity: "UR", icon: "🔮", volume: 56 },
  { id: 6, name: "ブラッキー VMAX (SA)", set: "イーブイヒーローズ", price: 295000, change: "+4.2%", rarity: "SA", icon: "🌙", volume: 9 }
];

function render(list) {
  const container = document.getElementById('cardGrid');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = '<div class="col-span-full py-12 text-center text-neutral-500">該当するカードが見つかりませんでした</div>';
    return;
  }

  container.innerHTML = list.map(c => \`
    <div class="card-transition bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between mb-4">
          <span class="text-4xl p-2 bg-neutral-800/80 rounded-xl">\${c.icon}</span>
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
  ]);

  const [revisionPrompt, setRevisionPrompt] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate combined HTML bundle for live iframe execution
  const bundledHtml = useMemo(() => {
    const htmlFile = files.find((f) => f.name.endsWith('.html'))?.content || '<div>No HTML</div>';
    const cssFile = files.find((f) => f.name.endsWith('.css'))?.content || '';
    const jsFile = files.find((f) => f.name.endsWith('.js'))?.content || '';

    // Inject css and js into html
    let combined = htmlFile;
    if (cssFile) {
      combined = combined.replace('</head>', `<style>${cssFile}</style></head>`);
    }
    if (jsFile) {
      combined = combined.replace('</body>', `<script>${jsFile}</script></body>`);
    }
    return combined;
  }, [files]);

  const reloadIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = bundledHtml;
    }
  };

  const handleGenerateApp = async (customInstruction?: string) => {
    const instruction = customInstruction || prompt;
    if (!instruction.trim() || isGenerating) return;

    setIsGenerating(true);
    const provConfig = providers.find((p) => p.id === activeProvider);

    const systemPrompt = `You are an elite Autonomous Fullstack Web Engineer.
When asked to build a web application, generate complete, working, production-grade code.
Always format your response with clean code blocks:
\`\`\`html
<!-- index.html -->
...
\`\`\`
\`\`\`javascript
// app.js
...
\`\`\`
Use modern Tailwind CSS and Material 3 Expressive aesthetics. Do NOT provide placeholders or truncated code.`;

    const currentFilesSummary = files.map((f) => `File: ${f.name}\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join('\n\n');

    const userMsg = `Current project files:\n${currentFilesSummary}\n\nUser Request: ${instruction}\n\nPlease generate the updated working files.`;

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    let accumulatedText = '';

    try {
      await executeAIRequest({
        provider: activeProvider,
        model: activeModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg }
        ],
        providerConfig: provConfig,
        isDemoMode,
        taskType: 'build',
        signal: abortCtrl.signal,
        onChunk: (chunk) => {
          accumulatedText += chunk;
        }
      });

      // Parse generated code blocks
      const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
      let match;
      const parsedFiles: ProjectFile[] = [];

      while ((match = codeBlockRegex.exec(accumulatedText)) !== null) {
        const lang = match[1] || 'html';
        const code = match[2];

        let fileName = 'index.html';
        if (lang === 'html') fileName = 'index.html';
        else if (lang === 'css') fileName = 'styles.css';
        else if (lang === 'javascript' || lang === 'js') fileName = 'app.js';
        else if (lang === 'typescript' || lang === 'ts' || lang === 'tsx') fileName = 'App.tsx';

        parsedFiles.push({
          id: 'file_' + Date.now() + '_' + parsedFiles.length,
          name: fileName,
          path: fileName,
          language: lang,
          content: code
        });
      }

      if (parsedFiles.length > 0) {
        setFiles(parsedFiles);
        showNotification('success', 'Generated application files updated!');
      } else {
        showNotification('info', 'Generation completed.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        showNotification('error', `Build generation error: ${err.message}`);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleSaveAsProject = () => {
    const proj = createProject(
      prompt.slice(0, 30) || 'AI Generated App',
      'Created with AURA DEV AI Builder',
      'web'
    );
    proj.files = files;
    setActiveTab('projects');
    showNotification('success', `Saved as project "${proj.name}"`);
  };

  const handleExportZip = async () => {
    const mockProj: Project = {
      id: 'build_export',
      name: 'aura_built_app',
      description: prompt,
      category: 'web',
      files,
      activeFileId: files[0]?.id || '',
      selectedModel: activeModel,
      selectedProvider: activeProvider,
      chatHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await exportProjectAsZip(mockProj);
    showNotification('success', 'Project exported as ZIP');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-neutral-950">
      {/* Deprecated Fixed Model Warning Banner */}
      {pinnedModelDeprecatedWarning && (
        <div className="px-6 py-3 bg-rose-950/40 border-b border-rose-500/40 text-rose-200 flex items-center justify-between text-xs animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold text-white mr-1.5">Your fixed model is deprecated:</span>
              <span className="text-rose-300">「{pinnedModelDeprecatedWarning}」Please select another available model.</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('models')}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] shrink-0 transition cursor-pointer"
          >
            モデル一覧で選択
          </button>
        </div>
      )}

      {/* Top Builder Control Bar */}
      <div className="p-4 border-b border-neutral-800 bg-neutral-950/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Prompt Input & Presets */}
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="何を作りたいですか？ (例: ポケモンカードの価格を検索できるサイトを作って)"
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none transition pr-24"
            />
            {isGenerating ? (
              <button
                onClick={() => abortControllerRef.current?.abort()}
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={() => handleGenerateApp()}
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Wand2 className="w-3 h-3" />
                <span>Build</span>
              </button>
            )}
          </div>
        </div>

        {/* Viewport switchers & Actions */}
        <div className="flex items-center gap-2 justify-end">
          {/* Tab mode: Preview vs Code */}
          <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
            <button
              onClick={() => setActiveTabMode('preview')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTabMode === 'preview'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTabMode('code')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTabMode === 'code'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code ({files.length})</span>
            </button>
          </div>

          {/* Viewport switchers (only relevant on preview) */}
          {activeTabMode === 'preview' && (
            <div className="hidden sm:flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
              <button
                onClick={() => setDeviceViewport('desktop')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  deviceViewport === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceViewport('tablet')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  deviceViewport === 'tablet' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
                title="Tablet View (768px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceViewport('mobile')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  deviceViewport === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
                title="Mobile View (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={reloadIframe}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Reload sandbox"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportZip}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Download ZIP"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleSaveAsProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            title="Save as persistent project"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Save to Projects</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area: Preview or Code */}
      <div className="flex-1 flex overflow-hidden">
        {activeTabMode === 'preview' ? (
          <div className="flex-1 bg-neutral-950 flex items-center justify-center p-4 overflow-auto">
            <div
              className={`h-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${
                deviceViewport === 'desktop'
                  ? 'w-full'
                  : deviceViewport === 'tablet'
                  ? 'w-[768px]'
                  : 'w-[375px]'
              }`}
            >
              {/* Fake browser chrome bar */}
              <div className="h-8 bg-neutral-950 border-b border-neutral-800 px-4 flex items-center justify-between text-xs text-neutral-500 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="font-mono text-[11px] text-neutral-400">
                  sandbox.auradev.app / {prompt.slice(0, 20)}...
                </span>
                <span className="text-[10px] text-neutral-500">Live</span>
              </div>

              {/* Sandboxed iframe */}
              <iframe
                ref={iframeRef}
                title="AI App Sandbox"
                srcDoc={bundledHtml}
                sandbox="allow-scripts allow-forms allow-modals"
                className="flex-1 w-full h-full border-0 bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden">
            {/* File tabs */}
            <div className="flex items-center px-4 bg-neutral-900/60 border-b border-neutral-800 overflow-x-auto">
              {files.map((file, idx) => (
                <button
                  key={file.id}
                  onClick={() => setActiveFileIndex(idx)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono border-b-2 transition cursor-pointer ${
                    activeFileIndex === idx
                      ? 'border-indigo-500 text-white bg-neutral-900'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{file.name}</span>
                </button>
              ))}
            </div>

            {/* Code Editor */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs">
              <textarea
                value={files[activeFileIndex]?.content || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFiles((prev) =>
                    prev.map((f, i) => (i === activeFileIndex ? { ...f, content: val } : f))
                  );
                }}
                className="w-full h-full bg-neutral-950 text-neutral-200 font-mono text-xs p-4 rounded-xl border border-neutral-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Revision Prompt Bar */}
      <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400 shrink-0 ml-2" />
        <input
          type="text"
          value={revisionPrompt}
          onChange={(e) => setRevisionPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleGenerateApp(revisionPrompt);
              setRevisionPrompt('');
            }
          }}
          placeholder="AIに変更を指示 (例: ダークモードを追加して, 検索フィルターを追加して)..."
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={() => {
            handleGenerateApp(revisionPrompt);
            setRevisionPrompt('');
          }}
          disabled={!revisionPrompt.trim() || isGenerating}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Apply Revision</span>
        </button>
      </div>
    </div>
  );
};
