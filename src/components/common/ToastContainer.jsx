import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  const getStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-950/90 text-white border-emerald-500/50',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/95 text-amber-50 border-amber-500/60',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        };
      case 'error':
        return {
          bg: 'bg-rose-950/95 text-rose-50 border-rose-500/60',
          icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        };
      default:
        return {
          bg: 'bg-[#111827]/95 text-white border-white/20',
          icon: <Info className="w-4 h-4 text-[#DDF262] shrink-0 mt-0.5" />
        };
    }
  };

  return (
    <div className="fixed top-3 left-0 right-0 z-[100] px-4 pointer-events-none flex flex-col items-center gap-2 max-w-[440px] mx-auto">
      {toasts.map((toast) => {
        const style = getStyle(toast.type);
        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto w-full p-3 rounded-2xl shadow-xl border backdrop-blur-md flex items-start justify-between gap-3 animate-fade-in tap-active transition-all cursor-pointer ${style.bg}`}
          >
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              {style.icon}
              <p className="text-xs font-bold leading-relaxed whitespace-pre-line break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 shrink-0 transition"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
