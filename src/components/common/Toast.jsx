import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

/** Lightweight toasts used to confirm simulated actions (saved, exported, sent…). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, { tone = 'success' } = {}) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((list) => [...list.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:left-auto sm:right-6 sm:items-end">
        {toasts.map((toast) => {
          const Icon = toast.tone === 'info' ? Info : CheckCircle2;
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl bg-navy px-4 py-3 text-sm text-white shadow-lg"
            >
              <Icon className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <span className="flex-1">{toast.message}</span>
              <button type="button" onClick={() => dismiss(toast.id)} className="rounded p-1 text-navy-muted hover:text-white" aria-label="Dismiss">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
