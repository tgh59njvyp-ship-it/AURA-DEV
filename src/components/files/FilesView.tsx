import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Upload,
  Files,
  FileCode,
  FileText,
  FileJson,
  Image,
  Trash2,
  Sparkles,
  Download,
  Copy,
  Check
} from 'lucide-react';

interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  uploadedAt: number;
}

export const FilesView: React.FC = () => {
  const { setActiveTab, showNotification } = useApp();

  const [files, setFiles] = useState<StoredFile[]>(() => {
    try {
      const stored = localStorage.getItem('aura_dev_user_files_v1');
      return stored
        ? JSON.parse(stored)
        : [
            {
              id: 'file_demo_readme',
              name: 'ARCHITECTURE.md',
              size: 1420,
              type: 'text/markdown',
              content: `# AURA DEV Workspace Architecture
- BYOK (Bring-Your-Own-Key) stateless proxy
- Multi-provider adapter pattern
- Real-time client Diff computation
- Sandboxed iframe execution`,
              uploadedAt: Date.now() - 3600000 * 12
            }
          ];
    } catch {
      return [];
    }
  });

  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const selectedFile = files.find((f) => f.id === selectedFileId) || files[0] || null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    Array.from(uploaded).forEach((file) => {
      const reader = new FileReader();
      const isImg = file.type.startsWith('image/');

      reader.onload = (event) => {
        const content = event.target?.result as string;
        const newFile: StoredFile = {
          id: 'user_f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          content,
          uploadedAt: Date.now()
        };

        setFiles((prev) => {
          const updated = [newFile, ...prev];
          try {
            localStorage.setItem('aura_dev_user_files_v1', JSON.stringify(updated));
          } catch {}
          return updated;
        });
        setSelectedFileId(newFile.id);
        showNotification('success', `Uploaded ${file.name}`);
      };

      if (isImg) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      try {
        localStorage.setItem('aura_dev_user_files_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showNotification('info', 'File removed');
  };

  const handleCopyContent = async () => {
    if (!selectedFile) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: selectedFile.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string, name: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4 text-purple-400" />;
    if (name.endsWith('.json')) return <FileJson className="w-4 h-4 text-amber-400" />;
    if (name.endsWith('.md')) return <FileText className="w-4 h-4 text-blue-400" />;
    return <FileCode className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider">
            <Files className="w-4 h-4" />
            <span>WORKSPACE REPOSITORY</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Files Manager
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Upload code, datasets, documentation, or design assets to analyze and inject into AI prompts.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: File List */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-2">
            <span>Stored Files ({files.length})</span>
            <span>Local Vault</span>
          </div>

          <div className="space-y-1">
            {files.map((file) => {
              const isSelected = selectedFile?.id === file.id;
              return (
                <div
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl transition cursor-pointer group ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/30 text-white'
                      : 'hover:bg-neutral-800/80 text-neutral-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    {getFileIcon(file.type, file.name)}
                    <div className="truncate">
                      <div className="text-xs font-medium truncate">{file.name}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: File Content Viewer */}
        <div className="lg:col-span-2 bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between">
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFile.type, selectedFile.name)}
                  <h3 className="text-sm font-bold text-white font-mono">{selectedFile.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyContent}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Viewer body */}
              {selectedFile.type.startsWith('image/') ? (
                <div className="p-4 bg-neutral-950 rounded-2xl flex items-center justify-center max-h-96 overflow-hidden">
                  <img
                    src={selectedFile.content}
                    alt={selectedFile.name}
                    className="max-h-80 object-contain rounded-lg"
                  />
                </div>
              ) : (
                <pre className="bg-neutral-950 p-4 rounded-2xl font-mono text-xs text-neutral-300 overflow-auto max-h-96 leading-relaxed select-text border border-neutral-800/80">
                  <code>{selectedFile.content}</code>
                </pre>
              )}

              {/* Quick AI Analyze CTA */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Inject this file into AI Chat for automated analysis or bug fixing
                </span>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze in Chat</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-neutral-500 text-xs">
              Select or upload a file to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
