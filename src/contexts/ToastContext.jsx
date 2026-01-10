import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    const toast = { id, type, message };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return showToast({ type: 'success', message, duration });
  }, [showToast]);

  const error = useCallback((message, duration) => {
    return showToast({ type: 'error', message, duration });
  }, [showToast]);

  const warning = useCallback((message, duration) => {
    return showToast({ type: 'warning', message, duration });
  }, [showToast]);

  const info = useCallback((message, duration) => {
    return showToast({ type: 'info', message, duration });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, success, error, warning, info }}>
      {children}
    </ToastContext.Provider>
  );
};

export default ToastContext;
