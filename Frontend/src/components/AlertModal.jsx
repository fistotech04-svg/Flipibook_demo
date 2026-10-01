import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

const AlertModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  type = 'info', 
  title, 
  message, 
  showCancel = false,
  confirmText = 'Okay',
  cancelText = 'Cancel',
  autoClose = false,
  autoCloseDuration = 3000,
  isLoading = false
}) => {
  useEffect(() => {
    if (isOpen && autoClose && !showCancel) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDuration, onClose, showCancel]);

  if (!isOpen) return null;

  const Icons = {
    success: <CheckCircle className="text-white fill-green-500" size="1.2vw" />,
    error: <XCircle className="text-white fill-[#e53e3e]" size="1.2vw" />,
    warning: <AlertCircle className="text-white fill-yellow-500" size="1.2vw" />,
    info: <Info className="text-white fill-blue-500" size="1.2vw" />
  };

  const circleBg = {
    success: 'bg-green-100',
    error: 'bg-red-100',
    warning: 'bg-yellow-100',
    info: 'bg-blue-100'
  };

  const confirmBtnBg = {
    success: 'bg-green-600 hover:bg-green-700',
    error: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-[1vw] bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[1.2vw] shadow-[0_8px_32px_rgba(0,0,0,0.12)] w-full max-w-[21vw] overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="px-[1.5vw] pt-[1.5vw] pb-[1.8vw]">
          {/* Header Row */}
          <div className="flex items-center gap-[0.6vw]">
            <div className={`flex-shrink-0 w-[2vw] h-[2vw] flex items-center justify-center rounded-full ${circleBg[type] || circleBg.error}`}>
              {Icons[type] || Icons.error}
            </div>
            <h3 className="text-[1vw] font-medium text-gray-900 leading-none">
              {title}
            </h3>
            <div className="h-[0.15vw] flex-1 bg-gray-300 mt-[0.3vw]" />
          </div>

          {/* Body */}
          <div className="mt-[1.5vw] px-[0.3vw]">
            <p className="text-[0.78vw] text-gray-400 font-normal leading-[1.6] tracking-tight text-center whitespace-pre-wrap">
              {message}
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-[#f0f0f0] px-[1.3vw] py-[0.85vw] flex gap-[0.8vw]">
          {showCancel && (
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`flex-1 py-[0.6vw] text-[0.8vw] cursor-pointer font-medium text-gray-600 bg-white rounded-[0.55vw] hover:bg-gray-50 focus:outline-none transition-all active:scale-95 border border-transparent outline-none ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              else onClose();
            }}
            disabled={isLoading}
            className={`flex-1 py-[0.6vw] text-[0.8vw] cursor-pointer font-medium text-white rounded-[0.55vw] shadow-sm focus:outline-none transition-all active:scale-95 outline-none flex items-center justify-center gap-[0.5vw] ${confirmBtnBg[type] || confirmBtnBg.error} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading && (
              <div className="w-[0.8vw] h-[0.8vw] border-[0.1vw] border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isLoading ? (confirmText === 'Delete' ? 'Deleting...' : 'Loading...') : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AlertModal;
