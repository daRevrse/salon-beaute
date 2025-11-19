/**
 * SALONHUB - Modal de confirmation
 * Modal réutilisable pour les actions dangereuses
 */

import React from "react";

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "danger",
  loading = false,
}) {
  if (!isOpen) return null;

  const types = {
    danger: {
      bg: "bg-red-600 hover:bg-red-700",
      icon: "⚠️",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    warning: {
      bg: "bg-yellow-600 hover:bg-yellow-700",
      icon: "⚠",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    info: {
      bg: "bg-blue-600 hover:bg-blue-700",
      icon: "ℹ️",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
  };

  const style = types[type] || types.danger;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div
              className={`w-16 h-16 ${style.iconBg} rounded-full flex items-center justify-center`}
            >
              <span className="text-3xl">{style.icon}</span>
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2 ${style.bg} text-white rounded-lg transition disabled:opacity-50 font-semibold`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Chargement...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
