import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DiffProposal, ProjectFile } from '../../types';
import { DiffViewerModal } from './DiffViewerModal';
import { executeAIRequest } from '../../services/aiService';
import { exportProjectAsZip, exportProjectAsJson } from '../../services/projectService';
import {
  Folder,
  FolderOpen,
  FileCode,
  Plus,
  Trash2,
  Download,
  Save,
  Wand2,
  Sparkles,
  GitCompare,
  Check,
  Send,
  Square,
  FileText,
  FileJson,
  ChevronRight,
  Code
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    createProject,
    deleteProject,
    updateFileContent,
    createFileInProject,
    deleteFileInProject,
    activeProvider,
    activeModel,
    providers,
    isDemoMode,
    showNotification
  } = useApp();

  const [activeFileId, setActiveFileId] = useState<string>(activeProject?.files[0]?.id || '');
  const [editedContent, setEditedContent] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // AI Code Edit state
  const [aiInstruction, setAiInstruction] = useState<string>('');
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [currentProposal, setCurrentProposal] = useState<DiffProposal | null>(null);

  // New File modal state
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const activeFile = useMemo(() => {
    if (!activeProject) return null;
    return activeProject.files.find((f) => f.id === activeFileId) || activeProject.files[0] || null;
  }, [activeProject, activeFileId]);

  // Sync editor content when active file changes
  React.useEffect(() => {
    if (activeFile) {
      setEditedContent(activeFile.content);
      setHasUnsavedChanges(false);
    }
  }, [activeFile?.id]);

  const handleEditorChange = (val: string) => {
    setEditedContent(val);
    setHasUnsavedChanges(val !== activeFile?.content);
  };

  const handleSaveFile = () => {
    if (!activeProject || !activeFile) return;
    updateFileContent(activeProject.id, activeFile.id, editedContent);
    setHasUnsavedChanges(false);
    showNotification('success', `Saved ${activeFile.name}`);
  };

  const handleCreateNewFile = () => {
    if (!activeProject || !newFileName.trim()) return;
    createFileInProject(activeProject.id, newFileName.trim());
    setNewFileName('');
    setIsCreatingFile(false);
  };

  // AI Code Edit Assistant request
  const handleRunAiCodeEdit = async (instructionToRun?: string) => {
    const prompt = instructionToRun || aiInstruction;
    if (!prompt.trim() || !activeFile || isAiProcessing) return;

    setIsAiProcessing(true);
    const provConfig = providers.find((p) => p.id === activeProvider);

    const systemPrompt = `You are an elite Senior Staff Software Engineer and Code Reviewer.
The user wants you to inspect and modify a specific source file.
Analyze the provided original code and the user's instruction.
Output your response with:
1. A brief 1-2 sentence explanation of your modifications.
2. The entire updated code inside a single code block matching the file format:
\`\`\`${activeFile.language}
// updated code here
\`\`\`
Do not omit parts with comments like "...rest of code". Provide the full updated file so a clean diff can be formed.`;

    const userPrompt = `File Path: ${activeFile.path}
File Language: ${activeFile.language}

Current File Content:
\`\`\`${activeFile.language}
${editedContent}
\`\`\`

User Request: ${prompt}

Please review and provide the modified code.`;

    let accumulated = '';

    try {
      await executeAIRequest({
        provider: activeProvider,
        model: activeModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        providerConfig: provConfig,
        isDemoMode,
        taskType: 'edit',
        onChunk: (chunk) => {
          accumulated += chunk;
        }
      });

      // Extract code block
      const codeBlockMatch = /```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g.exec(accumulated);
      let newCode = codeBlockMatch ? codeBlockMatch[1] : '';

      // If no code block found, fallback to full text
      if (!newCode) {
        newCode = accumulated;
      }

      // Extract brief explanation (anything before the code block)
      const explanation = accumulated.split('```')[0].trim() || 'Modifications applied per instructions.';

      const proposal: DiffProposal = {
        id: 'diff_' + Date.now(),
        projectId: activeProject!.id,
        fileId: activeFile.id,
        filePath: activeFile.path,
        originalContent: editedContent,
        newContent: newCode,
        instruction: prompt,
        explanation,
        status: 'pending',
        timestamp: Date.now()
      };

      setCurrentProposal(proposal);
      setAiInstruction('');
    } catch (err: any) {
      showNotification('error', `AI Code Edit Error: ${err.message}`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplyDiff = () => {
    if (!currentProposal || !activeProject) return;
    updateFileContent(activeProject.id, currentProposal.fileId, currentProposal.newContent);
    setEditedContent(currentProposal.newContent);
    setHasUnsavedChanges(false);
    setCurrentProposal(null);
    showNotification('success', `Applied AI diff to ${currentProposal.filePath}`);
  };

  const handleRejectDiff = () => {
    setCurrentProposal(null);
    showNotification('info', 'Proposed diff rejected.');
  };

  const presetAiPrompts = [
    'このコードを修正して',
    'バグを探して',
    'スマホ対応にして',
    'Material 3 Expressive風のUIにして',
    'ダークモードを追加して'
  ];

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.json')) return <FileJson className="w-3.5 h-3.5 text-amber-400" />;
    if (fileName.endsWith('.md')) return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    return <FileCode className="w-3.5 h-3.5 text-indigo-400" />;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-neutral-950">
      {/* Top Project Header Bar */}
      <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Project Selector dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-indigo-400" />
            <select
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.files.length} files)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => createProject(`Project ${projects.length + 1}`, 'New workspace project')}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Create new project"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Project Actions */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-[11px] text-amber-400 font-mono">Unsaved edits</span>
          )}

          <button
            onClick={handleSaveFile}
            disabled={!hasUnsavedChanges}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={() => activeProject && exportProjectAsZip(activeProject)}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Download Project ZIP"
          >
            <Download className="w-4 h-4" />
          </button>

          {projects.length > 1 && (
            <button
              onClick={() => activeProject && deleteProject(activeProject.id)}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-rose-400 transition cursor-pointer"
              title="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main 3-Column Split View: File Tree | Editor | AI Code Assistant */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: File Tree */}
        <div className="w-56 shrink-0 border-r border-neutral-800 bg-neutral-950 flex flex-col">
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-300 uppercase tracking-wider text-[10px]">
              Files
            </span>
            <button
              onClick={() => setIsCreatingFile(true)}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              title="Add file"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New file input form */}
          {isCreatingFile && (
            <div className="p-2 border-b border-neutral-800 flex items-center gap-1.5">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNewFile()}
                placeholder="Component.tsx"
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <button
                onClick={handleCreateNewFile}
                className="p-1 bg-indigo-600 rounded text-white"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* File list */}
          <div className="flex-1 p-2 space-y-1 overflow-y-auto">
            {activeProject?.files.map((file) => {
              const isSelected = activeFile?.id === file.id;
              return (
                <div
                  key={file.id}
                  onClick={() => {
                    setActiveFileId(file.id);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer group ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {getFileIcon(file.name)}
                    <span className="truncate">{file.path}</span>
                  </div>

                  {activeProject.files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFileInProject(activeProject.id, file.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-0.5 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Code Editor */}
        <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
          {/* Active File Bar */}
          <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs font-mono text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{activeFile?.path || 'Untitled'}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-[11px] text-neutral-500 uppercase">{activeFile?.language}</span>
            </div>
            <div className="text-[11px] text-neutral-500">
              {editedContent.split('\n').length} lines
            </div>
          </div>

          {/* Editor Area with Line Numbers */}
          <div className="flex-1 flex overflow-hidden font-mono text-xs">
            {/* Line numbers gutter */}
            <div className="w-12 bg-neutral-950/70 border-r border-neutral-800/80 p-4 text-right text-neutral-600 select-none overflow-hidden">
              {editedContent.split('\n').map((_, i) => (
                <div key={i} className="leading-relaxed">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={editedContent}
              onChange={(e) => handleEditorChange(e.target.value)}
              className="flex-1 bg-neutral-950 text-neutral-200 font-mono text-xs p-4 leading-relaxed focus:outline-none resize-none selection:bg-indigo-500/30 overflow-auto"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Column: AI Code Assistant Panel */}
        <div className="w-80 shrink-0 border-l border-neutral-800 bg-neutral-950/90 flex flex-col">
          <div className="p-3.5 border-b border-neutral-800 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white">AI Code Assistant</h3>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {/* Preset prompt buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-neutral-400">
                Quick Prompts
              </span>
              <div className="space-y-1">
                {presetAiPrompts.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRunAiCodeEdit(preset)}
                    disabled={isAiProcessing}
                    className="w-full text-left px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition cursor-pointer flex items-center justify-between group disabled:opacity-50"
                  >
                    <span>{preset}</span>
                    <Sparkles className="w-3.5 h-3.5 text-neutral-500 group-hover:text-purple-400 transition" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Instruction Box */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <span className="text-[11px] font-semibold text-neutral-400">
                Custom Instruction
              </span>
              <textarea
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="例: このコンポーネントをアクセシブルにしてキーボードナビゲーションを追加..."
                rows={4}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
              />

              <button
                onClick={() => handleRunAiCodeEdit()}
                disabled={!aiInstruction.trim() || isAiProcessing}
                className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {isAiProcessing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing & generating diff...</span>
                  </>
                ) : (
                  <>
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Generate Diff Review</span>
                  </>
                )}
              </button>
            </div>

            {/* Info note */}
            <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
              <span className="text-white font-medium">Diff Workflow: </span>
              AI generates changes without overwriting your file directly. You will see a side-by-side Diff Viewer with Apply and Reject controls.
            </div>
          </div>
        </div>
      </div>

      {/* Diff Viewer Modal */}
      {currentProposal && (
        <DiffViewerModal
          proposal={currentProposal}
          onApply={handleApplyDiff}
          onReject={handleRejectDiff}
        />
      )}
    </div>
  );
};
