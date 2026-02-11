/**
 * Composant Cloche de Notifications
 * Onglet Activité : Notifications temps réel des RDV (socket events stockés en localStorage)
 * Onglet Messages : Annonces et messages admin in-app
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  XMarkIcon,
  CalendarDaysIcon,
  BellIcon,
  CheckCircleIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  PencilSquareIcon,
  CheckIcon,
  XCircleIcon,
  TrashIcon,
  ArrowRightIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import { useSocket } from "../../contexts/SocketContext";

const NOTIF_STORAGE_KEY = "salonhub_notif_store";
const MAX_NOTIFICATIONS = 50;

// ---- Notification Store (localStorage) ----
const loadStore = () => {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStore = (notifs) => {
  localStorage.setItem(
    NOTIF_STORAGE_KEY,
    JSON.stringify(notifs.slice(0, MAX_NOTIFICATIONS))
  );
};

// ---- Config par type de notification ----
const NOTIF_CONFIG = {
  new_appointment: {
    icon: UserPlusIcon,
    iconBg: "bg-green-100 text-green-600",
    label: "Nouveau RDV",
  },
  appointment_modified: {
    icon: PencilSquareIcon,
    iconBg: "bg-blue-100 text-blue-600",
    label: "RDV modifié",
  },
  appointment_confirmed: {
    icon: CheckIcon,
    iconBg: "bg-green-100 text-green-600",
    label: "RDV confirmé",
  },
  appointment_cancelled: {
    icon: XCircleIcon,
    iconBg: "bg-red-100 text-red-600",
    label: "RDV annulé",
  },
  appointment_completed: {
    icon: CheckCircleIcon,
    iconBg: "bg-blue-100 text-blue-600",
    label: "RDV terminé",
  },
  appointment_deleted: {
    icon: TrashIcon,
    iconBg: "bg-red-100 text-red-500",
    label: "RDV supprimé",
  },
  appointment_updated: {
    icon: PencilSquareIcon,
    iconBg: "bg-yellow-100 text-yellow-600",
    label: "RDV mis à jour",
  },
};

const DEFAULT_CONFIG = {
  icon: CalendarDaysIcon,
  iconBg: "bg-gray-100 text-gray-600",
  label: "Notification",
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState("activity");
  const [animate, setAnimate] = useState(false);

  // Activity notifications store (localStorage)
  const [notifications, setNotifications] = useState(loadStore);
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  // Admin inbox state
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const [adminLoading, setAdminLoading] = useState(false);

  const socket = useSocket();

  // Computed counts
  const unreadActivityCount = notifications.filter((n) => !n.read).length;
  const totalUnread = unreadActivityCount + unreadAdminCount;

  // ---- Activity notification helpers ----
  const addNotification = useCallback((notif) => {
    const newNotif = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      read: false,
      createdAt: new Date().toISOString(),
      ...notif,
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveStore(updated);
      return updated;
    });
  }, []);

  const markActivityAsRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      saveStore(updated);
      return updated;
    });
  };

  const markAllActivityAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveStore(updated);
      return updated;
    });
  };

  const clearAllActivity = () => {
    setNotifications([]);
    saveStore([]);
  };

  // ---- Navigate to appointment ----
  const handleActivityClick = (notif) => {
    if (!notif.read) markActivityAsRead(notif.id);
    setShowNotifications(false);

    if (notif.appointmentDate) {
      // Navigate to appointments page with the date
      const dateStr =
        typeof notif.appointmentDate === "string"
          ? notif.appointmentDate.substring(0, 10)
          : new Date(notif.appointmentDate).toISOString().split("T")[0];
      navigate(`/appointments?date=${dateStr}`);
    } else {
      navigate("/appointments");
    }
  };

  // ---- ADMIN INBOX ----
  const fetchAdminUnreadCount = useCallback(async () => {
    try {
      const response = await api.get(
        "/notifications/admin-inbox/unread-count"
      );
      if (response.data.success) {
        setUnreadAdminCount(response.data.data.total || 0);
      }
    } catch (err) {
      // Silently fail
    }
  }, []);

  const fetchAdminInbox = useCallback(async () => {
    setAdminLoading(true);
    try {
      const response = await api.get("/notifications/admin-inbox");
      if (response.data.success) {
        setAdminNotifications(response.data.data || []);
      }
    } catch (err) {
      console.error("Erreur chargement admin inbox:", err);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const markAdminAsRead = async (item) => {
    try {
      const endpoint =
        item.type === "announcement"
          ? `/notifications/admin-inbox/announcements/${item.id}/read`
          : `/notifications/admin-inbox/messages/${item.id}/read`;
      await api.put(endpoint);
      setAdminNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id && n.type === item.type
            ? { ...n, is_read: true }
            : n
        )
      );
      setUnreadAdminCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Erreur marquer comme lu:", err);
    }
  };

  const markAllAdminAsRead = async () => {
    const unread = adminNotifications.filter((n) => !n.is_read);
    for (const item of unread) {
      try {
        const endpoint =
          item.type === "announcement"
            ? `/notifications/admin-inbox/announcements/${item.id}/read`
            : `/notifications/admin-inbox/messages/${item.id}/read`;
        await api.put(endpoint);
      } catch (err) {
        // continue
      }
    }
    setAdminNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );
    setUnreadAdminCount(0);
  };

  // ---- SOCKET LISTENERS ----
  useEffect(() => {
    if (!socket) return;

    const triggerAnimate = () => {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);
    };

    const handleNewAppointment = (data) => {
      triggerAnimate();
      const apt = data.appointment || {};
      const clientName =
        apt.client_first_name && apt.client_last_name
          ? `${apt.client_first_name} ${apt.client_last_name}`
          : "Un client";

      const dateStr = apt.appointment_date
        ? typeof apt.appointment_date === "string"
          ? apt.appointment_date.substring(0, 10)
          : new Date(apt.appointment_date).toISOString().split("T")[0]
        : null;

      const timeStr = apt.start_time ? apt.start_time.substring(0, 5) : "";

      const formattedDate = dateStr
        ? new Date(dateStr + "T12:00:00").toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })
        : "";

      addNotification({
        type: "new_appointment",
        title: data.message || `${clientName} a pris rendez-vous`,
        body: `${apt.service_name || "Service"}${formattedDate ? ` · ${formattedDate}` : ""}${timeStr ? ` à ${timeStr}` : ""}`,
        appointmentId: apt.id || null,
        appointmentDate: apt.appointment_date || null,
      });
    };

    const handleAppointmentUpdated = (data) => {
      triggerAnimate();
      const { action, appointmentId, status, message } = data;

      const typeMap = {
        updated: "appointment_modified",
        status_changed: `appointment_${status || "updated"}`,
        deleted: "appointment_deleted",
      };

      const titleMap = {
        updated: "Rendez-vous modifié",
        status_changed:
          status === "confirmed"
            ? "Rendez-vous confirmé"
            : status === "cancelled"
            ? "Rendez-vous annulé"
            : status === "completed"
            ? "Rendez-vous terminé"
            : "Rendez-vous mis à jour",
        deleted: "Rendez-vous supprimé",
      };

      addNotification({
        type: typeMap[action] || "appointment_updated",
        title: titleMap[action] || "Rendez-vous mis à jour",
        body: message || "Un rendez-vous a été modifié",
        appointmentId: appointmentId || null,
        appointmentDate: data.appointment_date || null,
      });
    };

    const handleAdminNotification = () => {
      triggerAnimate();
      setUnreadAdminCount((prev) => prev + 1);
      if (activeTab === "messages" && showNotifications) {
        fetchAdminInbox();
      }
    };

    socket.on("new_appointment", handleNewAppointment);
    socket.on("appointment_updated", handleAppointmentUpdated);
    socket.on("admin_notification", handleAdminNotification);

    return () => {
      socket.off("new_appointment", handleNewAppointment);
      socket.off("appointment_updated", handleAppointmentUpdated);
      socket.off("admin_notification", handleAdminNotification);
    };
  }, [socket, addNotification, fetchAdminInbox, activeTab, showNotifications]);

  // ---- INIT ----
  useEffect(() => {
    fetchAdminUnreadCount();
    const interval = setInterval(fetchAdminUnreadCount, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAdminUnreadCount]);

  // Fetch admin inbox when switching to messages tab
  useEffect(() => {
    if (activeTab === "messages" && showNotifications) {
      fetchAdminInbox();
    }
  }, [activeTab, showNotifications, fetchAdminInbox]);

  // ---- HELPERS ----
  const formatTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffH < 24) return `Il y a ${diffH}h`;
    if (diffD === 1) return "Hier";
    if (diffD < 7) return `Il y a ${diffD}j`;
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  // ---- RENDER ----
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
        {totalUnread > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold animate-pulse">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowNotifications(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-96 bg-white shadow-xl rounded-lg border border-gray-200 z-50 max-h-[480px] overflow-hidden flex flex-col animate-fade-in-down">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveTab("activity")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition relative ${
                  activeTab === "activity"
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center justify-center space-x-1.5">
                  <BellIcon className="h-4 w-4" />
                  <span>Activité</span>
                  {unreadActivityCount > 0 && (
                    <span className="ml-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {unreadActivityCount}
                    </span>
                  )}
                </div>
                {activeTab === "activity" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition relative ${
                  activeTab === "messages"
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center justify-center space-x-1.5">
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  <span>Messages</span>
                  {unreadAdminCount > 0 && (
                    <span className="ml-1 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {unreadAdminCount}
                    </span>
                  )}
                </div>
                {activeTab === "messages" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
                )}
              </button>
              <button
                onClick={() => setShowNotifications(false)}
                className="px-3 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto flex-1">
              {activeTab === "activity" ? (
                /* ---- ACTIVITY TAB ---- */
                <>
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      {unreadActivityCount > 0 ? (
                        <span className="text-xs text-indigo-600 font-medium">
                          {unreadActivityCount} non lu
                          {unreadActivityCount > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Tout lu
                        </span>
                      )}
                      <div className="flex items-center space-x-3">
                        {unreadActivityCount > 0 && (
                          <button
                            onClick={markAllActivityAsRead}
                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center font-medium"
                          >
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Tout lire
                          </button>
                        )}
                        <button
                          onClick={clearAllActivity}
                          className="text-xs text-gray-400 hover:text-red-500 font-medium"
                        >
                          Effacer
                        </button>
                      </div>
                    </div>
                  )}

                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        Aucune notification
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Les nouveaux RDV et modifications apparaîtront ici en
                        temps réel
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notif) => {
                        const cfg =
                          NOTIF_CONFIG[notif.type] || DEFAULT_CONFIG;
                        const IconComponent = cfg.icon;

                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleActivityClick(notif)}
                            className={`p-3.5 transition-colors cursor-pointer relative group
                              ${!notif.read ? "bg-indigo-50/60" : "hover:bg-gray-50"}
                            `}
                          >
                            {!notif.read && (
                              <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-indigo-600"></span>
                            )}
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div
                                  className={`h-9 w-9 rounded-full flex items-center justify-center ${cfg.iconBg}`}
                                >
                                  <IconComponent className="h-4.5 w-4.5" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <p
                                    className={`text-sm truncate ${
                                      !notif.read
                                        ? "font-semibold text-gray-900"
                                        : "font-medium text-gray-700"
                                    }`}
                                  >
                                    {notif.title}
                                  </p>
                                  <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                                    {formatTimeAgo(notif.createdAt)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                  {notif.body}
                                </p>
                              </div>
                              <ArrowRightIcon className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 flex-shrink-0 mt-1 transition-colors" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer link */}
                  {notifications.length > 0 && (
                    <div className="border-t border-gray-100 p-2">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate("/appointments");
                        }}
                        className="w-full py-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:bg-indigo-50 rounded transition"
                      >
                        Voir tous les rendez-vous →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* ---- MESSAGES TAB ---- */
                <>
                  {unreadAdminCount > 0 && (
                    <div className="px-4 py-2 bg-rose-50 flex items-center justify-between">
                      <span className="text-xs text-rose-600 font-medium">
                        {unreadAdminCount} non lu
                        {unreadAdminCount > 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={markAllAdminAsRead}
                        className="text-xs text-rose-600 hover:text-rose-800 flex items-center font-medium"
                      >
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Tout lire
                      </button>
                    </div>
                  )}
                  {adminLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-gray-500 text-sm">Chargement...</p>
                    </div>
                  ) : adminNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        Aucun message de l'administration
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {adminNotifications.map((item) => {
                        const isAnnouncement = item.type === "announcement";
                        return (
                          <div
                            key={`${item.type}-${item.id}`}
                            onClick={() =>
                              !item.is_read && markAdminAsRead(item)
                            }
                            className={`p-4 transition-colors cursor-pointer relative
                              ${!item.is_read ? (isAnnouncement ? "bg-rose-50" : "bg-indigo-50") : "hover:bg-gray-50"}
                            `}
                          >
                            {!item.is_read && (
                              <span
                                className={`absolute top-2 right-2 h-2 w-2 rounded-full ${
                                  isAnnouncement
                                    ? "bg-rose-500"
                                    : "bg-indigo-600"
                                }`}
                              ></span>
                            )}
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div
                                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                    isAnnouncement
                                      ? "bg-rose-100 text-rose-600"
                                      : "bg-indigo-100 text-indigo-600"
                                  }`}
                                >
                                  {isAnnouncement ? (
                                    <MegaphoneIcon className="h-5 w-5" />
                                  ) : (
                                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-0.5">
                                  <span
                                    className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                      isAnnouncement
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-indigo-100 text-indigo-700"
                                    }`}
                                  >
                                    {isAnnouncement ? "Annonce" : "Message"}
                                  </span>
                                  <span className="text-[11px] text-gray-400">
                                    {formatTimeAgo(item.created_at)}
                                  </span>
                                </div>
                                <p
                                  className={`text-sm truncate ${
                                    !item.is_read
                                      ? "font-semibold text-gray-900"
                                      : "font-medium text-gray-700"
                                  }`}
                                >
                                  {item.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {item.content
                                    ?.replace(/<[^>]+>/g, "")
                                    .substring(0, 120)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
