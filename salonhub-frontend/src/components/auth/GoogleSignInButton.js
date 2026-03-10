/**
 * GoogleSignInButton - Bouton de connexion Google réutilisable
 * Utilise @react-oauth/google
 */

import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";

const GoogleSignInButton = ({ onSuccess, onError, disabled, label }) => {
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Obtenir l'ID token depuis l'access token
        const res = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo`,
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );
        const userInfo = await res.json();

        // Pour obtenir l'id_token, on utilise le flow implicit avec id_token
        // Mais useGoogleLogin avec flow: 'implicit' ne donne que access_token
        // On passe donc l'access_token au parent qui fera la vérification
        if (onSuccess) {
          onSuccess(tokenResponse.access_token, userInfo);
        }
      } catch (error) {
        console.error("Erreur Google userinfo:", error);
        if (onError) onError(error);
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error("Erreur Google Login:", error);
      if (onError) onError(error);
    },
    flow: "implicit",
    scope: "openid email profile",
  });

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ height: "48px" }}
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5 text-slate-400"
          xmlns="http://www.w3.org/2000/svg"
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
      ) : (
        <>
          {/* Google "G" Logo SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>{label || "Continuer avec Google"}</span>
        </>
      )}
    </button>
  );
};

export default GoogleSignInButton;
