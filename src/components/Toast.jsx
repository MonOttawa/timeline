import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-100 dark:bg-green-900/80',
    borderColor: 'border-green-500',
    textColor: 'text-green-800 dark:text-green-200',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-100 dark:bg-red-900/80',
    borderColor: 'border-red-500',
    textColor: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-600 dark:text-red-400'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/80',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-100 dark:bg-blue-900/80',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-400'
  }
};

const ToastItem = ({ toast, onDismiss }) => {
  const config = toastConfig[toast.type] || toastConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border-2 ${config.bgColor} ${config.borderColor} ${config.textColor} shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] animate-slide-in min-w-[280px] max-w-sm`}
      role="alert"
    >
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className={`flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${config.textColor}`}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
