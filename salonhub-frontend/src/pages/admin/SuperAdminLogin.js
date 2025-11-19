/**
 * SALONHUB - Page de connexion SuperAdmin
 * Interface de login pour les administrateurs système
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LockClosedIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const API_URL = process.env.REACT_APP_API_URL;

function SuperAdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL}/admin/auth/login`, {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        // Stocker le token SuperAdmin
        localStorage.setItem("superadmin_token", response.data.token);
        localStorage.setItem("superadmin", JSON.stringify(response.data.admin));

        // Rediriger vers le dashboard SuperAdmin
        navigate("/superadmin/dashboard");
      }
    } catch (err) {
      console.error("Erreur login SuperAdmin:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Erreur de connexion"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500 rounded-full mb-4">
            <LockClosedIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            SuperAdmin Portal
          </h1>
          <p className="text-gray-300">SalonHub System Administration</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="admin@salonhub.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Warning */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 flex items-start">
              <ExclamationTriangleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              Cette interface est réservée aux administrateurs système. Toutes
              les actions sont enregistrées et auditées.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-gray-300 hover:text-white text-sm transition"
          >
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminLogin;
