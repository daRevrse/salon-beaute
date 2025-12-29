/**
 * SALONHUB - Impersonation Banner
 * Bannière affichée pendant une session d'impersonation
 */

import React, { useState, useEffect } from "react";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState(null);

  useEffect(() => {
    // Check if we're in impersonation mode
    const impersonationToken = localStorage.getItem("impersonation_token");
    const userStr = localStorage.getItem("impersonation_user");

    if (impersonationToken && userStr) {
      setIsImpersonating(true);
      try {
        setImpersonatedUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Error parsing impersonation user:", e);
      }
    }
  }, []);

  const exitImpersonation = async () => {
    if (!window.confirm("Terminer la session d'impersonation et retourner au SuperAdmin ?")) {
      return;
    }

    try {
      // Restore the original SuperAdmin token FIRST (before clearing anything)
      const originalToken = localStorage.getItem("original_superadmin_token");

      if (originalToken) {
        // Call backend to properly end the session
        const impersonationToken = localStorage.getItem("impersonation_token");

        // We need to get the session_id from the impersonation_user data
        // For now, we'll just clear the frontend without backend call
        // The session will expire after 1 hour anyway

        // Restore SuperAdmin token
        localStorage.setItem("superadmin_token", originalToken);
        localStorage.removeItem("original_superadmin_token");

        // Remove impersonation data
        localStorage.removeItem("impersonation_token");
        localStorage.removeItem("impersonation_user");

        // Remove tenant user auth data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("tenant");

        // Redirect back to SuperAdmin dashboard (already authenticated)
        window.location.href = "/superadmin/impersonation";
      } else {
        // No saved token, just clear everything and go to login
        localStorage.clear();
        window.location.href = "/superadmin/login";
      }
    } catch (error) {
      console.error("Error exiting impersonation:", error);
      // Even if there's an error, clear everything and redirect
      localStorage.clear();
      window.location.href = "/superadmin/login";
    }
  };

  if (!isImpersonating || !impersonatedUser) {
    return null;
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 animate-pulse" />
            <div>
              <p className="font-semibold">Mode Impersonation Actif</p>
              <p className="text-sm text-yellow-100">
                Vous consultez le compte de{" "}
                <strong>
                  {impersonatedUser.first_name} {impersonatedUser.last_name}
                </strong>{" "}
                ({impersonatedUser.email})
              </p>
            </div>
          </div>
          <button
            onClick={exitImpersonation}
            className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition"
          >
            <XMarkIcon className="w-5 h-5" />
            <span className="font-medium">Quitter l'impersonation</span>
          </button>
        </div>
      </div>
    </div>
      {/* Spacer to push content down */}
      <div className="h-16"></div>
    </>
  );
}

export default ImpersonationBanner;
