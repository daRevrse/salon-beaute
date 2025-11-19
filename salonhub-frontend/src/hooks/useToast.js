/**
 * SALONHUB - Hook useToast
 * Hook personnalisé pour gérer les notifications toast
 */

import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success", duration = 3000) => {
    setToast({ message, type, duration });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const success = useCallback((message, duration) => {
    showToast(message, "success", duration);
  }, [showToast]);

  const error = useCallback((message, duration) => {
    showToast(message, "error", duration);
  }, [showToast]);

  const warning = useCallback((message, duration) => {
    showToast(message, "warning", duration);
  }, [showToast]);

  const info = useCallback((message, duration) => {
    showToast(message, "info", duration);
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info,
  };
}
