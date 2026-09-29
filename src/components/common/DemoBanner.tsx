import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertCircle, Key, ChevronRight, X } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { isDemoMode, hasAnyRealKey, setActiveTab, setIsDemoMode } = useApp();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isDemoMode || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-semibold text-amber-300">Demo Mode Active:</span>
          <span className="text-neutral-300 hidden sm:inline">
            {hasAnyRealKey
              ? 'You have connected API keys, but Demo Mode is currently toggled on.'
              : 'Using simulated AI responses. Connect your API key (Gemini, OpenAI, OpenRouter, Groq) to unlock live models.'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('apikeys')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold transition cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Connect API Key</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          {hasAnyRealKey && (
            <button
              onClick={() => setIsDemoMode(false)}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition cursor-pointer"
            >
              Switch to Live Key
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400/70 hover:text-amber-300 p-0.5 ml-1 transition"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
