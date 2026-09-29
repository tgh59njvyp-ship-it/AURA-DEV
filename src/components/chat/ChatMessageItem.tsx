import React from 'react';
import { ChatMessage } from '../../types';
import { CodeBlock } from './CodeBlock';
import { formatAIError } from '../../services/aiService';
import { Bot, User, AlertTriangle, ArrowRight, Zap, Paperclip } from 'lucide-react';
import { formatCost } from '../../utils/pricing';

interface ChatMessageItemProps {
  message: ChatMessage;
  onSwitchModel?: () => void;
  onRunCode?: (code: string, language: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onSwitchModel,
  onRunCode
}) => {
  const isAssistant = message.role === 'assistant';

  // Parse markdown code blocks: ```lang ... ```
  const renderContent = (text: string) => {
    const parts: React.ReactNode[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      // Preceding text
      if (matchIndex > lastIndex) {
        const textSegment = text.substring(lastIndex, matchIndex);
        parts.push(renderTextParagraphs(textSegment, `text_${lastIndex}`));
      }

      const lang = match[1] || 'text';
      const code = match[2];
      parts.push(
        <CodeBlock
          key={`code_${matchIndex}`}
          language={lang}
          code={code}
          onRunPreview={onRunCode}
        />
      );

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(renderTextParagraphs(text.substring(lastIndex), `text_${lastIndex}`));
    }

    return parts;
  };

  const renderTextParagraphs = (raw: string, keyPrefix: string) => {
    const lines = raw.split('\n');
    return (
      <div key={keyPrefix} className="space-y-2 text-sm leading-relaxed text-neutral-200">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1.5" />;

          // Check for headers ###
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-bold text-white pt-2">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-lg font-bold text-white pt-3">
                {line.replace('## ', '')}
              </h2>
            );
          }

          // Bullet list items
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="ml-4 list-disc text-neutral-300">
                {renderInlineStyles(line.slice(2))}
              </li>
            );
          }

          return <p key={idx}>{renderInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineStyles = (str: string) => {
    // Bold **text**
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-indigo-300 font-mono text-xs"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const errorInfo = message.error ? formatAIError(message.error) : null;

  return (
    <div
      className={`py-6 px-4 md:px-8 border-b border-neutral-800/40 ${
        isAssistant ? 'bg-neutral-950/40' : 'bg-transparent'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isAssistant ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Bot className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Metadata bar */}
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {isAssistant ? (message.modelUsed ? `AURA (${message.modelUsed})` : 'AURA Assistant') : 'You'}
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-[11px] font-mono text-neutral-500">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Token & Cost badge */}
            {message.tokenUsage && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-lg">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>{message.tokenUsage.totalTokens} tokens</span>
                {message.tokenUsage.estimatedCost !== undefined && (
                  <>
                    <span className="text-neutral-600">·</span>
                    <span className="text-emerald-400 font-semibold">
                      {formatCost(message.tokenUsage.estimatedCost)}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Attachments if any */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300"
                >
                  <Paperclip className="w-3 h-3 text-indigo-400" />
                  <span className="font-mono truncate max-w-[200px]">{att.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="text-neutral-200">
            {renderContent(message.content)}

            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse" />
            )}
          </div>

          {/* Error Card */}
          {errorInfo && (
            <div className="mt-3 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{errorInfo.title}</span>
              </div>
              <p className="text-xs text-rose-300/90 leading-relaxed">
                {errorInfo.description}
              </p>
              {errorInfo.canSwitchModel && onSwitchModel && (
                <button
                  onClick={onSwitchModel}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-semibold text-rose-200 transition cursor-pointer mt-1"
                >
                  <span>Switch Model</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
