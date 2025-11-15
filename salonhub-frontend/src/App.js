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
import Profile from "./pages/Profile";

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
            <Route path="/app/login" element={<Login />} />
            <Route path="/app/register" element={<Register />} />

            {/* Routes publiques - Booking (Réservation client) */}
            <Route path="/app/book/:slug" element={<BookingLanding />} />
            <Route
              path="/app/book/:slug/datetime"
              element={<BookingDateTime />}
            />
            <Route
              path="/app/book/:slug/info"
              element={<BookingClientInfo />}
            />
            <Route
              path="/app/book/:slug/confirmation"
              element={<BookingConfirmation />}
            />

            {/* Routes protégées - Admin */}
            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/app/clients"
              element={
                <ProtectedRoute>
                  <Clients />
                </ProtectedRoute>
              }
            />

            <Route
              path="/app/services"
              element={
                <ProtectedRoute>
                  <Services />
                </ProtectedRoute>
              }
            />

            <Route
              path="/app/appointments"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/app/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />

            <Route
              path="/app/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/app/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Redirect root vers dashboard */}
            <Route
              path="/app/app/"
              element={<Navigate to="/app/app/dashboard" replace />}
            />

            {/* 404 */}
            <Route
              path="*"
              element={<Navigate to="/app/dashboard" replace />}
            />
          </Routes>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
