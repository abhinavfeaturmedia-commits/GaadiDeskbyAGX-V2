import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3800) => {
    if (!message) return;
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast = { id, message, type, duration };

    setToasts(prev => [newToast, ...prev.slice(0, 2)]); // Keep at most 3 active toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside ToastProvider
    return {
      showToast: (msg, type) => {
        console.info(`[Toast ${type || 'info'}]:`, msg);
      },
      removeToast: () => {},
      toasts: []
    };
  }
  return context;
};
