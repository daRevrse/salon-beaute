/**
 * SALONHUB - Composant Toast pour les notifications
 * Notifications élégantes pour les actions utilisateur
 */

import React, { useEffect } from "react";

function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: "✓",
      iconBg: "bg-green-500",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "✕",
      iconBg: "bg-red-500",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: "⚠",
      iconBg: "bg-yellow-500",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "ℹ",
      iconBg: "bg-blue-500",
    },
  };

  const style = styles[type] || styles.success;

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${style.bg} border ${style.border} rounded-lg shadow-lg p-4 min-w-[300px] max-w-md animate-slide-in-right`}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 w-6 h-6 ${style.iconBg} rounded-full flex items-center justify-center text-white text-sm font-bold mr-3`}>
          {style.icon}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${style.text}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ml-3 ${style.text} hover:opacity-75 transition`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Toast;
