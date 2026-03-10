/**
 * SALONHUB - SuperAdmin Command Center
 * Redesigned dashboard with dark command-center aesthetic
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BuildingStorefrontIcon,
  UsersIcon,
  CheckCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ChevronRightIcon,
  PauseCircleIcon,
  KeyIcon,
  CurrencyEuroIcon,
  ArrowRightOnRectangleIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EllipsisHorizontalIcon,
  ArrowTrendingUpIcon,
  SignalIcon,
  Cog6ToothIcon,
  PowerIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

/* ─────────── CSS-in-JS Styles ─────────── */
const styles = {
  /* Keyframes injected once */
  keyframes: `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes countUp {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(12px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `,
};

/* Inject keyframes once */
if (typeof document !== "undefined" && !document.getElementById("sa-keyframes")) {
  const styleEl = document.createElement("style");
  styleEl.id = "sa-keyframes";
  styleEl.textContent = styles.keyframes;
  document.head.appendChild(styleEl);
}

/* ─────────── Metric Tile ─────────── */
function MetricTile({ label, value, icon: Icon, accent, delay = 0, subtitle }) {
  const accentMap = {
    indigo: { bg: "rgba(99,102,241,0.12)", text: "#818cf8", ring: "rgba(99,102,241,0.25)" },
    emerald: { bg: "rgba(16,185,129,0.12)", text: "#34d399", ring: "rgba(16,185,129,0.25)" },
    amber: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", ring: "rgba(245,158,11,0.25)" },
    rose: { bg: "rgba(244,63,94,0.12)", text: "#fb7185", ring: "rgba(244,63,94,0.25)" },
    cyan: { bg: "rgba(6,182,212,0.12)", text: "#22d3ee", ring: "rgba(6,182,212,0.25)" },
    violet: { bg: "rgba(139,92,246,0.12)", text: "#a78bfa", ring: "rgba(139,92,246,0.25)" },
  };
  const a = accentMap[accent] || accentMap.indigo;

  return (
    <div
      style={{
        animation: `fadeInUp 0.5s ease ${delay}ms both`,
        background: "linear-gradient(135deg, #1e1e2e 0%, #252540 100%)",
        borderRadius: 16,
        padding: "24px 20px",
        position: "relative",
        overflow: "hidden",
        border: `1px solid rgba(255,255,255,0.06)`,
      }}
    >
      {/* Subtle corner glow */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: a.ring,
          filter: "blur(40px)",
          opacity: 0.5,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: a.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon style={{ width: 22, height: 22, color: a.text }} />
          </div>
          {subtitle && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: a.text,
                background: a.bg,
                padding: "3px 10px",
                borderRadius: 20,
                letterSpacing: "0.03em",
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>
          {label}
        </p>
        <p
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#f1f5f9",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            animation: `countUp 0.6s ease ${delay + 200}ms both`,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─────────── Command Tile (Quick Action) ─────────── */
function CommandTile({ icon: Icon, label, desc, accent, onClick, delay = 0 }) {
  const accentMap = {
    emerald: { bg: "rgba(16,185,129,0.1)", hover: "rgba(16,185,129,0.18)", text: "#34d399", border: "rgba(16,185,129,0.2)" },
    indigo: { bg: "rgba(99,102,241,0.1)", hover: "rgba(99,102,241,0.18)", text: "#818cf8", border: "rgba(99,102,241,0.2)" },
    amber: { bg: "rgba(245,158,11,0.1)", hover: "rgba(245,158,11,0.18)", text: "#fbbf24", border: "rgba(245,158,11,0.2)" },
    violet: { bg: "rgba(139,92,246,0.1)", hover: "rgba(139,92,246,0.18)", text: "#a78bfa", border: "rgba(139,92,246,0.2)" },
    sky: { bg: "rgba(14,165,233,0.1)", hover: "rgba(14,165,233,0.18)", text: "#38bdf8", border: "rgba(14,165,233,0.2)" },
    cyan: { bg: "rgba(6,182,212,0.1)", hover: "rgba(6,182,212,0.18)", text: "#22d3ee", border: "rgba(6,182,212,0.2)" },
    rose: { bg: "rgba(244,63,94,0.1)", hover: "rgba(244,63,94,0.18)", text: "#fb7185", border: "rgba(244,63,94,0.2)" },
    teal: { bg: "rgba(20,184,166,0.1)", hover: "rgba(20,184,166,0.18)", text: "#2dd4bf", border: "rgba(20,184,166,0.2)" },
    orange: { bg: "rgba(249,115,22,0.1)", hover: "rgba(249,115,22,0.18)", text: "#fb923c", border: "rgba(249,115,22,0.2)" },
    slate: { bg: "rgba(148,163,184,0.1)", hover: "rgba(148,163,184,0.18)", text: "#94a3b8", border: "rgba(148,163,184,0.2)" },
  };
  const a = accentMap[accent] || accentMap.indigo;

  return (
    <button
      onClick={onClick}
      style={{
        animation: `fadeInUp 0.4s ease ${delay}ms both`,
        background: "#1e1e2e",
        border: `1px solid ${a.border}`,
        borderRadius: 14,
        padding: "16px 18px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        textAlign: "left",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = a.hover;
        e.currentTarget.style.borderColor = a.text;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.querySelector(".cmd-arrow").style.opacity = "1";
        e.currentTarget.querySelector(".cmd-arrow").style.transform = "translateX(0)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#1e1e2e";
        e.currentTarget.style.borderColor = a.border;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.querySelector(".cmd-arrow").style.opacity = "0";
        e.currentTarget.querySelector(".cmd-arrow").style.transform = "translateX(-6px)";
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: a.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon style={{ width: 20, height: 20, color: a.text }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", margin: 0, lineHeight: 1.3 }}>{label}</p>
        <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.3, marginTop: 1 }}>{desc}</p>
      </div>
      <ChevronRightIcon
        className="cmd-arrow"
        style={{
          width: 16,
          height: 16,
          color: a.text,
          opacity: 0,
          transform: "translateX(-6px)",
          transition: "all 0.2s ease",
          flexShrink: 0,
        }}
      />
    </button>
  );
}

/* ─────────── Plan Distribution Bar ─────────── */
function PlanBar({ plan, count, total, delay = 0 }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  const planLabels = { essential: "Essential", pro: "Pro", custom: "Sur mesure", trial: "Trial", starter: "Essential", professional: "Pro" };
  const planColors = { essential: "#34d399", pro: "#818cf8", custom: "#fbbf24", trial: "#38bdf8", starter: "#34d399", professional: "#818cf8" };
  const color = planColors[plan] || "#94a3b8";

  return (
    <div style={{ animation: `fadeInUp 0.4s ease ${delay}ms both` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{planLabels[plan] || plan}</span>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>
          {count} <span style={{ color: "#64748b" }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            transition: "width 1s ease",
          }}
        />
      </div>
    </div>
  );
}

/* ─────────── Month Growth Bar ─────────── */
function MonthBar({ month, count, maxCount, delay = 0 }) {
  const pct = maxCount > 0 ? Math.min((count / maxCount) * 100, 100) : 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, animation: `fadeInUp 0.3s ease ${delay}ms both` }}>
      <span style={{ fontSize: 12, color: "#94a3b8", width: 80, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{month}</span>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 2,
            background: "linear-gradient(90deg, #6366f1, #818cf8)",
            transition: "width 0.8s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, width: 30, fontVariantNumeric: "tabular-nums" }}>{count}</span>
    </div>
  );
}

/* ─────────── Status Badge ─────────── */
function StatusBadge({ status }) {
  const map = {
    active: { bg: "rgba(16,185,129,0.15)", color: "#34d399", dot: "#10b981", label: "Actif" },
    trial: { bg: "rgba(56,189,248,0.15)", color: "#38bdf8", dot: "#0ea5e9", label: "Essai" },
    suspended: { bg: "rgba(244,63,94,0.15)", color: "#fb7185", dot: "#ef4444", label: "Suspendu" },
    cancelled: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8", dot: "#64748b", label: "Annulé" },
  };
  const s = map[status] || map.cancelled;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        color: s.color,
        background: s.bg,
        padding: "4px 12px",
        borderRadius: 20,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
      {s.label}
    </span>
  );
}

/* ─────────── Status Mini Card ─────────── */
function StatusMiniCard({ label, count, accent, icon: Icon, delay = 0 }) {
  const colorMap = {
    emerald: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", text: "#34d399" },
    sky: { bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)", text: "#38bdf8" },
    rose: { bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.2)", text: "#fb7185" },
    violet: { bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)", text: "#a78bfa" },
  };
  const c = colorMap[accent] || colorMap.emerald;

  return (
    <div
      style={{
        animation: `fadeInUp 0.4s ease ${delay}ms both`,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 14,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 24, fontWeight: 800, color: c.text, lineHeight: 1.1 }}>{count}</p>
      </div>
      <Icon style={{ width: 28, height: 28, color: c.text, opacity: 0.6 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [planDistribution, setPlanDistribution] = useState([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { toast, hideToast, success, error: showError } = useToast();

  const getToken = () => localStorage.getItem("superadmin_token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/superadmin/login");
      return;
    }

    const storedAdmin = localStorage.getItem("superadmin");
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const statsResponse = await axios.get(
        `${API_URL}/admin/analytics/overview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStats(statsResponse.data.stats);
      setPlanDistribution(statsResponse.data.plan_distribution || []);
      setMonthlyGrowth(statsResponse.data.monthly_growth || []);

      await loadTenants();
    } catch (error) {
      console.error("Erreur chargement données:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = useCallback(async () => {
    try {
      const token = getToken();
      const params = new URLSearchParams({ limit: "20", offset: "0" });
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);

      const response = await axios.get(
        `${API_URL}/admin/tenants?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTenants(response.data.tenants);
    } catch (error) {
      console.error("Erreur chargement tenants:", error);
    }
  }, [searchTerm, statusFilter]);

  const handleLogout = () => {
    localStorage.removeItem("superadmin_token");
    localStorage.removeItem("superadmin");
    navigate("/superadmin/login");
  };

  const handleSuspendTenant = async (tenantId) => {
    if (!window.confirm("Voulez-vous vraiment suspendre ce salon ?")) return;
    try {
      const token = getToken();
      await axios.put(
        `${API_URL}/admin/tenants/${tenantId}/suspend`,
        { reason: "Suspension manuelle par SuperAdmin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      success("Salon suspendu avec succès");
      loadData();
    } catch (error) {
      console.error("Erreur suspension:", error);
      showError("Erreur lors de la suspension");
    }
  };

  const handleActivateTenant = async (tenantId) => {
    try {
      const token = getToken();
      await axios.put(
        `${API_URL}/admin/tenants/${tenantId}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      success("Salon réactivé avec succès");
      loadData();
    } catch (error) {
      console.error("Erreur activation:", error);
      showError("Erreur lors de l'activation");
    }
  };

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg, #0f0f1a 0%, #151528 50%, #1a1a2e 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: "3px solid rgba(99,102,241,0.2)",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#64748b", fontSize: 14 }}>Chargement du tableau de bord...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  const commandActions = [
    { icon: CurrencyEuroIcon, label: "Billing", desc: "Revenus & facturation", accent: "emerald", action: () => navigate("/superadmin/billing") },
    { icon: ChartBarIcon, label: "Analytics+", desc: "Cohortes & santé", accent: "indigo", action: () => navigate("/superadmin/analytics") },
    { icon: ArrowRightOnRectangleIcon, label: "Impersonation", desc: "Support client", accent: "orange", action: () => navigate("/superadmin/impersonation") },
    { icon: ShieldCheckIcon, label: "SuperAdmins", desc: "Gérer les admins", accent: "violet", action: () => navigate("/superadmin/admins") },
    { icon: ClipboardDocumentListIcon, label: "Logs d'activité", desc: "Historique actions", accent: "sky", action: () => navigate("/superadmin/logs") },
    { icon: UsersIcon, label: "Utilisateurs", desc: "Tous les users", accent: "cyan", action: () => navigate("/superadmin/users") },
    { icon: KeyIcon, label: "Mots de passe", desc: "Réinitialisations", accent: "amber", action: () => navigate("/superadmin/password-resets") },
    { icon: MegaphoneIcon, label: "Annonces", desc: "Communication globale", accent: "rose", action: () => navigate("/superadmin/announcements") },
    { icon: ChatBubbleLeftRightIcon, label: "Messages", desc: "Messagerie tenants", accent: "teal", action: () => navigate("/superadmin/messages") },
    { icon: BuildingStorefrontIcon, label: "Tous les salons", desc: "Liste complète", accent: "slate", action: () => setActiveTab("tenants") },
  ];

  const tabs = [
    { key: "overview", label: "Vue d'ensemble", icon: ChartBarIcon },
    { key: "tenants", label: "Salons", icon: BuildingStorefrontIcon },
  ];

  const maxGrowth = monthlyGrowth.reduce((max, m) => Math.max(max, m.new_tenants || 0), 1);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0f0f1a 0%, #151528 50%, #1a1a2e 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ═══ HEADER ═══ */}
      <header
        style={{
          background: "rgba(15, 15, 26, 0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
            {/* Logo + Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulseGlow 3s ease infinite",
                }}
              >
                <BoltIcon style={{ width: 20, height: 20, color: "white" }} />
              </div>
              <div>
                <h1 style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", margin: 0, letterSpacing: "-0.01em" }}>
                  SalonHub
                  <span style={{ color: "#6366f1", marginLeft: 6 }}>Control</span>
                </h1>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Super Admin Portal
                </p>
              </div>
            </div>

            {/* Right Side */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {/* Live indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <SignalIcon style={{ width: 14, height: 14, color: "#34d399" }} />
                <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>Live</span>
              </div>

              {/* Admin info */}
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>
                  {admin?.first_name} {admin?.last_name}
                </p>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                  {admin?.is_super ? "Super Admin" : "Admin"}
                </p>
              </div>

              {/* Avatar */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {admin?.first_name?.[0]}{admin?.last_name?.[0]}
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  background: "rgba(244,63,94,0.1)",
                  border: "1px solid rgba(244,63,94,0.2)",
                  borderRadius: 10,
                  padding: "8px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s",
                  color: "#fb7185",
                  fontSize: 13,
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(244,63,94,0.2)";
                  e.currentTarget.style.borderColor = "#fb7185";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(244,63,94,0.1)";
                  e.currentTarget.style.borderColor = "rgba(244,63,94,0.2)";
                }}
              >
                <PowerIcon style={{ width: 16, height: 16 }} />
                Quitter
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "32px 24px 60px" }}>

        {/* ─── Metrics Row ─── */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 32 }}>
            <MetricTile label="Total Salons" value={stats.total_tenants} icon={BuildingStorefrontIcon} accent="indigo" delay={0} />
            <MetricTile label="Salons Actifs" value={stats.active_tenants} icon={CheckCircleIcon} accent="emerald" delay={80} subtitle="Opérationnels" />
            <MetricTile label="En Essai" value={stats.trial_tenants} icon={SparklesIcon} accent="amber" delay={160} />
            <MetricTile label="Nouveaux (30j)" value={stats.new_tenants_30d} icon={ArrowTrendingUpIcon} accent="cyan" delay={240} />
          </div>
        )}

        {/* ─── Command Grid ─── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Actions rapides</h2>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Accès aux modules de gestion</p>
            </div>
            <button
              onClick={loadData}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 10,
                padding: "6px 14px",
                cursor: "pointer",
                color: "#818cf8",
                fontSize: 12,
                fontWeight: 600,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(99,102,241,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(99,102,241,0.1)";
              }}
            >
              <ArrowPathIcon style={{ width: 14, height: 14 }} />
              Rafraîchir
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {commandActions.map((cmd, i) => (
              <CommandTile
                key={cmd.label}
                icon={cmd.icon}
                label={cmd.label}
                desc={cmd.desc}
                accent={cmd.accent}
                onClick={cmd.action}
                delay={i * 40}
              />
            ))}
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 24,
            background: "rgba(30,30,46,0.6)",
            borderRadius: 14,
            padding: 4,
            width: "fit-content",
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.2s",
                  background: isActive ? "rgba(99,102,241,0.2)" : "transparent",
                  color: isActive ? "#818cf8" : "#64748b",
                }}
              >
                <tab.icon style={{ width: 16, height: 16 }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === "overview" && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, animation: "fadeInUp 0.4s ease" }}>
            {/* Global Stats */}
            <div
              style={{
                background: "#1e1e2e",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.06)",
                padding: 28,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 20 }}>
                Statistiques globales
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Total Users", value: stats.total_users, color: "#818cf8" },
                  { label: "Total Clients", value: stats.total_clients, color: "#34d399" },
                  { label: "Total RDV", value: stats.total_appointments, color: "#fbbf24" },
                  { label: "RDV Complétés", value: stats.completed_appointments, color: "#22d3ee" },
                ].map((item, i) => (
                  <div key={item.label} style={{ animation: `fadeInUp 0.4s ease ${i * 80}ms both` }}>
                    <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>{item.label}</p>
                    <p style={{ fontSize: 26, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Distribution */}
            <div
              style={{
                background: "#1e1e2e",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.06)",
                padding: 28,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 20 }}>
                Répartition par plan
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {planDistribution.length > 0 ? (
                  planDistribution.map((plan, i) => (
                    <PlanBar
                      key={plan.subscription_plan}
                      plan={plan.subscription_plan}
                      count={plan.count}
                      total={stats.total_tenants}
                      delay={i * 100}
                    />
                  ))
                ) : (
                  <p style={{ color: "#64748b", fontSize: 13 }}>Aucune donnée</p>
                )}
              </div>
            </div>

            {/* Monthly Growth */}
            <div
              style={{
                background: "#1e1e2e",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.06)",
                padding: 28,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 20 }}>
                Croissance mensuelle
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {monthlyGrowth.length > 0 ? (
                  monthlyGrowth.slice(0, 6).map((month, i) => (
                    <MonthBar
                      key={month.month}
                      month={month.month}
                      count={month.new_tenants}
                      maxCount={maxGrowth}
                      delay={i * 60}
                    />
                  ))
                ) : (
                  <p style={{ color: "#64748b", fontSize: 13 }}>Aucune donnée</p>
                )}
              </div>
            </div>

            {/* Status Breakdown */}
            <div
              style={{
                background: "#1e1e2e",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.06)",
                padding: 28,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 20 }}>
                Répartition par statut
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <StatusMiniCard label="Actifs" count={stats.active_tenants} accent="emerald" icon={CheckCircleIcon} delay={0} />
                <StatusMiniCard label="Essai" count={stats.trial_tenants} accent="sky" icon={SparklesIcon} delay={80} />
                <StatusMiniCard label="Suspendus" count={stats.suspended_tenants || 0} accent="rose" icon={PauseCircleIcon} delay={160} />
                <StatusMiniCard label="Nouveaux (30j)" count={stats.new_tenants_30d} accent="violet" icon={ArrowTrendingUpIcon} delay={240} />
              </div>
            </div>
          </div>
        )}

        {/* ═══ TENANTS TAB ═══ */}
        {activeTab === "tenants" && (
          <div
            style={{
              background: "#1e1e2e",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
              animation: "fadeInUp 0.4s ease",
            }}
          >
            {/* Search Bar */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Gestion des Salons</h2>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{tenants.length} salon(s) affichés</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <MagnifyingGlassIcon
                    style={{
                      width: 18,
                      height: 18,
                      color: "#64748b",
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email ou slug..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadTenants()}
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 42px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      color: "#e2e8f0",
                      fontSize: 13,
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    color: "#e2e8f0",
                    fontSize: 13,
                    outline: "none",
                    cursor: "pointer",
                    minWidth: 160,
                  }}
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="trial">Essai</option>
                  <option value="suspended">Suspendu</option>
                  <option value="cancelled">Annulé</option>
                </select>
                <button
                  onClick={loadTenants}
                  style={{
                    padding: "10px 22px",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none",
                    borderRadius: 10,
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "transform 0.15s, opacity 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  Rechercher
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Salon", "Email", "Plan", "Statut", "Stats", "Actions"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 20px",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          textAlign: h === "Actions" ? "right" : "left",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant, i) => {
                    const planColors = {
                      essential: { bg: "rgba(16,185,129,0.12)", text: "#34d399" },
                      pro: { bg: "rgba(99,102,241,0.12)", text: "#818cf8" },
                      custom: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24" },
                      trial: { bg: "rgba(56,189,248,0.12)", text: "#38bdf8" },
                    };
                    const planLabels = { essential: "Essential", pro: "Pro", custom: "Sur mesure", trial: "Trial", starter: "Essential", professional: "Pro" };
                    const pc = planColors[tenant.subscription_plan] || planColors.trial;

                    return (
                      <tr
                        key={tenant.id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          transition: "background 0.15s",
                          animation: `slideInRight 0.3s ease ${i * 30}ms both`,
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        onClick={() => navigate(`/superadmin/tenants/${tenant.id}`)}
                      >
                        <td style={{ padding: "14px 20px" }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{tenant.name}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>/{tenant.slug}</div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: 13, color: "#94a3b8" }}>
                          {tenant.email}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "4px 12px",
                              borderRadius: 20,
                              background: pc.bg,
                              color: pc.text,
                            }}
                          >
                            {planLabels[tenant.subscription_plan] || tenant.subscription_plan}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <StatusBadge status={tenant.subscription_status} />
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                              <UsersIcon style={{ width: 13, height: 13 }} />
                              {tenant.total_users} users
                            </span>
                            <span style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                              <ClipboardDocumentListIcon style={{ width: 13, height: 13 }} />
                              {tenant.total_appointments} RDV
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                            {tenant.subscription_status === "suspended" ? (
                              <button
                                onClick={() => handleActivateTenant(tenant.id)}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 8,
                                  border: "1px solid rgba(16,185,129,0.3)",
                                  background: "rgba(16,185,129,0.1)",
                                  color: "#34d399",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.2)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.1)"; }}
                              >
                                Activer
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspendTenant(tenant.id)}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 8,
                                  border: "1px solid rgba(244,63,94,0.3)",
                                  background: "rgba(244,63,94,0.1)",
                                  color: "#fb7185",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(244,63,94,0.2)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(244,63,94,0.1)"; }}
                              >
                                Suspendre
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/superadmin/tenants/${tenant.id}`)}
                              style={{
                                padding: "6px 14px",
                                borderRadius: 8,
                                border: "1px solid rgba(99,102,241,0.3)",
                                background: "rgba(99,102,241,0.1)",
                                color: "#818cf8",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; }}
                            >
                              Détails
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  );
}

export default SuperAdminDashboard;
