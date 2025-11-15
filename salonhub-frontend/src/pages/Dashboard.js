/**
 * Dashboard - Page d'accueil admin AMÉLIORÉE
 * Vue d'ensemble avec statistiques avancées, graphiques et insights
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Bienvenue, {user?.first_name} ! Voici un aperçu de votre activité.
            </p>
          </div>
          <div>
            <Link
              to={`/book/${tenant?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Voir la page publique
            </Link>
          </div>
        </div>

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
                    to="/app/appointments"
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
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">
                  RDV aujourd'hui
                </p>
                <p className="mt-2 text-4xl font-bold">
                  {stats.todayAppointments}
                </p>
                <Link
                  to="/app/appointments"
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
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Total clients
                </p>
                <p className="mt-2 text-4xl font-bold">{stats.totalClients}</p>
                <Link
                  to="/app/clients"
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
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Services actifs
                </p>
                <p className="mt-2 text-4xl font-bold">{stats.totalServices}</p>
                <Link
                  to="/app/services"
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
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">
                  En attente
                </p>
                <p className="mt-2 text-4xl font-bold">
                  {stats.pendingAppointments}
                </p>
                <Link
                  to="/app/appointments?status=pending"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Rendez-vous d'aujourd'hui
                </h2>
                <Link
                  to="/app/appointments"
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
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
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
                  to="/app/clients"
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
