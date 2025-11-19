/**
 * App.js - Application principale
 * Routes et AuthProvider
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { PermissionProvider } from "./contexts/PermissionContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Auth
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Pages Admin
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Services from "./pages/Services";
import Appointments from "./pages/Appointments";
import Promotions from "./pages/Promotions";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

// Pages publiques (Booking)
import BookingLanding from "./pages/public/BookingLanding";
import BookingDateTime from "./pages/public/BookingDateTime";
import BookingClientInfo from "./pages/public/BookingClientInfo";
import BookingConfirmation from "./pages/public/BookingConfirmation";

// Pages SuperAdmin
import SuperAdminLogin from "./pages/admin/SuperAdminLogin";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import TenantDetails from "./pages/admin/TenantDetails";
import SuperAdminsManagement from "./pages/admin/SuperAdminsManagement";
import ActivityLogs from "./pages/admin/ActivityLogs";
import UsersManagement from "./pages/admin/UsersManagement";
import PasswordResetManagement from "./pages/admin/PasswordResetManagement";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PermissionProvider>
          <CurrencyProvider>
            <Routes>
            {/* Routes publiques - Authentification */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/:tenant/login" element={<Login />} />
            <Route path="/:tenant/register" element={<Register />} />
            <Route path="/:tenant/forgot-password" element={<ForgotPassword />} />
            <Route path="/:tenant/reset-password" element={<ResetPassword />} />

            {/* Routes SuperAdmin */}
            <Route path="/superadmin/login" element={<SuperAdminLogin />} />
            <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/tenants/:id" element={<TenantDetails />} />
            <Route path="/superadmin/admins" element={<SuperAdminsManagement />} />
            <Route path="/superadmin/users" element={<UsersManagement />} />
            <Route path="/superadmin/logs" element={<ActivityLogs />} />
            <Route path="/superadmin/password-resets" element={<PasswordResetManagement />} />

            {/* Routes publiques - Booking (Réservation client) */}
            <Route path="/book/:slug" element={<BookingLanding />} />
            <Route path="/book/:slug/datetime" element={<BookingDateTime />} />
            <Route path="/book/:slug/info" element={<BookingClientInfo />} />
            <Route
              path="/book/:slug/confirmation"
              element={<BookingConfirmation />}
            />

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
              path="/promotions"
              element={
                <ProtectedRoute>
                  <Promotions />
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

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Redirect root vers dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </CurrencyProvider>
        </PermissionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
