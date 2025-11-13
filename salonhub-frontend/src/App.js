/**
 * App.js - Application principale
 * Routes et AuthProvider
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Auth
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

// Pages Admin
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Services from "./pages/Services";
import Appointments from "./pages/Appointments";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";

// Pages publiques (Booking)
import BookingLanding from "./pages/public/BookingLanding";
import BookingDateTime from "./pages/public/BookingDateTime";
import BookingClientInfo from "./pages/public/BookingClientInfo";
import BookingConfirmation from "./pages/public/BookingConfirmation";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <Routes>
          {/* Routes publiques - Authentification */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes publiques - Booking (Réservation client) */}
          <Route path="/book/:slug" element={<BookingLanding />} />
          <Route path="/book/:slug/datetime" element={<BookingDateTime />} />
          <Route path="/book/:slug/info" element={<BookingClientInfo />} />
          <Route path="/book/:slug/confirmation" element={<BookingConfirmation />} />

          {/* Routes protégées - Admin */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            }
          />

          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <Services />
              </ProtectedRoute>
            }
          />

          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Redirect root vers dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
