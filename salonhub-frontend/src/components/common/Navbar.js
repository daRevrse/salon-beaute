/**
 * Navbar - Purple Dynasty Premium Theme
 * Multi-Sector Adaptive Navigation
 */

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../contexts/PermissionContext";
import { ImageWithFallback, getImageUrl } from "../../utils/imageUtils";
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
  BuildingStorefrontIcon,
  AcademicCapIcon,
  HeartIcon,
  SparklesIcon,
  TableCellsIcon,
  ClipboardDocumentListIcon,
  FireIcon,
  BookOpenIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

// Business Type Configuration
const BUSINESS_TYPE_CONFIG = {
  beauty: {
    label: "Beauté",
    icon: ScissorsIcon,
    primaryColor: "violet",
    gradient: "from-violet-500 to-indigo-600",
    lightBg: "bg-violet-50",
    textColor: "text-violet-600",
    hoverBg: "hover:bg-violet-50",
    activeBg: "bg-violet-50",
    activeText: "text-violet-700",
    activeBorder: "border-violet-600",
    servicesLabel: "Services",
    appointmentsLabel: "Rendez-vous",
    sectorLinks: [],
  },
  restaurant: {
    label: "Restaurant",
    icon: BuildingStorefrontIcon,
    primaryColor: "amber",
    gradient: "from-amber-700 to-orange-700",
    lightBg: "bg-amber-50",
    textColor: "text-amber-700",
    hoverBg: "hover:bg-amber-50",
    activeBg: "bg-gradient-to-r from-amber-100 to-orange-100",
    activeText: "text-amber-800",
    activeBorder: "border-amber-600",
    servicesLabel: "La Carte",
    servicesPath: "/restaurant/menus",
    appointmentsLabel: "Réservations",
    sectorLinks: [
      { path: "/restaurant/tables", label: "Tables", icon: TableCellsIcon },
      { path: "/restaurant/orders", label: "Commandes", icon: ClipboardDocumentListIcon },
      { path: "/restaurant/kitchen", label: "Cuisine", icon: FireIcon },
    ],
  },
  training: {
    label: "Formation",
    icon: AcademicCapIcon,
    primaryColor: "emerald",
    gradient: "from-emerald-500 to-green-600",
    lightBg: "bg-emerald-50",
    textColor: "text-emerald-600",
    hoverBg: "hover:bg-emerald-50",
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-700",
    activeBorder: "border-emerald-600",
    servicesLabel: "Formations",
    appointmentsLabel: "Sessions",
    sectorLinks: [
      { path: "/training/courses", label: "Cours", icon: BookOpenIcon },
      { path: "/training/sessions", label: "Sessions", icon: CalendarDaysIcon },
      { path: "/training/enrollments", label: "Inscriptions", icon: UserGroupIcon },
      { path: "/training/certificates", label: "Certificats", icon: DocumentTextIcon },
    ],
  },
  medical: {
    label: "Médical",
    icon: HeartIcon,
    primaryColor: "cyan",
    gradient: "from-cyan-500 to-teal-600",
    lightBg: "bg-cyan-50",
    textColor: "text-cyan-600",
    hoverBg: "hover:bg-cyan-50",
    activeBg: "bg-cyan-50",
    activeText: "text-cyan-700",
    activeBorder: "border-cyan-600",
    servicesLabel: "Prestations",
    appointmentsLabel: "Consultations",
    sectorLinks: [
      { path: "/medical/patients", label: "Patients", icon: UserGroupIcon },
      { path: "/medical/records", label: "Dossiers", icon: DocumentTextIcon },
      { path: "/medical/prescriptions", label: "Ordonnances", icon: ClipboardDocumentListIcon },
    ],
  },
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, tenant, logout } = useAuth();
  const { can } = usePermissions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Get business type config with fallback to beauty
  const businessType = tenant?.business_type || "beauty";
  const config = BUSINESS_TYPE_CONFIG[businessType] || BUSINESS_TYPE_CONFIG.beauty;
  const BusinessIcon = config.icon;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  // Check if current path matches sector links
  const isInSectorSection = (path) => {
    return location.pathname.startsWith(path.split("/").slice(0, 2).join("/"));
  };

  // Navigation principale - adaptive labels based on business type
  const navLinks = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <ChartBarIcon className="h-5 w-5" />,
      visible: true,
    },
    {
      path: "/appointments",
      label: config.appointmentsLabel,
      icon: <CalendarDaysIcon className="h-5 w-5" />,
      visible: true,
    },
    {
      path: "/clients",
      label: "Clients",
      icon: <UsersIcon className="h-5 w-5" />,
      visible: can.viewClients,
    },
    {
      path: config.servicesPath || "/services",
      label: config.servicesLabel,
      icon: <BusinessIcon className="h-5 w-5" />,
      visible: can.viewServices,
    },
  ].filter((link) => link.visible);

  // Sector-specific links
  const sectorLinks = config.sectorLinks || [];

  return (
    <nav className="bg-white border-b border-slate-200 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* LOGO & NAV DESKTOP */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center group">
              {tenant?.logo_url ? (
                <img
                  src={getImageUrl(tenant.logo_url)}
                  alt="logo"
                  className="h-10 w-10 rounded-xl object-cover group-hover:shadow-soft transition-shadow duration-300"
                />
              ) : (
                <div className={`flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br ${config.gradient} text-white font-bold text-lg shadow-soft group-hover:shadow-glow transition-all duration-300`}>
                  <SparklesIcon className="h-5 w-5" />
                </div>
              )}
              <div className="ml-3 hidden sm:block">
                <span className="font-display text-lg font-semibold text-slate-800 truncate max-w-[180px]">
                  {tenant?.name || "SalonHub"}
                </span>
                <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${config.lightBg} ${config.textColor}`}>
                  {config.label}
                </span>
              </div>
            </Link>

            {/* Desktop menu */}
            <div className="hidden lg:flex lg:space-x-1 ml-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                    isActive(link.path)
                      ? `${config.activeBg} ${config.activeText} border-b-2 ${config.activeBorder}`
                      : `text-slate-600 hover:text-slate-900 ${config.hoverBg}`
                  }`}
                >
                  <div className={`mr-2 ${isActive(link.path) ? config.textColor : "text-slate-400"}`}>
                    {link.icon}
                  </div>
                  {link.label}
                </Link>
              ))}

              {/* Sector-specific links */}
              {sectorLinks.length > 0 && (
                <>
                  <div className="w-px h-8 bg-slate-200 mx-2 self-center"></div>
                  {sectorLinks.map((link) => {
                    const LinkIcon = link.icon;
                    const isLinkActive = isActive(link.path) || isInSectorSection(link.path) && location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                          isLinkActive
                            ? `${config.activeBg} ${config.activeText}`
                            : `text-slate-600 hover:text-slate-900 ${config.hoverBg}`
                        }`}
                      >
                        <LinkIcon className={`h-4 w-4 mr-1.5 ${isLinkActive ? config.textColor : "text-slate-400"}`} />
                        {link.label}
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* ACTIONS UTILISATEUR */}
          <div className="hidden sm:flex sm:items-center space-x-3">
            {/* Notifications */}
            <NotificationBell />

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all duration-300"
              >
                {user?.avatar_url ? (
                  <ImageWithFallback
                    src={user.avatar_url}
                    alt={`${user.first_name} ${user.last_name}`}
                    fallbackType="avatar"
                    className={`h-9 w-9 rounded-full object-cover border-2 border-${config.primaryColor}-200`}
                  />
                ) : (
                  <div className={`h-9 w-9 rounded-full ${config.lightBg} flex items-center justify-center border-2 border-${config.primaryColor}-200`}>
                    <span className={`${config.textColor} font-semibold`}>
                      {user?.first_name?.charAt(0)}
                      {user?.last_name?.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-800">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {user?.role === "owner" ? "Propriétaire" : "Staff"}
                  </p>
                </div>

                <ChevronDownIcon className="h-4 w-4 text-slate-400" />
              </button>

              {/* Dropdown */}
              {profileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white shadow-soft-xl rounded-xl border border-slate-200 z-50 py-2 animate-fade-in">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {user?.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-slate-700 ${config.hoverBg} hover:${config.textColor} text-sm transition-colors`}
                      >
                        <UsersIcon className="h-5 w-5" />
                        Mon Profil
                      </Link>

                      {can.viewSettings && (
                        <Link
                          to="/settings"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`flex items-center gap-2 px-4 py-2.5 text-slate-700 ${config.hoverBg} hover:${config.textColor} text-sm transition-colors`}
                        >
                          <Cog6ToothIcon className="h-5 w-5" />
                          Paramètres
                        </Link>
                      )}

                      {can.viewBilling && (
                        <Link
                          to="/billing"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`flex items-center gap-2 px-4 py-2.5 text-slate-700 ${config.hoverBg} hover:${config.textColor} text-sm transition-colors`}
                        >
                          <CreditCardIcon className="h-5 w-5" />
                          Facturation
                        </Link>
                      )}
                    </div>

                    <hr className="my-1 border-slate-100" />

                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 text-sm transition-colors"
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

          {/* MOBILE MENU BUTTON */}
          <div className="flex items-center gap-3 sm:hidden">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
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

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white shadow-inner animate-fade-in-down">
          <div className="py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium ${
                  isActive(link.path)
                    ? `${config.activeBg} ${config.activeText} border-l-4 ${config.activeBorder}`
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className={`mr-3 ${isActive(link.path) ? config.textColor : "text-slate-400"}`}>
                  {link.icon}
                </div>
                {link.label}
              </Link>
            ))}

            {/* Sector-specific links for mobile */}
            {sectorLinks.length > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-100">
                <p className={`px-4 py-1 text-xs font-medium ${config.textColor} uppercase`}>
                  {config.label}
                </p>
                {sectorLinks.map((link) => {
                  const LinkIcon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-medium ${
                        isActive(link.path)
                          ? `${config.activeBg} ${config.activeText} border-l-4 ${config.activeBorder}`
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <LinkIcon className={`h-5 w-5 mr-3 ${isActive(link.path) ? config.textColor : "text-slate-400"}`} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="py-3 border-t border-slate-200">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <UsersIcon className="h-5 w-5 text-slate-400" />
              Mon Profil
            </Link>

            {can.viewSettings && (
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Cog6ToothIcon className="h-5 w-5 text-slate-400" />
                Paramètres
              </Link>
            )}

            {can.viewBilling && (
              <Link
                to="/billing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <CreditCardIcon className="h-5 w-5 text-slate-400" />
                Facturation
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 mt-2 border-t border-slate-200"
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
