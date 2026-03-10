/**
 * Dashboard - Purple Dynasty Premium Theme
 * Multi-Sector Adaptive Dashboard with Business Type Customization
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import Joyride, { STATUS } from "react-joyride";
import { useAuth } from "../contexts/AuthContext";
import { useCurrency } from "../contexts/CurrencyContext";
import DashboardLayout from "../components/common/DashboardLayout";
import api from "../services/api";
import {
  CalendarDaysIcon,
  UserGroupIcon,
  ScissorsIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  AcademicCapIcon,
  HeartIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// Business Type Configuration
const BUSINESS_TYPE_CONFIG = {
  beauty: {
    label: "Beauté",
    icon: ScissorsIcon,
    gradient: "from-violet-500 to-indigo-600",
    cardGradient: "from-violet-500 to-violet-600",
    lightBg: "bg-violet-50",
    textColor: "text-violet-600",
    borderColor: "border-violet-500",
    servicesLabel: "Services actifs",
    appointmentsLabel: "RDV aujourd'hui",
    pendingLabel: "En attente",
    welcomeMessage: "Voici un aperçu de votre salon.",
  },
  restaurant: {
    label: "Restaurant",
    icon: BuildingStorefrontIcon,
    gradient: "from-amber-500 to-orange-600",
    cardGradient: "from-amber-500 to-amber-600",
    lightBg: "bg-amber-50",
    textColor: "text-amber-600",
    borderColor: "border-amber-500",
    servicesLabel: "Plats au menu",
    appointmentsLabel: "Réservations",
    pendingLabel: "À confirmer",
    welcomeMessage: "Voici un aperçu de votre restaurant.",
  },
  training: {
    label: "Formation",
    icon: AcademicCapIcon,
    gradient: "from-emerald-500 to-green-600",
    cardGradient: "from-emerald-500 to-emerald-600",
    lightBg: "bg-emerald-50",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-500",
    servicesLabel: "Formations",
    appointmentsLabel: "Sessions",
    pendingLabel: "À valider",
    welcomeMessage: "Voici un aperçu de votre centre de formation.",
  },
  medical: {
    label: "Médical",
    icon: HeartIcon,
    gradient: "from-cyan-500 to-teal-600",
    cardGradient: "from-cyan-500 to-cyan-600",
    lightBg: "bg-cyan-50",
    textColor: "text-cyan-600",
    borderColor: "border-cyan-500",
    servicesLabel: "Prestations",
    appointmentsLabel: "Consultations",
    pendingLabel: "En attente",
    welcomeMessage: "Voici un aperçu de votre cabinet.",
  },
};

const Dashboard = () => {
  const { user, tenant } = useAuth();
  const { formatPrice } = useCurrency();

  // Get business type config
  const businessType = tenant?.business_type || "beauty";
  const config = BUSINESS_TYPE_CONFIG[businessType] || BUSINESS_TYPE_CONFIG.beauty;
  const BusinessIcon = config.icon;

  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalClients: 0,
    totalServices: 0,
    pendingAppointments: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    completedThisMonth: 0,
    cancelledThisMonth: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentClients, setRecentClients] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [runTutorial, setRunTutorial] = useState(false);
  const [hasBusinessHours, setHasBusinessHours] = useState(true);

  // Tutorial steps
  const tutorialSteps = [
    {
      target: ".dashboard-header",
      content: "🎉 Bienvenue sur SalonHub ! Ce tutoriel va vous guider à travers le workflow complet. Commençons !",
      disableBeacon: true,
      placement: "bottom",
    },
    {
      target: "body",
      content: `📋 Workflow Principal :\n\n1️⃣ Configurer vos horaires d'ouverture\n2️⃣ Ajouter vos ${config.servicesLabel.toLowerCase()}\n3️⃣ Ajouter vos clients\n4️⃣ Partager votre lien de réservation\n5️⃣ Recevoir et gérer les ${config.appointmentsLabel.toLowerCase()}\n6️⃣ Suivre vos performances`,
      placement: "center",
    },
    ...(!hasBusinessHours ? [{
      target: ".business-hours-alert",
      content: "🚨 ALERTE IMPORTANTE !\n\nVos horaires ne sont pas configurés. Cliquez sur ce lien pour accéder à l'onglet Horaires dans les Paramètres.",
      placement: "bottom",
    }] : []),
    {
      target: ".stats-services",
      content: `Configurez vos ${config.servicesLabel.toLowerCase()} avec leurs tarifs et durées.`,
      placement: "bottom",
    },
    {
      target: ".stats-clients",
      content: "Gérez vos clients et leur historique.",
      placement: "bottom",
    },
    {
      target: ".share-btn",
      content: "Partagez votre lien de réservation avec vos clients !",
      placement: "bottom",
    },
    {
      target: ".stats-pending",
      content: `Les ${config.pendingLabel.toLowerCase()} apparaissent ici. Validez-les rapidement !`,
      placement: "bottom",
    },
    {
      target: ".stats-today",
      content: `Vos ${config.appointmentsLabel.toLowerCase()} du jour s'affichent ici.`,
      placement: "bottom",
    },
  ];

  useEffect(() => {
    loadDashboardData();

    // Vérifier si le tutoriel a été complété (priorité: base de données > localStorage)
    const hasSeenTutorialLocal = localStorage.getItem("dashboardTutorialSeen");
    const hasCompletedOnboarding = tenant?.onboarding_status === "completed";

    if (!hasCompletedOnboarding && !hasSeenTutorialLocal) {
      setTimeout(() => setRunTutorial(true), 1000);
    }
  }, [tenant?.onboarding_status]);

  const handleJoyrideCallback = async (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTutorial(false);
      localStorage.setItem("dashboardTutorialSeen", "true");

      // Marquer le tutoriel comme terminé dans la base de données
      try {
        await api.put("/settings/onboarding/complete");
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut onboarding:", error);
      }
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const settingsRes = await api.get("/settings");
      const settings = settingsRes.data;

      let hasValidBusinessHours = false;
      if (settings?.business_hours) {
        for (const dayData of Object.values(settings.business_hours)) {
          const isValid = !dayData.closed &&
            dayData.open && dayData.close &&
            (dayData.open !== "00:00" || dayData.close !== "00:00") &&
            dayData.open !== dayData.close;
          if (isValid) {
            hasValidBusinessHours = true;
            break;
          }
        }
      }
      setHasBusinessHours(hasValidBusinessHours);

      // Load data based on business type
      if (businessType === "restaurant") {
        await loadRestaurantData();
      } else {
        await loadBeautyData();
      }
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load data for beauty/default business type
  const loadBeautyData = async () => {
    const todayRes = await api.get("/appointments/today");
    const today = todayRes.data.data || [];
    setTodayAppointments(today);

    const clientsRes = await api.get("/clients", { params: { limit: 5 } });
    setRecentClients(clientsRes.data.data.slice(0, 5));

    const servicesRes = await api.get("/services");
    const allServices = servicesRes.data.data;

    const appointmentsRes = await api.get("/appointments", {
      params: { status: "pending" },
    });

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const allAppointmentsRes = await api.get("/appointments");
    const allAppointments = allAppointmentsRes.data.data || [];

    const monthAppointments = allAppointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate >= firstDayOfMonth;
    });

    const completedThisMonth = monthAppointments.filter(a => a.status === "completed").length;
    const cancelledThisMonth = monthAppointments.filter(a => a.status === "cancelled").length;

    const monthRevenue = monthAppointments
      .filter(a => a.status === "completed")
      .reduce((sum, a) => sum + (parseFloat(a.service_price) || 0), 0);

    const todayRevenue = today
      .filter(a => a.status === "completed")
      .reduce((sum, a) => sum + (parseFloat(a.service_price) || 0), 0);

    const serviceCount = {};
    allAppointments.forEach((apt) => {
      if (apt.service_id) {
        serviceCount[apt.service_id] = (serviceCount[apt.service_id] || 0) + 1;
      }
    });

    const popular = allServices
      .map((service) => ({
        ...service,
        bookingCount: serviceCount[service.id] || 0,
      }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);

    setPopularServices(popular);

    setStats({
      todayAppointments: today.length,
      totalClients: clientsRes.data.pagination?.total || 0,
      totalServices: allServices.length,
      pendingAppointments: appointmentsRes.data.data.length,
      todayRevenue,
      monthRevenue,
      completedThisMonth,
      cancelledThisMonth,
    });
  };

  // Load data for restaurant business type
  const loadRestaurantData = async () => {
    try {
      // Fetch orders, menu items, and reservations
      const [ordersRes, menusRes, reservationsRes] = await Promise.all([
        api.get("/restaurant/orders"),
        api.get("/restaurant/menus"),
        api.get("/restaurant/reservations").catch(() => ({ data: { data: [] } })),
      ]);

      const orders = ordersRes.data.data || [];
      const menus = menusRes.data.data || [];
      const reservations = reservationsRes.data.data || [];

      // Filter today's orders
      const today = new Date().toISOString().split("T")[0];
      const todayOrders = orders.filter(o => {
        const orderDate = o.order_date || (o.created_at && o.created_at.split("T")[0]);
        return orderDate === today;
      });

      // Calculate stats
      const pendingOrders = orders.filter(o => o.status === "pending").length;
      const todayReservations = reservations.filter(r => r.reservation_date === today);

      // Today's revenue from completed paid orders
      const todayRevenue = todayOrders
        .filter(o => o.status === "completed" && o.payment_status === "paid")
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

      // Month revenue
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const monthOrders = orders.filter(o => {
        const orderDate = o.order_date || (o.created_at && o.created_at.split("T")[0]);
        return orderDate >= firstDayOfMonth;
      });

      const monthRevenue = monthOrders
        .filter(o => o.status === "completed" && o.payment_status === "paid")
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

      const completedThisMonth = monthOrders.filter(o => o.status === "completed").length;
      const cancelledThisMonth = monthOrders.filter(o => o.status === "cancelled").length;

      // Set today appointments as today's orders for display
      setTodayAppointments(todayOrders.slice(0, 10).map(o => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        customer_name: o.customer_name || `Table ${o.table_number || '-'}`,
        total_amount: o.total_amount,
        order_type: o.order_type,
        appointment_date: o.order_date,
        appointment_time: o.order_time,
      })));

      // Set popular services as popular menu items
      setPopularServices(menus.filter(m => m.is_available).slice(0, 5).map(m => ({
        id: m.id,
        name: m.name,
        price: m.price,
        category: m.category,
        bookingCount: 0,
      })));

      // Set recent clients as recent reservations
      setRecentClients(reservations.slice(0, 5).map(r => ({
        id: r.id,
        first_name: r.customer_name,
        last_name: "",
        phone: r.customer_phone,
        email: r.customer_email,
      })));

      setStats({
        todayAppointments: todayReservations.length,
        totalClients: reservations.length,
        totalServices: menus.filter(m => m.is_active).length,
        pendingAppointments: pendingOrders,
        todayRevenue,
        monthRevenue,
        completedThisMonth,
        cancelledThisMonth,
      });
    } catch (err) {
      console.error("Error loading restaurant data:", err);
      // Set default empty stats on error
      setStats({
        todayAppointments: 0,
        totalClients: 0,
        totalServices: 0,
        pendingAppointments: 0,
        todayRevenue: 0,
        monthRevenue: 0,
        completedThisMonth: 0,
        cancelledThisMonth: 0,
      });
    }
  };

  const getBookingUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/book/${tenant?.slug}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getBookingUrl());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
    }
  };

  const handleShareWhatsApp = () => {
    const url = getBookingUrl();
    const text = `Réservez votre rendez-vous en ligne: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareEmail = () => {
    const url = getBookingUrl();
    const subject = "Réservez votre rendez-vous";
    const body = `Bonjour,\n\nVous pouvez réserver en ligne:\n${url}\n\nÀ bientôt!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleShareSMS = () => {
    const url = getBookingUrl();
    const text = `Réservez votre rendez-vous: ${url}`;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  };

  const qrRef = useRef(null);

  const handleDownloadQR = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const padding = 40;
    const qrSize = 256;
    const textHeight = 40;
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2 + textHeight;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, qrSize, qrSize);

      // Salon name below QR
      ctx.fillStyle = "#1F2937";
      ctx.font = "bold 18px Arial, sans-serif";
      ctx.textAlign = "center";
      const salonName = tenant?.business_name || tenant?.slug || "SalonHub";
      ctx.fillText(salonName, canvas.width / 2, qrSize + padding + 30);

      const link = document.createElement("a");
      link.download = `qrcode-${tenant?.slug || "salon"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }, [tenant]);

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-amber-100 text-amber-800 border border-amber-200",
      confirmed: "bg-emerald-100 text-emerald-800 border border-emerald-200",
      cancelled: "bg-red-100 text-red-800 border border-red-200",
      completed: "bg-violet-100 text-violet-800 border border-violet-200",
    };
    const labels = {
      pending: "En attente",
      confirmed: "Confirmé",
      cancelled: "Annulé",
      completed: "Terminé",
    };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className={`w-12 h-12 rounded-xl border-2 border-slate-200 border-t-violet-600 animate-elegant-spin mx-auto`}></div>
            <p className="mt-4 text-slate-600 font-medium">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Joyride
        steps={tutorialSteps}
        run={runTutorial}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: { primaryColor: "#8B5CF6", zIndex: 10000 },
          buttonNext: { backgroundColor: "#8B5CF6", fontSize: 14, padding: "8px 16px", borderRadius: "12px" },
          buttonBack: { color: "#64748B", fontSize: 14, marginRight: 10 },
          buttonSkip: { color: "#64748B", fontSize: 14 },
          tooltip: { borderRadius: "16px", fontSize: 14 },
        }}
        locale={{ back: "Précédent", close: "Fermer", last: "Terminer", next: "Suivant", skip: "Passer" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 dashboard-header">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                <BusinessIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">Dashboard</h1>
            </div>
            <p className="text-slate-500">
              Bienvenue, <span className="font-semibold text-slate-700">{user?.first_name}</span> ! {config.welcomeMessage}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setRunTutorial(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-200 text-sm font-medium rounded-xl shadow-soft text-slate-600 bg-white hover:bg-slate-50 transition-all duration-300 flex-1 sm:flex-none"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Aide</span>
            </button>
            <Link
              to={`/book/${tenant?.slug}`}
              target="_blank"
              className={`view-public-page-btn inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl shadow-soft text-white bg-gradient-to-r ${config.gradient} hover:shadow-glow transition-all duration-300 flex-1 sm:flex-none`}
            >
              Page publique
            </Link>
            <button
              onClick={() => setShowShareModal(true)}
              className="share-btn inline-flex items-center justify-center px-4 py-2.5 border border-slate-200 text-sm font-medium rounded-xl shadow-soft text-slate-600 bg-white hover:bg-slate-50 transition-all duration-300 flex-1 sm:flex-none"
            >
              <ShareIcon className="h-5 w-5 sm:mr-2" />
              <span className="ml-2 sm:ml-0">Partager</span>
            </button>
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowShareModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-soft-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-scale-in">
                <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br ${config.gradient}`}>
                  <ShareIcon className="h-7 w-7 text-white" />
                </div>
                <div className="mt-4 text-center">
                  <h3 className="font-display text-xl font-semibold text-slate-800">Partager votre page</h3>
                  <p className="mt-2 text-sm text-slate-500">Partagez ce lien avec vos clients</p>

                  <div className="mt-5 flex rounded-xl shadow-inner-soft border border-slate-200 overflow-hidden">
                    <input
                      type="text"
                      readOnly
                      value={getBookingUrl()}
                      className="flex-1 min-w-0 block w-full px-4 py-3 bg-slate-50 text-sm text-slate-600 border-0 focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`inline-flex items-center px-4 py-3 bg-white border-l border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors`}
                    >
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {copySuccess && (
                    <p className="mt-2 text-sm text-emerald-600 font-medium flex items-center justify-center gap-1">
                      <CheckCircleIcon className="h-4 w-4" /> Lien copié !
                    </p>
                  )}

                  {/* QR Code Section */}
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-3">QR Code de réservation</p>
                    <div ref={qrRef} className="flex justify-center py-3 bg-white rounded-lg">
                      <QRCode
                        value={getBookingUrl()}
                        size={180}
                        level="H"
                        fgColor="#1F2937"
                      />
                    </div>
                    <button
                      onClick={handleDownloadQR}
                      className="mt-3 w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl text-violet-700 bg-violet-100 hover:bg-violet-200 transition-colors duration-300"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Télécharger le QR Code
                    </button>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-medium text-slate-700 mb-3">Partager via :</p>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={handleShareWhatsApp}
                        className="flex flex-col items-center justify-center px-4 py-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all duration-300"
                      >
                        <svg className="h-6 w-6 mb-2 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        WhatsApp
                      </button>
                      <button
                        onClick={handleShareEmail}
                        className="flex flex-col items-center justify-center px-4 py-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-all duration-300"
                      >
                        <svg className="h-6 w-6 mb-2 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                      </button>
                      <button
                        onClick={handleShareSMS}
                        className="flex flex-col items-center justify-center px-4 py-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all duration-300"
                      >
                        <svg className="h-6 w-6 mb-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        SMS
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="mt-6 w-full inline-flex justify-center rounded-xl border border-slate-200 shadow-soft px-4 py-3 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Business Hours Alert */}
        {!hasBusinessHours && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-xl p-4 shadow-soft animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800">⚠️ Configuration requise</h3>
                <p className="mt-1 text-sm text-red-700">
                  Vos horaires ne sont pas configurés. <strong>Vos clients ne peuvent pas réserver en ligne !</strong>
                </p>
                <Link
                  to="/settings?tab=hours"
                  className="business-hours-alert mt-2 inline-flex items-center text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-1" />
                  Configurer maintenant →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pending Appointments Alert */}
        {stats.pendingAppointments > 0 && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 rounded-xl p-4 shadow-soft animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <ClockIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-800">
                  Vous avez <strong>{stats.pendingAppointments}</strong> {config.pendingLabel.toLowerCase()}.{" "}
                  <Link to="/appointments" className="font-medium underline hover:text-amber-900">
                    Voir →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Appointments */}
          <div className={`stats-today bg-gradient-to-br ${config.cardGradient} text-white rounded-2xl p-6 shadow-soft hover:shadow-glow transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{config.appointmentsLabel}</p>
                <p className="mt-2 text-4xl font-bold font-display">{stats.todayAppointments}</p>
                <Link to="/appointments" className="mt-3 text-sm text-white/80 hover:text-white inline-flex items-center transition-colors">
                  Voir le planning →
                </Link>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <CalendarDaysIcon className="h-10 w-10" />
              </div>
            </div>
          </div>

          {/* Total Clients */}
          <div className="stats-clients bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Total clients</p>
                <p className="mt-2 text-4xl font-bold font-display">{stats.totalClients}</p>
                <Link to="/clients" className="mt-3 text-sm text-white/80 hover:text-white inline-flex items-center transition-colors">
                  Gérer les clients →
                </Link>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <UserGroupIcon className="h-10 w-10" />
              </div>
            </div>
          </div>

          {/* Total Services */}
          <div className="stats-services bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl p-6 shadow-soft hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{config.servicesLabel}</p>
                <p className="mt-2 text-4xl font-bold font-display">{stats.totalServices}</p>
                <Link to="/services" className="mt-3 text-sm text-white/80 hover:text-white inline-flex items-center transition-colors">
                  Gérer →
                </Link>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <BusinessIcon className="h-10 w-10" />
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="stats-pending bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{config.pendingLabel}</p>
                <p className="mt-2 text-4xl font-bold font-display">{stats.pendingAppointments}</p>
                <Link to="/appointments?status=pending" className="mt-3 text-sm text-white/80 hover:text-white inline-flex items-center transition-colors">
                  Valider →
                </Link>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <ClockIcon className="h-10 w-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row 2: Revenue */}
        <div className="revenue-section grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">Revenu aujourd'hui</p>
              <CurrencyDollarIcon className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold font-display text-slate-800">{formatPrice(stats.todayRevenue)}</p>
            <div className="mt-2 flex items-center text-sm text-emerald-600">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              <span>Terminés</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">Revenu ce mois</p>
              <ChartBarIcon className="h-6 w-6 text-violet-500" />
            </div>
            <p className="text-3xl font-bold font-display text-slate-800">{formatPrice(stats.monthRevenue)}</p>
            <div className="mt-2 text-sm text-slate-500">{stats.completedThisMonth} complétés</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">Complétés ce mois</p>
              <CheckCircleIcon className="h-6 w-6 text-violet-500" />
            </div>
            <p className="text-3xl font-bold font-display text-slate-800">{stats.completedThisMonth}</p>
            <div className="mt-2 flex items-center text-sm text-violet-600">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              Terminés
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">Annulés ce mois</p>
              <XCircleIcon className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-3xl font-bold font-display text-slate-800">{stats.cancelledThisMonth}</p>
            <div className="mt-2 flex items-center text-sm text-red-600">
              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              À surveiller
            </div>
          </div>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Appointments List */}
          <div className="lg:col-span-2">
            <div className="today-appointments bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-slate-800 flex items-center">
                  <CalendarDaysIcon className={`h-5 w-5 mr-2 ${config.textColor}`} />
                  {config.appointmentsLabel} du jour
                </h2>
                <Link to="/appointments" className={`text-sm ${config.textColor} hover:opacity-80 font-medium transition-colors`}>
                  Voir tout
                </Link>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <CalendarDaysIcon className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-3 font-medium text-slate-600">Aucun rendez-vous</h3>
                  <p className="mt-1 text-sm text-slate-400">Aucun rendez-vous prévu pour aujourd'hui.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {todayAppointments.map((apt) => (
                    <div key={apt.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`h-12 w-12 rounded-xl ${config.lightBg} flex items-center justify-center`}>
                            <span className={`${config.textColor} font-semibold text-lg`}>
                              {apt.client_first_name?.charAt(0)}{apt.client_last_name?.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {apt.client_first_name} {apt.client_last_name}
                            </p>
                            <p className="text-sm text-slate-500 truncate">{apt.service_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-sm text-slate-500">
                            <span className="font-medium">{apt.start_time?.substring(0, 5)}</span>
                            <span className="mx-1">-</span>
                            <span>{apt.end_time?.substring(0, 5)}</span>
                          </div>
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Popular Services */}
            <div className="popular-services bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-display text-lg font-semibold text-slate-800 flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2 text-violet-500" />
                  {config.servicesLabel} populaires
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {popularServices.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Aucune donnée</p>
                ) : (
                  popularServices.map((service, index) => (
                    <div key={service.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-lg ${config.lightBg} flex items-center justify-center`}>
                          <span className={`${config.textColor} font-semibold text-sm`}>{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{service.name}</p>
                          <p className="text-xs text-slate-400">{formatPrice(service.price)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800">{service.bookingCount}</p>
                        <p className="text-xs text-slate-400">réserv.</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Clients */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-slate-800 flex items-center">
                  <UserGroupIcon className="h-5 w-5 mr-2 text-emerald-500" />
                  Clients récents
                </h2>
                <Link to="/clients" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                  Voir tout
                </Link>
              </div>
              <div className="p-6 space-y-3">
                {recentClients.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Aucun client</p>
                ) : (
                  recentClients.map((client) => (
                    <div key={client.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-700 font-medium">
                          {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {client.email || client.phone || "Pas de contact"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
