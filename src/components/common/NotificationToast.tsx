import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notification, clearNotification } = useApp();

  if (!notification) return null;

  const isSuccess = notification.type === 'success';
  const isError = notification.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md ${
          isSuccess
            ? 'bg-neutral-900/95 border-emerald-500/40 text-emerald-300'
            : isError
            ? 'bg-neutral-900/95 border-rose-500/40 text-rose-300'
            : 'bg-neutral-900/95 border-neutral-700/50 text-neutral-200'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {isError && <AlertTriangle className="w-5 h-5 text-rose-400" />}
          {!isSuccess && !isError && <Info className="w-5 h-5 text-indigo-400" />}
        </div>
        <div className="flex-1 text-sm font-medium leading-relaxed break-words">
          {notification.message}
        </div>
        <button
          onClick={clearNotification}
          className="text-neutral-400 hover:text-white p-1 transition"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
