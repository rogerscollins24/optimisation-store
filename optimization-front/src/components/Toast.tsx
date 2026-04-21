import { X, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useToast, type ToastType } from '../context/ToastContext';

const config: Record<ToastType, { icon: typeof AlertCircle; classes: string }> = {
  error: {
    icon: AlertCircle,
    classes:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/80 dark:border-red-800/60 dark:text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    classes:
      'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/80 dark:border-amber-800/60 dark:text-amber-300',
  },
  info: {
    icon: Info,
    classes:
      'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/80 dark:border-blue-800/60 dark:text-blue-300',
  },
  success: {
    icon: CheckCircle,
    classes:
      'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/80 dark:border-green-800/60 dark:text-green-300',
  },
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-44 right-4 z-200 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => {
        const { icon: Icon, classes } = config[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${classes}`}
            role="alert"
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1 text-sm leading-snug">{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
