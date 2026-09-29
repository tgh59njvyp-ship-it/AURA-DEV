import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ChatMessage, Attachment } from '../../types';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import { executeAIRequest } from '../../services/aiService';
import {
  Trash2,
  Download,
  Sparkles,
  Zap,
  Bot,
  ExternalLink,
  Code,
  X,
  Play,
  AlertTriangle
} from 'lucide-react';

export const ChatView: React.FC = () => {
  const {
    activeProvider,
    activeModel,
    providers,
    isAutoRouter,
    evaluateAutoRoute,
    isDemoMode,
    setActiveTab,
    showNotification,
    pinnedModelDeprecatedWarning
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem('aura_dev_chat_history_v1');
      return stored
        ? JSON.parse(stored)
        : [
            {
              id: 'init_aura_welcome',
              role: 'assistant',
              content: `### Welcome to AURA DEV ⚡

Bring your own API key to access Google Gemini, OpenAI, OpenRouter, Groq, Anthropic, and custom endpoints under a single developer workspace.

**Quick Prompts to Try:**
- \`ポケモンカードの価格を検索できるサイトを作って\`
- \`Explain zero-knowledge rollups and generate a Rust/Solidity snippet\`
- \`Create a modern Material 3 Expressive dashboard component in React\`
- \`Refactor this async pipeline to prevent race conditions\``,
              timestamp: Date.now()
            }
          ];
    } catch {
      return [];
    }
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live code runner preview modal
  const [runningCode, setRunningCode] = useState<{ code: string; language: string } | null>(null);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem('aura_dev_chat_history_v1', JSON.stringify(messages.slice(-50)));
    } catch {}
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    if (!text.trim() && attachments.length === 0) return;

    // Auto-router evaluation
    let targetProvider = activeProvider;
    let targetModel = activeModel;
    if (isAutoRouter) {
      const route = evaluateAutoRoute(text);
      if (route) {
        targetProvider = route.provider;
        targetModel = route.model;
      }
    }

    const provConfig = providers.find((p) => p.id === targetProvider);

    // Form user message
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments
    };

    // Form initial assistant streaming message
    const assistantMsgId = 'msg_' + (Date.now() + 1);
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: targetModel,
      providerUsed: targetProvider,
      isStreaming: true
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setIsStreaming(true);

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    try {
      // Build conversation payload
      const chatPayload = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content
      }));

      const result = await executeAIRequest({
        provider: targetProvider,
        model: targetModel,
        messages: chatPayload,
        providerConfig: provConfig,
        isDemoMode,
        taskType: 'chat',
        signal: abortCtrl.signal,
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: m.content + chunk } : m
            )
          );
        }
      });

      // Finalize message with token metrics
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: result.fullText,
                isStreaming: false,
                tokenUsage: {
                  promptTokens: result.promptTokens,
                  completionTokens: result.completionTokens,
                  totalTokens: result.totalTokens,
                  estimatedCost: result.estimatedCost
                }
              }
            : m
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m))
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  error: err.message || 'Failed to complete query'
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('aura_dev_chat_history_v1');
    showNotification('info', 'Chat history cleared');
  };

  const exportChat = () => {
    const jsonStr = JSON.stringify(messages, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura_chat_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunCode = (code: string, language: string) => {
    setRunningCode({ code, language });
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

      {/* Chat Top Context Bar */}
      <div className="px-6 py-2.5 border-b border-neutral-800 bg-neutral-950/70 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-white">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>Target:</span>
            <span className="font-mono text-indigo-300">{activeModel}</span>
          </div>
          {isAutoRouter && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px]">
              Auto Routing
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportChat}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition cursor-pointer"
            title="Export chat history as JSON"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 transition cursor-pointer"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500 space-y-3">
            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 text-indigo-400 text-3xl">
              ⚡
            </div>
            <h3 className="text-base font-bold text-white">AURA DEV Assistant</h3>
            <p className="text-xs max-w-sm">
              Ready to code, architecture, or test with your personal AI API keys.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              onSwitchModel={() => setActiveTab('apikeys')}
              onRunCode={handleRunCode}
            />
          ))
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onStopGeneration={handleStop}
        isStreaming={isStreaming}
      />

      {/* Code Sandbox Runner Modal */}
      {runningCode && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[85vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal header */}
            <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">Live Execution Sandbox</span>
                <span className="text-[11px] font-mono text-neutral-500 uppercase">
                  ({runningCode.language})
                </span>
              </div>
              <button
                onClick={() => setRunningCode(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sandbox iframe */}
            <div className="flex-1 bg-white relative">
              <iframe
                title="Code Sandbox"
                srcDoc={
                  runningCode.language === 'html'
                    ? runningCode.code
                    : `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { background: #0a0a0a; color: #ededed; font-family: system-ui; padding: 20px; }</style>
</head>
<body>
  <div id="output"></div>
  <script>
    try {
      ${runningCode.code}
    } catch(e) {
      document.body.innerHTML += '<div style="color: #f43f5e; font-family: monospace;">Runtime Error: ' + e.message + '</div>';
    }
  </script>
</body>
</html>`
                }
                sandbox="allow-scripts"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
