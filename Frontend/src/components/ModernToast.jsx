import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ModernToastContext = createContext();

export const useModernToast = () => {
  const context = useContext(ModernToastContext);
  if (!context) {
    throw new Error('useModernToast must be used within a ModernToastProvider');
  }
  return context;
};

const ToastItem = ({ id, message, type, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-[1.1vw] h-[1.1vw] text-green-400" />,
    error: <AlertCircle className="w-[1.1vw] h-[1.1vw] text-red-400" />,
    info: <Info className="w-[1.1vw] h-[1.1vw] text-blue-400" />,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ 
        opacity: 0, 
        y: 20, 
        scale: 0.8, 
        filter: 'blur(8px)',
        transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } 
      }}
      className="flex items-center gap-[0.8vw] px-[1.25vw] py-[0.7vw] bg-black text-white rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/10 backdrop-blur-md mb-[0.75vw] pointer-events-auto"
    >
      <div className="flex-shrink-0">
        {icons[type] || icons.info}
      </div>
      
      <p className="text-[0.85vw] font-medium tracking-wide text-white/90">
        {message}
      </p>

      <button 
        onClick={() => onClose(id)}
        className="ml-[0.4vw] p-[0.2vw] hover:bg-white/10 rounded-full transition-colors group"
      >
        <X className="w-[0.9vw] h-[0.9vw] text-white/40 group-hover:text-white" />
      </button>
    </motion.div>
  );
};

export const ModernToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = {
    showToast,
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    info: (msg) => showToast(msg, 'info'),
  };

  return (
    <ModernToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-[3vw] left-1/2 -translate-x-1/2 z-[10000] flex flex-col-reverse items-center pointer-events-none w-full max-w-fit">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} {...toast} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ModernToastContext.Provider>
  );
};
