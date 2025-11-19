/**
 * Dashboard - Page d'accueil admin AMÉLIORÉE
 * Vue d'ensemble avec statistiques avancées, graphiques et insights
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const { user, tenant } = useAuth();
  const { formatPrice } = useCurrency();
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

  // Étapes du tutoriel - Workflow principal
  const tutorialSteps = [
    {
      target: ".dashboard-header",
      content: "🎉 Bienvenue sur SalonHub ! Ce tutoriel va vous guider à travers le workflow complet pour gérer votre salon. Commençons !",
      disableBeacon: true,
      placement: "bottom",
    },
    {
      target: "body",
      content: "📋 Workflow Principal :\n\n1️⃣ Configurer vos horaires d'ouverture\n2️⃣ Ajouter vos services\n3️⃣ Ajouter vos clients\n4️⃣ Partager votre lien de réservation\n5️⃣ Recevoir et gérer les rendez-vous\n6️⃣ Suivre vos performances\n\nSuivez ce guide pour démarrer rapidement !",
      placement: "center",
    },
    // Ajout conditionnel de l'alerte horaires si non configurés
    ...(!hasBusinessHours ? [{
      target: ".business-hours-alert",
      content: "🚨 ALERTE IMPORTANTE !\n\nSi vous voyez cette bannière rouge, cela signifie que vos horaires ne sont pas configurés. Cliquez sur ce lien pour accéder directement à l'onglet Horaires dans les Paramètres et configurer vos jours et heures d'ouverture.",
      placement: "bottom",
    }] : []),
    {
      target: "body",
      content: "⚠️ ÉTAPE CRUCIALE :\n\n⏰ Configuration des Horaires d'Ouverture\n\nAvant toute chose, vous DEVEZ configurer vos horaires d'ouverture dans les Paramètres. Sans cette configuration, vos clients ne pourront PAS réserver en ligne !\n\nAllez dans : Menu → Paramètres → Onglet Horaires",
      placement: "center",
    },
    {
      target: ".stats-services",
      content: "Étape 2 : Configurez vos services (coupes, colorations, soins...). Cliquez sur 'Gérer les services' pour ajouter vos prestations, leurs durées et tarifs.",
      placement: "bottom",
    },
    {
      target: ".stats-clients",
      content: "Étape 3 : Ajoutez vos clients existants dans le système. Gérez leurs informations, historique et préférences. Les nouveaux clients peuvent aussi s'enregistrer lors de la réservation en ligne.",
      placement: "bottom",
    },
    {
      target: ".share-btn",
      content: "Étape 4 : Partagez votre lien de réservation ! Utilisez ce bouton pour envoyer le lien à vos clients par WhatsApp, Email ou SMS. C'est votre outil de marketing principal.",
      placement: "bottom",
    },
    {
      target: ".view-public-page-btn",
      content: "💡 Astuce : Prévisualisez votre page de réservation publique pour voir ce que vos clients verront. Vérifiez que vos services, horaires et créneaux disponibles sont corrects.",
      placement: "bottom",
    },
    {
      target: ".stats-pending",
      content: "Étape 5a : Lorsque vos clients réservent en ligne, les rendez-vous apparaissent ici en 'En attente'. Vous devez les confirmer rapidement pour valider la réservation.",
      placement: "bottom",
    },
    {
      target: ".stats-today",
      content: "Étape 5b : Les rendez-vous confirmés pour aujourd'hui s'affichent ici. Cliquez pour voir le planning complet et gérer vos rendez-vous (confirmer, annuler, modifier).",
      placement: "bottom",
    },
    {
      target: ".today-appointments",
      content: "📅 Vue détaillée de vos rendez-vous du jour : client, service, horaire et statut. Vous pouvez marquer les rendez-vous comme 'Terminés' une fois complétés.",
      placement: "left",
    },
    {
      target: ".revenue-section",
      content: "Étape 6 : Suivez vos performances financières ! Consultez vos revenus quotidiens et mensuels, le nombre de rendez-vous complétés et annulés.",
      placement: "top",
    },
    {
      target: ".popular-services",
      content: "📊 Analysez vos services les plus populaires pour optimiser votre offre et vos prix. Concentrez-vous sur ce qui fonctionne le mieux !",
      placement: "left",
    },
    {
      target: "body",
      content: "🎯 Récapitulatif du Workflow :\n\n✅ 1. Configurez vos HORAIRES (Paramètres) ⚠️ CRUCIAL\n✅ 2. Ajoutez vos services et tarifs\n✅ 3. Ajoutez vos clients\n✅ 4. Partagez votre lien de réservation\n✅ 5. Validez les rendez-vous entrants\n✅ 6. Gérez votre planning quotidien\n✅ 7. Suivez vos performances\n\nVous êtes prêt à démarrer ! 🚀",
      placement: "center",
    },
  ];

  useEffect(() => {
    loadDashboardData();

    // Vérifier si c'est la première visite
    const hasSeenTutorial = localStorage.getItem("dashboardTutorialSeen");
    if (!hasSeenTutorial) {
      // Démarrer le tutoriel après un court délai pour laisser la page se charger
      setTimeout(() => {
        setRunTutorial(true);
      }, 1000);
    }
  }, []);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTutorial(false);
      localStorage.setItem("dashboardTutorialSeen", "true");
    }
  };

  const startTutorial = () => {
    setRunTutorial(true);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Vérifier si les horaires sont configurés
      const settingsRes = await api.get("/settings");

      // L'API retourne directement l'objet settings dans data
      const settings = settingsRes.data;

      // Vérifier s'il y a au moins un jour ouvert avec des horaires valides
      let hasValidBusinessHours = false;

      if (settings && settings.business_hours) {
        // Parcourir tous les jours
        for (const dayData of Object.values(settings.business_hours)) {
          // Un jour est considéré comme valide s'il n'est pas fermé
          // ET qu'il a des heures d'ouverture/fermeture différentes de 00:00
          const isValid = !dayData.closed &&
                         dayData.open &&
                         dayData.close &&
                         (dayData.open !== "00:00" || dayData.close !== "00:00") &&
                         dayData.open !== dayData.close;

          if (isValid) {
            hasValidBusinessHours = true;
            break;
          }
        }
      }

      setHasBusinessHours(hasValidBusinessHours);

      // Charger RDV du jour
      const todayRes = await api.get("/appointments/today");
      const today = todayRes.data.data || [];
      setTodayAppointments(today);

      // Charger clients récents (limité à 5)
      const clientsRes = await api.get("/clients", { params: { limit: 5 } });
      setRecentClients(clientsRes.data.data.slice(0, 5));

      // Charger tous les services
      const servicesRes = await api.get("/services");
      const allServices = servicesRes.data.data;

      // Charger tous les RDV pour les statistiques
      const appointmentsRes = await api.get("/appointments", {
        params: { status: "pending" },
      });

      // Calculer les statistiques du mois
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const allAppointmentsRes = await api.get("/appointments");
      const allAppointments = allAppointmentsRes.data.data || [];

      const monthAppointments = allAppointments.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= firstDayOfMonth;
      });

      const completedThisMonth = monthAppointments.filter(
        (a) => a.status === "completed"
      ).length;
      const cancelledThisMonth = monthAppointments.filter(
        (a) => a.status === "cancelled"
      ).length;

      // Calculer le revenu du mois et d'aujourd'hui
      const monthRevenue = monthAppointments
        .filter((a) => a.status === "completed")
        .reduce((sum, a) => sum + (parseFloat(a.service_price) || 0), 0);

      const todayRevenue = today
        .filter((a) => a.status === "completed")
        .reduce((sum, a) => sum + (parseFloat(a.service_price) || 0), 0);

      // Services populaires (basé sur le nombre de RDV)
      const serviceCount = {};
      allAppointments.forEach((apt) => {
        if (apt.service_id) {
          serviceCount[apt.service_id] =
            (serviceCount[apt.service_id] || 0) + 1;
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
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
    } finally {
      setLoading(false);
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
    const body = `Bonjour,\n\nVous pouvez réserver votre rendez-vous en ligne en cliquant sur ce lien:\n${url}\n\nÀ bientôt!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleShareSMS = () => {
    const url = getBookingUrl();
    const text = `Réservez votre rendez-vous: ${url}`;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      confirmed: "bg-green-100 text-green-800 border border-green-200",
      cancelled: "bg-red-100 text-red-800 border border-red-200",
      completed: "bg-blue-100 text-blue-800 border border-blue-200",
    };

    const labels = {
      pending: "En attente",
      confirmed: "Confirmé",
      cancelled: "Annulé",
      completed: "Terminé",
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-medium rounded-full ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Tutoriel interactif */}
      <Joyride
        steps={tutorialSteps}
        run={runTutorial}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "#4F46E5",
            zIndex: 10000,
          },
          buttonNext: {
            backgroundColor: "#4F46E5",
            fontSize: 14,
            padding: "8px 16px",
            borderRadius: "6px",
          },
          buttonBack: {
            color: "#6B7280",
            fontSize: 14,
            marginRight: 10,
          },
          buttonSkip: {
            color: "#6B7280",
            fontSize: 14,
          },
          tooltip: {
            borderRadius: "8px",
            fontSize: 14,
          },
          tooltipContent: {
            padding: "12px 8px",
          },
        }}
        locale={{
          back: "Précédent",
          close: "Fermer",
          last: "Terminer",
          next: "Suivant",
          skip: "Passer",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center dashboard-header">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Bienvenue, {user?.first_name} ! Voici un aperçu de votre activité.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={startTutorial}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Relancer le tutoriel"
            >
              <svg
                className="h-5 w-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <Link
              to={`/book/${tenant?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="view-public-page-btn inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Voir la page publique
            </Link>
            <button
              onClick={() => setShowShareModal(true)}
              className="share-btn inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ShareIcon className="h-5 w-5 mr-2" />
              Partager
            </button>
          </div>
        </div>

        {/* Modal de partage */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Overlay */}
              <div
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                onClick={() => setShowShareModal(false)}
              ></div>

              {/* Modal */}
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                    <ShareIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Partager votre page de réservation
                    </h3>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-4">
                        Partagez ce lien avec vos clients pour qu'ils puissent
                        réserver en ligne
                      </p>

                      {/* Lien de réservation */}
                      <div className="mt-4 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={getBookingUrl()}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-sm text-gray-600"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <ClipboardDocumentIcon className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Message de succès */}
                      {copySuccess && (
                        <p className="mt-2 text-sm text-green-600 font-medium">
                          ✓ Lien copié dans le presse-papiers !
                        </p>
                      )}

                      {/* Boutons de partage */}
                      <div className="mt-6">
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Partager via :
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={handleShareWhatsApp}
                            className="inline-flex flex-col items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <svg
                              className="h-6 w-6 mb-1 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            WhatsApp
                          </button>

                          <button
                            onClick={handleShareEmail}
                            className="inline-flex flex-col items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <svg
                              className="h-6 w-6 mb-1 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            Email
                          </button>

                          <button
                            onClick={handleShareSMS}
                            className="inline-flex flex-col items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-purple-50 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            <svg
                              className="h-6 w-6 mb-1 text-purple-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                            SMS
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerte horaires non configurés */}
        {!hasBusinessHours && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <ClockIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  ⚠️ Configuration requise : Horaires d'ouverture
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Vos horaires d'ouverture ne sont pas configurés. Sans cette
                    configuration, <strong>vos clients ne pourront PAS réserver en ligne</strong> !
                  </p>
                  <p className="mt-2">
                    <Link
                      to="/settings?tab=hours"
                      className="business-hours-alert font-medium underline hover:text-red-900 inline-flex items-center"
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-1" />
                      Configurer mes horaires maintenant →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification pour RDV en attente */}
        {stats.pendingAppointments > 0 && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Vous avez <strong>{stats.pendingAppointments}</strong>{" "}
                  rendez-vous en attente de validation.{" "}
                  <Link
                    to="/appointments"
                    className="font-medium underline hover:text-yellow-800"
                  >
                    Voir les rendez-vous →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards - Ligne 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* RDV aujourd'hui */}
          <div className="stats-today bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">
                  RDV aujourd'hui
                </p>
                <p className="mt-2 text-4xl font-bold">
                  {stats.todayAppointments}
                </p>
                <Link
                  to="/appointments"
                  className="mt-3 text-sm text-indigo-100 hover:text-white inline-flex items-center"
                >
                  Voir le planning →
                </Link>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <CalendarDaysIcon className="h-10 w-10" />
              </div>
            </div>
          </div>

          {/* Total clients */}
          <div className="stats-clients bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Total clients
                </p>
                <p className="mt-2 text-4xl font-bold">{stats.totalClients}</p>
                <Link
                  to="/clients"
                  className="mt-3 text-sm text-green-100 hover:text-white inline-flex items-center"
                >
                  Gérer les clients →
                </Link>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <UserGroupIcon className="h-10 w-10" />
              </div>
            </div>
          </div>

          {/* Services actifs */}
          <div className="stats-services bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Services actifs
                </p>
                <p className="mt-2 text-4xl font-bold">{stats.totalServices}</p>
                <Link
                  to="/services"
                  className="mt-3 text-sm text-purple-100 hover:text-white inline-flex items-center"
                >
                  Gérer les services →
                </Link>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <ScissorsIcon className="h-10 w-10" />
              </div>
            </div>
          </div>

          {/* En attente */}
          <div className="stats-pending bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">
                  En attente
                </p>
                <p className="mt-2 text-4xl font-bold">
                  {stats.pendingAppointments}
                </p>
                <Link
                  to="/appointments?status=pending"
                  className="mt-3 text-sm text-yellow-100 hover:text-white inline-flex items-center"
                >
                  Valider les RDV →
                </Link>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <ClockIcon className="h-10 w-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Ligne 2: Revenus et performance */}
        <div className="revenue-section grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenu aujourd'hui */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">
                Revenu aujourd'hui
              </p>
              <CurrencyDollarIcon className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatPrice(stats.todayRevenue)}
            </p>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              Basé sur les RDV complétés
            </div>
          </div>

          {/* Revenu du mois */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">
                Revenu ce mois
              </p>
              <ChartBarIcon className="h-6 w-6 text-indigo-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatPrice(stats.monthRevenue)}
            </p>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              {stats.completedThisMonth} RDV complétés
            </div>
          </div>

          {/* RDV complétés ce mois */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">
                Complétés ce mois
              </p>
              <CheckCircleIcon className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.completedThisMonth}
            </p>
            <div className="mt-2 flex items-center text-sm text-blue-600">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              Rendez-vous terminés
            </div>
          </div>

          {/* RDV annulés ce mois */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">
                Annulés ce mois
              </p>
              <XCircleIcon className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.cancelledThisMonth}
            </p>
            <div className="mt-2 flex items-center text-sm text-red-600">
              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />À surveiller
            </div>
          </div>
        </div>

        {/* Grille 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche (2/3) - RDV du jour */}
          <div className="lg:col-span-2">
            <div className="today-appointments bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Rendez-vous d'aujourd'hui
                </h2>
                <Link
                  to="/appointments"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Voir tout
                </Link>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Aucun rendez-vous
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Aucun rendez-vous prévu pour aujourd'hui.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {todayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-700 font-medium text-lg">
                                {apt.client_first_name?.charAt(0)}
                                {apt.client_last_name?.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {apt.client_first_name} {apt.client_last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {apt.service_name}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">
                              {apt.start_time?.substring(0, 5)}
                            </span>
                            <span className="mx-1">-</span>
                            <span>{apt.end_time?.substring(0, 5)}</span>
                          </div>
                          <div>{getStatusBadge(apt.status)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite (1/3) */}
          <div className="space-y-8">
            {/* Services populaires */}
            <div className="popular-services bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Services populaires
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {popularServices.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucune donnée disponible
                  </p>
                ) : (
                  popularServices.map((service, index) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-700 font-semibold text-sm">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {service.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPrice(service.price)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {service.bookingCount}
                        </p>
                        <p className="text-xs text-gray-500">réservations</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Clients récents */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <UserGroupIcon className="h-5 w-5 mr-2 text-green-600" />
                  Clients récents
                </h2>
                <Link
                  to="/clients"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Voir tout
                </Link>
              </div>
              <div className="p-6 space-y-3">
                {recentClients.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucun client
                  </p>
                ) : (
                  recentClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-700 font-medium">
                            {client.first_name?.charAt(0)}
                            {client.last_name?.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
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
