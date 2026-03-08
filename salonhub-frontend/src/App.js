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
import UpdateBanner from "./components/common/UpdateBanner";

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

// Pages Restaurant
import RestaurantTables from "./pages/restaurant/Tables";
import RestaurantMenus from "./pages/restaurant/Menus";
import RestaurantOrders from "./pages/restaurant/Orders";
import RestaurantKitchen from "./pages/restaurant/Kitchen";

// Pages Training
import TrainingCourses from "./pages/training/Courses";
import TrainingSessions from "./pages/training/Sessions";
import TrainingEnrollments from "./pages/training/Enrollments";
import TrainingCertificates from "./pages/training/Certificates";

// Pages Medical
import MedicalPatients from "./pages/medical/Patients";
import MedicalRecords from "./pages/medical/Records";
import MedicalPrescriptions from "./pages/medical/Prescriptions";

// Pages publiques Restaurant
import RestaurantLanding from "./pages/public/restaurant/RestaurantLanding";
import RestaurantReservation from "./pages/public/restaurant/RestaurantReservation";
import RestaurantOrder from "./pages/public/restaurant/RestaurantOrder";
import RestaurantQRCode from "./pages/public/restaurant/RestaurantQRCode";

// Pages publiques (Booking)
import PublicRouter from "./pages/public/PublicRouter";
import PublicBookingLayout from "./pages/public/PublicBookingLayout";
import BookingLanding from "./pages/public/BookingLanding";
import BookingDateTime from "./pages/public/BookingDateTime";
import BookingClientInfo from "./pages/public/BookingClientInfo";
import BookingConfirmation from "./pages/public/BookingConfirmation";

// Pages publiques Training
import TrainingLanding from "./pages/public/training/TrainingLanding";

// Pages publiques Medical
import MedicalLanding from "./pages/public/medical/MedicalLanding";

// Pages SuperAdmin
import SuperAdminLogin from "./pages/admin/SuperAdminLogin";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import TenantDetails from "./pages/admin/TenantDetails";
import SuperAdminsManagement from "./pages/admin/SuperAdminsManagement";
import ActivityLogs from "./pages/admin/ActivityLogs";
import UsersManagement from "./pages/admin/UsersManagement";
import PasswordResetManagement from "./pages/admin/PasswordResetManagement";
import BillingDashboard from "./pages/admin/BillingDashboard";
import ImpersonationManager from "./pages/admin/ImpersonationManager";
import AdvancedAnalytics from "./pages/admin/AdvancedAnalytics";
import AnnouncementsManager from "./pages/admin/AnnouncementsManager";
import MessagesManager from "./pages/admin/MessagesManager";
import { SocketProvider } from "./contexts/SocketContext";
import ImpersonationBanner from "./components/common/ImpersonationBanner";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

function App() {
  const content = (
    <BrowserRouter>
      <AuthProvider>
        <PermissionProvider>
          <CurrencyProvider>
            <SocketProvider>
              <ImpersonationBanner />
              <Routes>
                {/* Routes publiques - Authentification */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/:tenant/login" element={<Login />} />
                <Route path="/:tenant/register" element={<Register />} />
                <Route
                  path="/:tenant/forgot-password"
                  element={<ForgotPassword />}
                />
                <Route
                  path="/:tenant/reset-password"
                  element={<ResetPassword />}
                />

                {/* Routes SuperAdmin */}
                <Route path="/superadmin/login" element={<SuperAdminLogin />} />
                <Route
                  path="/superadmin/dashboard"
                  element={<SuperAdminDashboard />}
                />
                <Route
                  path="/superadmin/tenants/:id"
                  element={<TenantDetails />}
                />
                <Route
                  path="/superadmin/admins"
                  element={<SuperAdminsManagement />}
                />
                <Route path="/superadmin/users" element={<UsersManagement />} />
                <Route path="/superadmin/logs" element={<ActivityLogs />} />
                <Route
                  path="/superadmin/password-resets"
                  element={<PasswordResetManagement />}
                />
                <Route
                  path="/superadmin/billing"
                  element={<BillingDashboard />}
                />
                <Route
                  path="/superadmin/impersonation"
                  element={<ImpersonationManager />}
                />
                <Route
                  path="/superadmin/analytics"
                  element={<AdvancedAnalytics />}
                />
                <Route
                  path="/superadmin/announcements"
                  element={<AnnouncementsManager />}
                />
                <Route
                  path="/superadmin/messages"
                  element={<MessagesManager />}
                />

                {/* Routes publiques - Restaurant */}
                <Route path="/r/:slug" element={<RestaurantLanding />} />
                <Route path="/r/:slug/reserve" element={<RestaurantReservation />} />
                <Route path="/r/:slug/order" element={<RestaurantOrder />} />
                <Route path="/r/:slug/qr" element={<RestaurantQRCode />} />

                {/* Routes publiques - Booking (Router dynamique selon secteur) */}
                <Route element={<PublicBookingLayout />}>
                  <Route path="/book/:slug" element={<PublicRouter />} />
                  <Route
                    path="/book/:slug/datetime"
                    element={<BookingDateTime />}
                  />
                  <Route
                    path="/book/:slug/info"
                    element={<BookingClientInfo />}
                  />
                  <Route
                    path="/book/:slug/confirmation"
                    element={<BookingConfirmation />}
                  />
                </Route>

                {/* Routes publiques - Training */}
                <Route path="/t/:slug" element={<TrainingLanding />} />

                {/* Routes publiques - Medical */}
                <Route path="/m/:slug" element={<MedicalLanding />} />

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

                {/* Routes Restaurant */}
                <Route
                  path="/restaurant/tables"
                  element={
                    <ProtectedRoute>
                      <RestaurantTables />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/restaurant/menus"
                  element={
                    <ProtectedRoute>
                      <RestaurantMenus />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/restaurant/orders"
                  element={
                    <ProtectedRoute>
                      <RestaurantOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/restaurant/kitchen"
                  element={
                    <ProtectedRoute>
                      <RestaurantKitchen />
                    </ProtectedRoute>
                  }
                />

                {/* Routes Training */}
                <Route
                  path="/training/courses"
                  element={
                    <ProtectedRoute>
                      <TrainingCourses />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/training/sessions"
                  element={
                    <ProtectedRoute>
                      <TrainingSessions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/training/enrollments"
                  element={
                    <ProtectedRoute>
                      <TrainingEnrollments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/training/certificates"
                  element={
                    <ProtectedRoute>
                      <TrainingCertificates />
                    </ProtectedRoute>
                  }
                />

                {/* Routes Medical */}
                <Route
                  path="/medical/patients"
                  element={
                    <ProtectedRoute>
                      <MedicalPatients />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/medical/records"
                  element={
                    <ProtectedRoute>
                      <MedicalRecords />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/medical/prescriptions"
                  element={
                    <ProtectedRoute>
                      <MedicalPrescriptions />
                    </ProtectedRoute>
                  }
                />

                {/* Redirect root vers dashboard */}
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />

                {/* 404 */}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>

              {/* Bannière de mise à jour PWA */}
              <UpdateBanner />
            </SocketProvider>
          </CurrencyProvider>
        </PermissionProvider>
      </AuthProvider>
    </BrowserRouter>
  );

  if (GOOGLE_CLIENT_ID) {
    return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>;
  }

  return content;
}

export default App;
