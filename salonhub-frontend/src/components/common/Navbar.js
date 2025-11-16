/**
 * Navbar - Version améliorée (icônes Heroicons, styles premium)
 */

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ImageWithFallback } from "../../utils/imageUtils";
import NotificationBell from "./NotificationBell";

// Heroicons
import {
  ChartBarIcon,
  CalendarDaysIcon,
  UsersIcon,
  ScissorsIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, tenant, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <ChartBarIcon className="h-5 w-5" />,
    },
    {
      path: "/appointments",
      label: "Rendez-vous",
      icon: <CalendarDaysIcon className="h-5 w-5" />,
    },
    {
      path: "/clients",
      label: "Clients",
      icon: <UsersIcon className="h-5 w-5" />,
    },
    {
      path: "/services",
      label: "Services",
      icon: <ScissorsIcon className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* -------------------------------------------------- */}
          {/* LOGO & NAV DESKTOP                                 */}
          {/* -------------------------------------------------- */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center group">
              {tenant?.logo_url ? (
                <img
                  src={tenant.logo_url?.replace("/api", "")}
                  alt="logo"
                  className="h-9 w-9 rounded-lg object-cover group-hover:shadow-md transition"
                />
              ) : (
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-indigo-600 text-white font-bold text-lg shadow-sm group-hover:bg-indigo-700 transition">
                  SH
                </div>
              )}
              <span className="ml-3 text-xl font-semibold text-gray-900">
                {tenant?.name || "SalonHub"}
              </span>
            </Link>

            {/* Desktop menu */}
            <div className="hidden sm:flex sm:space-x-1 ml-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive(link.path)
                      ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 shadow-inner"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <div className="mr-2 text-gray-500">{link.icon}</div>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* -------------------------------------------------- */}
          {/* ACTIONS UTILISATEUR                                */}
          {/* -------------------------------------------------- */}
          <div className="hidden sm:flex sm:items-center space-x-4">
            {/* Notifications */}
            <NotificationBell />

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                {user?.avatar_url ? (
                  <ImageWithFallback
                    src={user.avatar_url?.replace("/api", "")}
                    alt={`${user.first_name} ${user.last_name}`}
                    fallbackType="avatar"
                    className="h-9 w-9 rounded-full object-cover border border-indigo-200"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                    <span className="text-indigo-700 font-semibold">
                      {user?.first_name?.charAt(0)}
                      {user?.last_name?.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role === "owner" ? "Propriétaire" : "Staff"}
                  </p>
                </div>

                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              </button>

              {/* Dropdown */}
              {profileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl rounded-lg border border-gray-200 z-50 py-2">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user?.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 text-sm transition-colors"
                      >
                        <UsersIcon className="h-5 w-5" />
                        Mon Profil
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 text-sm transition-colors"
                      >
                        <Cog6ToothIcon className="h-5 w-5" />
                        Paramètres
                      </Link>

                      {/* <Link
                        to="/billing"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 text-sm transition-colors"
                      >
                        <CreditCardIcon className="h-5 w-5" />
                        Facturation
                      </Link> */}
                    </div>

                    <hr className="my-1" />

                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-sm transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* -------------------------------------------------- */}
          {/* MOBILE MENU BUTTON                                  */}
          {/* -------------------------------------------------- */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ */}
      {/* MOBILE MENU                                            */}
      {/* ------------------------------------------------------ */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white shadow-inner">
          <div className="py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium ${
                  isActive(link.path)
                    ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="mr-3 text-gray-500">{link.icon}</div>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="py-3 border-t border-gray-200">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <UsersIcon className="h-5 w-5 text-gray-500" />
              Mon Profil
            </Link>

            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
              Paramètres
            </Link>

            <Link
              to="/billing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <CreditCardIcon className="h-5 w-5 text-gray-500" />
              Facturation
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 mt-2 border-t border-gray-200"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
