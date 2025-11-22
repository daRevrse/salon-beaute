/**
 * Composant Cloche de Notifications
 * Affiche TOUS les rendez-vous du jour (passés et futurs)
 */

import { useState, useEffect, useCallback } from "react";
import {
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import { useSocket } from "../../contexts/SocketContext";

const NotificationBell = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [animate, setAnimate] = useState(false);

  const socket = useSocket();

  // Helper pour obtenir la date locale YYYY-MM-DD
  const getLocalDateString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - offset);
    return localDate.toISOString().split("T")[0];
  };

  const fetchNotifications = useCallback(async () => {
    try {
      // const today = getLocalDateString();
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000; // Décalage en millisecondes
      const localDate = new Date(now.getTime() - offset);
      const today = localDate.toISOString().split("T")[0]; // "YYYY-MM-DD" local

      console.log("📅 Date demandée à l'API:", today); // Pour vérifier dans la console
      // On demande au backend les RDV de la date locale "aujourd'hui"
      const response = await api.get(`/appointments?date=${today}`);

      console.log("response", response);

      if (response.data.success) {
        const todayAppointments = response.data.data || [];
        processAppointments(todayAppointments);
      }
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
    }
  }, []);

  const processAppointments = (appointmentsList) => {
    const todayStr = getLocalDateString();

    // Filtrage assoupli : On garde tous les RDV du jour (pending/confirmed)
    const daysAppointments = appointmentsList.filter((apt) => {
      // 1. Statut valide
      if (apt.status !== "pending" && apt.status !== "confirmed") return false;

      // 2. Vérification de la date (sécurité)
      const aptDateStr =
        typeof apt.appointment_date === "string"
          ? apt.appointment_date.substring(0, 10)
          : new Date(apt.appointment_date).toISOString().split("T")[0];

      // On s'assure que c'est bien la date d'aujourd'hui
      return aptDateStr === todayStr;
    });

    // Trier par heure (du matin au soir)
    daysAppointments.sort((a, b) => a.start_time.localeCompare(b.start_time));

    setNotifications(daysAppointments);
    // Le badge rouge indique le nombre total de RDV du jour
    setUnreadCount(daysAppointments.length);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Écoute Temps Réel
  useEffect(() => {
    if (!socket) return;

    const handleNewData = (data) => {
      console.log("🔔 WS Event:", data);
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);

      // On recharge tout pour être sûr d'avoir l'état exact
      fetchNotifications();
    };

    socket.on("new_appointment", handleNewData);
    socket.on("appointment_updated", handleNewData); // Écouter aussi les mises à jour

    return () => {
      socket.off("new_appointment", handleNewData);
      socket.off("appointment_updated", handleNewData);
    };
  }, [socket, fetchNotifications]);

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.substring(0, 5);
  };

  // Helper pour savoir si le RDV est passé (pour le style visuel uniquement)
  const isPast = (timeStr) => {
    const now = new Date();
    const [hours, minutes] = timeStr.split(":");
    const aptTime = new Date();
    aptTime.setHours(hours, minutes, 0);
    return aptTime < now;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition"
      >
        <BellIcon
          className={`h-6 w-6 ${
            animate ? "animate-swing text-indigo-600" : ""
          }`}
        />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowNotifications(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col animate-fade-in-down">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">
                Planning du jour
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    Aucun rendez-vous aujourd'hui
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((apt) => {
                    const passed = isPast(apt.start_time);
                    return (
                      <div
                        key={apt.id}
                        className={`p-4 transition-colors cursor-pointer border-l-4 
                          ${
                            passed
                              ? "bg-gray-50 border-gray-300 opacity-75"
                              : "hover:bg-gray-50 border-transparent hover:border-indigo-500"
                          }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                apt.status === "confirmed"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-yellow-100 text-yellow-600"
                              }`}
                            >
                              <CalendarDaysIcon className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                passed ? "text-gray-500" : "text-gray-900"
                              }`}
                            >
                              {apt.client_first_name} {apt.client_last_name}
                            </p>
                            <p className="text-xs text-gray-500 mb-1">
                              {apt.service_name}
                            </p>
                            <div
                              className={`flex items-center text-xs font-semibold ${
                                passed ? "text-gray-400" : "text-indigo-600"
                              }`}
                            >
                              <ClockIcon className="h-3.5 w-3.5 mr-1" />
                              {formatTime(apt.start_time)}
                              <span className="mx-1 text-gray-300">|</span>
                              <span
                                className={
                                  apt.status === "confirmed"
                                    ? passed
                                      ? "text-green-800"
                                      : "text-green-600"
                                    : passed
                                    ? "text-yellow-800"
                                    : "text-yellow-600"
                                }
                              >
                                {apt.status === "confirmed"
                                  ? "Confirmé"
                                  : "En attente"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
