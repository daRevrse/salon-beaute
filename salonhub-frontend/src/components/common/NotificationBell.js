/**
 * Composant Cloche de Notifications
 * Affiche les notifications de rendez-vous du jour
 */

import { useState, useEffect } from "react";
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
  const socket = useSocket();

  // Charger les notifications au montage et toutes les 5 minutes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Écouter les nouveaux rendez-vous en temps réel via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleNewAppointment = (data) => {
      console.log("🔔 Nouveau RDV reçu via WebSocket:", data);
      // Recharger les notifications
      fetchNotifications();
    };

    socket.on("new_appointment", handleNewAppointment);

    return () => {
      socket.off("new_appointment", handleNewAppointment);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      // Récupérer les rendez-vous du jour
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get(`/appointments?date=${today}`);

      if (response.data.success) {
        const todayAppointments = response.data.data || [];

        // Filtrer les rendez-vous à venir (pending et confirmed)
        const upcoming = todayAppointments.filter(
          (apt) =>
            (apt.status === "pending" || apt.status === "confirmed") &&
            new Date(`${apt.appointment_date} ${apt.start_time}`) > new Date()
        );

        setNotifications(upcoming);
        setUnreadCount(upcoming.length);
      }
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.substring(0, 5);
  };

  return (
    <div className="relative">
      {/* Bouton cloche */}
      <button
        type="button"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown notifications */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowNotifications(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">
                Rendez-vous du jour
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Liste */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    Aucun rendez-vous à venir aujourd'hui
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <CalendarDaysIcon className="h-5 w-5 text-indigo-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {apt.client_first_name} {apt.client_last_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {apt.service_name}
                          </p>
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatTime(apt.start_time)} -{" "}
                            {formatTime(apt.end_time)}
                          </div>
                        </div>
                        <div>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              apt.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {apt.status === "confirmed"
                              ? "Confirmé"
                              : "En attente"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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
