import React, { useState } from 'react';
import { Copy, Check, Download, Play, Eye } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
  onRunPreview?: (code: string, language: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, onRunPreview }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      markdown: 'md'
    };
    const ext = extMap[language.toLowerCase()] || 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura_snippet_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isExecutableOrPreviewable = ['html', 'javascript', 'typescript', 'react', 'jsx', 'tsx', 'css'].includes(
    language.toLowerCase()
  );

  return (
    <div className="my-4 rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden font-mono text-xs">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/90 border-b border-neutral-800 text-neutral-400">
        <span className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px]">
          {language || 'text'}
        </span>

        <div className="flex items-center gap-1.5">
          {isExecutableOrPreviewable && onRunPreview && (
            <button
              onClick={() => onRunPreview(code, language)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition cursor-pointer text-[11px] font-semibold"
              title="Run or preview this code live in sandbox"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer text-[11px]"
            title="Download file"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer text-[11px]"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code body with line numbers */}
      <div className="p-4 overflow-x-auto text-neutral-200 leading-relaxed font-mono selection:bg-indigo-500/30">
        <pre className="text-xs">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
