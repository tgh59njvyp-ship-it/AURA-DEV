import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Image as ImageIcon,
  Code,
  X,
  Sparkles
} from 'lucide-react';
import { Attachment } from '../../types';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onStopGeneration?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  disabled = false,
  placeholder = 'Ask anything, generate code, or request an app architecture...'
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isStreaming || disabled) return;
    onSendMessage(text, attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result as string;
        const newAtt: Attachment = {
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: file.name,
          type: isImg ? 'image' : file.name.match(/\.(ts|tsx|js|jsx|py|html|css|json)$/i) ? 'code' : 'document',
          size: file.size,
          content,
          mimeType: file.type || 'text/plain'
        };
        setAttachments((prev) => [...prev, newAtt]);
      };

      if (isImg) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="p-4 bg-neutral-950/80 backdrop-blur-md border-t border-neutral-800">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Attachments preview pill list */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200"
              >
                {att.type === 'image' ? (
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                ) : att.type === 'code' ? (
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="font-mono truncate max-w-[160px]">{att.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="text-neutral-500 hover:text-white p-0.5 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input box */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/40 transition shadow-lg overflow-hidden">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className="w-full bg-transparent px-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none max-h-48 leading-relaxed font-sans"
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-800/60 bg-neutral-950/40">
            {/* Attachment buttons */}
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition cursor-pointer"
                title="Attach file (.ts, .jsx, .json, .md, images...)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition cursor-pointer"
                title="Attach image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition cursor-pointer"
                title="Attach source code file"
              >
                <Code className="w-4 h-4" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-500 hidden sm:inline">
                Shift + Enter for new line
              </span>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!text.trim() && attachments.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
