import React, { createContext, useContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

// Create Toast Context
const ToastContext = createContext();

// Custom Toast Message Component
const ToastMessage = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  const bgColor = type === 'success' ? '#E6FCF5' : type === 'error' ? '#FFF1F2' : '#E8F0FE';
  const textColor = type === 'success' ? '#087F5B' : type === 'error' ? '#C92A2A' : '#1C4587';
  const borderColor = type === 'success' ? '#34D399' : type === 'error' ? '#F87171' : '#60A5FA';

  const getIcon = () => {
    const iconClass = 'w-5 h-5 sm:w-6 sm:h-6';
    switch (type) {
      case 'success':
        return <FiCheckCircle className={iconClass} style={{ color: textColor }} />;
      case 'error':
        return <FiAlertCircle className={iconClass} style={{ color: textColor }} />;
      case 'info':
      default:
        return <FiInfo className={iconClass} style={{ color: textColor }} />;
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };


  const toastContent = (
    <div
      className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 p-4 sm:p-5 rounded-lg shadow-md flex items-center justify-between z-[10000] max-w-[95%] sm:max-w-lg bg-white border-2"
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
      role="alert"
    >
      <div className="flex items-center space-x-3 sm:space-x-4">
        {getIcon()}
        <span className="font-semibold text-sm sm:text-base" style={{ color: textColor }}>
          {message}
        </span>
      </div>
      <button
        onClick={handleClose}
        className="ml-3 sm:ml-4 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
        style={{ color: textColor }}
        aria-label="Close toast message"
      >
        <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>
  );

  const toastRootElement = document.getElementById('toast-root');
  if (!toastRootElement) {
    console.error('Toast root element not found! Please ensure <div id="toast-root"></div> is in your index.html.');
    return toastContent; // Fallback: Render inline
  }
  return createPortal(toastContent, toastRootElement);
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toastMessage, setToastMessage] = useState({ message: '', type: '' });

  const showToast = (message, type) => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage({ message: '', type: '' });
    }, 6000);
  };


  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastMessage.message && (
        <ToastMessage
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage({ message: '', type: '' })}
        />
      )}
    </ToastContext.Provider>
  );
};

// Custom Hook to Use Toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.showToast;
};