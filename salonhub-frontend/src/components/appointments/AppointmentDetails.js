/**
 * AppointmentDetails Component
 * Fenêtre de détail d'un rendez-vous : infos, personnel, déplacement,
 * changement de statut et messages au client.
 */

import { useState, useEffect, useRef } from "react";
import { useCurrency } from "../../contexts/CurrencyContext";
import api from "../../services/api";
import {
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ScissorsIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { usePermissions } from "../../contexts/PermissionContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  STATUS_LABELS,
  getDateKey,
  addMinutesToTime,
  hasStarted,
  toDateKey,
} from "../../utils/appointmentUtils";

import { useToast } from "../../hooks/useToast";
import Toast from "../common/Toast";
import ConfirmModal from "../common/ConfirmModal";
import Modal from "../common/Modal";
import ReceiptModal from "./ReceiptModal";
import StatusBadge from "./StatusBadge";
import { DocumentTextIcon, PhoneIcon } from "@heroicons/react/24/outline";

const AppointmentDetails = ({ appointment, onClose, onUpdate }) => {
  const { formatPrice } = useCurrency();
  const { toast, success, error, hideToast } = useToast();
  const { can, isStaff } = usePermissions();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(appointment.staff_id || "");
  const [isMultiStaff, setIsMultiStaff] = useState(false);
  // Déplacement (date / heure / employé)
  const [showReschedule, setShowReschedule] = useState(false);
  const [reschedule, setReschedule] = useState({
    date: getDateKey(appointment.appointment_date),
    time: appointment.start_time?.substring(0, 5) || "",
    staffId: appointment.staff_id ? String(appointment.staff_id) : "",
  });
  const canReschedule =
    ["pending", "confirmed"].includes(appointment.status) &&
    (!isStaff || appointment.staff_id === user?.id);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const response = await api.get("/auth/staff");
        if (response.data.success) {
          const activeStaff = response.data.data.filter(s => s.is_active);
          setStaffList(activeStaff);
          setIsMultiStaff(activeStaff.length > 1);
        }
      } catch (err) {
        console.error("Erreur chargement staff:", err);
      }
    };
    loadStaff();
  }, []);

  useEffect(() => {
    setSelectedStaffId(appointment.staff_id || "");
  }, [appointment.staff_id]);

  // Motif d'annulation (transmis au client) ; ref : lu au moment de la validation
  const [cancelReason, setCancelReason] = useState("");
  const cancelReasonRef = useRef("");

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    onConfirm: null,
  });

  if (!appointment) return null;

  const STATUS_CONFIRMATIONS = {
    confirmed: {
      title: "Confirmer ce rendez-vous ?",
      message: "Le client recevra la confirmation avec son lien pour gérer le rendez-vous.",
      confirmText: "Confirmer",
      type: "info",
    },
    cancelled: {
      title: "Annuler ce rendez-vous ?",
      message: "Le créneau sera libéré et le client prévenu de l'annulation.",
      confirmText: "Annuler le rendez-vous",
      cancelText: "Retour",
      type: "danger",
    },
    completed: {
      title: "Marquer comme terminé ?",
      message: "Le rendez-vous sera compté dans le chiffre d'affaires.",
      confirmText: "Terminé",
      type: "info",
    },
    no_show: {
      title: "Signaler l'absence du client ?",
      message: "Le rendez-vous sera marqué « Absent » dans l'historique du client.",
      confirmText: "Client absent",
      type: "warning",
    },
  };

  const initiateStatusChange = (newStatus) => {
    cancelReasonRef.current = "";
    setCancelReason("");
    const config = STATUS_CONFIRMATIONS[newStatus] || {
      title: "Changer le statut",
      message: `Passer ce rendez-vous au statut « ${STATUS_LABELS[newStatus] || newStatus} » ?`,
      type: "warning",
    };
    setConfirmConfig({
      isOpen: true,
      ...config,
      status: newStatus,
      onConfirm: () => processStatusChange(newStatus),
    });
  };

  const processStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      // Si on confirme, on s'assure que le staff_id est envoyé si on vient de le sélectionner
      const payload = { status: newStatus };
      if (newStatus === "confirmed" && selectedStaffId) {
        payload.staff_id = selectedStaffId;
      }
      if (newStatus === "cancelled" && cancelReasonRef.current.trim()) {
        payload.cancellation_reason = cancelReasonRef.current.trim();
      }

      const response = await api.patch(`/appointments/${appointment.id}/status`, payload);

      if (response.data.success) {
        success("Statut mis à jour avec succès !");
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        onUpdate();
        // On ferme la fenêtre principale seulement après succès
        setTimeout(onClose, 500);
      }
    } catch (err) {
      error(err.response?.data?.error || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStaff = async (staffId) => {
    setSelectedStaffId(staffId);
    setLoading(true);
    try {
      await api.put(`/appointments/${appointment.id}`, {
        staff_id: staffId || null
      });
      success("Personnel assigné avec succès !");
      onUpdate();
    } catch (err) {
      error(err.response?.data?.error || "Erreur lors de l'assignation");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!reschedule.date || !reschedule.time) {
      error("Indiquez la date et l'heure");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        appointment_date: reschedule.date,
        start_time: reschedule.time,
        end_time: addMinutesToTime(reschedule.time, appointment.service_duration || 30),
      };
      if (!isStaff) payload.staff_id = reschedule.staffId ? Number(reschedule.staffId) : null;
      await api.put(`/appointments/${appointment.id}`, payload);
      success("Rendez-vous déplacé");
      onUpdate();
      setTimeout(onClose, 500);
    } catch (err) {
      error(err.response?.data?.error || "Impossible de déplacer ce rendez-vous");
    } finally {
      setLoading(false);
    }
  };

  const initiateSendConfirmation = (sendVia) => {
    const labels = {
      email: "Email",
      whatsapp: "WhatsApp",
      both: "Email et WhatsApp",
    };

    setConfirmConfig({
      isOpen: true,
      title: "Envoyer une confirmation",
      message: `Voulez-vous envoyer la confirmation de rendez-vous par ${labels[sendVia]} ?`,
      type: "info",
      onConfirm: () => processSendConfirmation(sendVia),
    });
  };

  const processSendConfirmation = async (sendVia) => {
    setLoading(true);
    try {
      const response = await api.post(
        `/appointments/${appointment.id}/send-confirmation`,
        {
          send_via: sendVia,
        }
      );

      if (response.data.success) {
        const { emailSent, whatsappSent } = response.data.data;
        let message = "Confirmation envoyée ";
        if (emailSent && whatsappSent) message += "par Email et WhatsApp !";
        else if (emailSent) message += "par Email !";
        else if (whatsappSent) message += "par WhatsApp !";

        success(message);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      }
    } catch (err) {
      error(
        err.response?.data?.error || "Erreur lors de l'envoi de la confirmation"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) {
      error("Veuillez saisir un message");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/notifications/send", {
        client_id: appointment.client_id,
        type: "appointment_update",
        subject: `Mise à jour de votre rendez-vous`,
        message: notificationMessage,
        send_via:
          appointment.client_email && appointment.client_phone
            ? "both"
            : appointment.client_email
            ? "email"
            : "sms",
      });

      if (response.data.success) {
        success("Notification envoyée avec succès !");
        setShowNotificationModal(false);
        setNotificationMessage("");
      }
    } catch (err) {
      error(err.response?.data?.error || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    setLoading(true);
    try {
      const response = await api.post("/notifications/appointment-reminder", {
        appointment_id: appointment.id,
      });

      if (response.data.success) {
        success("Rappel envoyé avec succès !");
      }
    } catch (err) {
      error(err.response?.data?.error || "Erreur lors de l'envoi du rappel");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(`${getDateKey(date)}T00:00:00`).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isActive = ["pending", "confirmed"].includes(appointment.status);
  const clientName = `${appointment.client_first_name || ""} ${appointment.client_last_name || ""}`.trim();
  const staffName = appointment.staff_first_name
    ? `${appointment.staff_first_name} ${appointment.staff_last_name || ""}`.trim()
    : "Non assigné";
  const confirmBlockedReason = !can.canConfirmAppointments
    ? "Vous n'avez pas la permission de confirmer les rendez-vous"
    : isMultiStaff && !selectedStaffId
    ? "Assignez un membre du personnel avant de confirmer"
    : null;

  const sectionTitle = "text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3";
  const actionButton =
    "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500";
  const fieldClass =
    "w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500";

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}

      <Modal
        onClose={onClose}
        size="lg"
        title={clientName || "Rendez-vous"}
        description={`${formatDate(appointment.appointment_date)} · ${appointment.start_time?.substring(0, 5)} – ${appointment.end_time?.substring(0, 5)}`}
        icon={
          <span className="h-10 w-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-semibold" aria-hidden="true">
            {(appointment.client_first_name || "?").charAt(0).toUpperCase()}
          </span>
        }
        footer={
          <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">
            Fermer
          </button>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={appointment.status} size="md" />
            {appointment.client_phone && (
              <a
                href={`tel:${String(appointment.client_phone).replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                <PhoneIcon className="h-4 w-4" aria-hidden="true" />
                {appointment.client_phone}
              </a>
            )}
            {appointment.client_email && (
              <a
                href={`mailto:${appointment.client_email}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 max-w-full truncate"
              >
                <EnvelopeIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{appointment.client_email}</span>
              </a>
            )}
          </div>

          {/* Détails */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
            <div className="bg-white p-4">
              <dt className="flex items-center text-xs font-medium text-slate-500">
                <ScissorsIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Prestation
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">{appointment.service_name}</dd>
              <dd className="text-sm text-slate-500">{appointment.service_duration} min</dd>
            </div>
            <div className="bg-white p-4">
              <dt className="flex items-center text-xs font-medium text-slate-500">
                <CurrencyDollarIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Prix
              </dt>
              <dd className="mt-1 text-xl font-bold text-slate-900">{formatPrice(appointment.service_price)}</dd>
            </div>
            <div className="bg-white p-4">
              <dt className="flex items-center text-xs font-medium text-slate-500">
                <CalendarIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Date
              </dt>
              <dd className="mt-1 font-semibold text-slate-900 first-letter:uppercase">{formatDate(appointment.appointment_date)}</dd>
            </div>
            <div className="bg-white p-4">
              <dt className="flex items-center text-xs font-medium text-slate-500">
                <ClockIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Heure
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {appointment.start_time?.substring(0, 5)} – {appointment.end_time?.substring(0, 5)}
              </dd>
            </div>
            <div className={`p-4 sm:col-span-2 ${appointment.status === "pending" && isMultiStaff && !selectedStaffId ? "bg-amber-50" : "bg-white"}`}>
              <dt className="flex items-center justify-between gap-2 text-xs font-medium text-slate-500">
                <span className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  <label htmlFor="assign-staff" className={appointment.status === "pending" ? "" : "pointer-events-none"}>
                    Personnel assigné
                  </label>
                </span>
                {appointment.status === "pending" && isMultiStaff && !selectedStaffId && (
                  <span className="text-amber-700 font-semibold">À assigner pour confirmer</span>
                )}
              </dt>
              <dd className="mt-1">
                {appointment.status === "pending" ? (
                  <select
                    id="assign-staff"
                    value={selectedStaffId}
                    onChange={(e) => handleAssignStaff(e.target.value)}
                    disabled={loading}
                    className={fieldClass}
                  >
                    <option value="">-- Sélectionner un membre --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                        {s.role === "owner" ? " (Propriétaire)" : s.role === "admin" ? " (Responsable)" : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-semibold text-slate-900">{staffName}</span>
                )}
              </dd>
            </div>
          </dl>

          {/* Notes */}
          {appointment.notes && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-xs font-medium text-amber-800 mb-1">Notes</p>
              <p className="text-sm text-slate-800 whitespace-pre-line">{appointment.notes}</p>
            </div>
          )}

          {/* Statut */}
          {(appointment.status === "pending" || appointment.status === "confirmed" || appointment.status === "completed") && (
            <section aria-label="Statut du rendez-vous">
              <h3 className={sectionTitle}>Statut</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {appointment.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => initiateStatusChange("confirmed")}
                      disabled={loading || !!confirmBlockedReason}
                      aria-describedby={confirmBlockedReason ? "confirm-blocked-reason" : undefined}
                      className={`${actionButton} bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm`}
                    >
                      <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
                      Confirmer
                    </button>
                    <button
                      type="button"
                      onClick={() => initiateStatusChange("cancelled")}
                      disabled={loading}
                      className={`${actionButton} bg-white text-red-700 border border-red-200 hover:bg-red-50`}
                    >
                      <XCircleIcon className="h-5 w-5" aria-hidden="true" />
                      Annuler le rendez-vous
                    </button>
                    {confirmBlockedReason && (
                      <p id="confirm-blocked-reason" className="sm:col-span-2 text-xs text-amber-700">
                        {confirmBlockedReason}
                      </p>
                    )}
                  </>
                )}

                {appointment.status === "confirmed" && (
                  <>
                    <button
                      type="button"
                      onClick={() => initiateStatusChange("completed")}
                      disabled={loading}
                      className={`${actionButton} bg-violet-600 text-white hover:bg-violet-700 shadow-sm`}
                    >
                      <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
                      Marquer comme terminé
                    </button>
                    {hasStarted(appointment) ? (
                      <button
                        type="button"
                        onClick={() => initiateStatusChange("no_show")}
                        disabled={loading}
                        className={`${actionButton} bg-white text-slate-700 border border-slate-200 hover:bg-slate-50`}
                      >
                        <XCircleIcon className="h-5 w-5" aria-hidden="true" />
                        Client absent
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => initiateStatusChange("cancelled")}
                        disabled={loading}
                        className={`${actionButton} bg-white text-red-700 border border-red-200 hover:bg-red-50`}
                      >
                        <XCircleIcon className="h-5 w-5" aria-hidden="true" />
                        Annuler le rendez-vous
                      </button>
                    )}
                  </>
                )}

                {appointment.status === "completed" && (
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(true)}
                    className={`${actionButton} bg-violet-600 text-white hover:bg-violet-700 shadow-sm sm:col-span-2`}
                  >
                    <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
                    Voir le reçu
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Déplacer */}
          {canReschedule && (
            <section aria-label="Déplacer le rendez-vous" className="rounded-xl border border-slate-200 p-4">
              {!showReschedule ? (
                <button
                  type="button"
                  onClick={() => setShowReschedule(true)}
                  aria-expanded="false"
                  className="flex items-center text-sm font-medium text-violet-700 hover:text-violet-900 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                  Déplacer ce rendez-vous
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-900">Déplacer ce rendez-vous</p>
                  <div className={`grid grid-cols-1 ${isStaff ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-3`}>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="reschedule-date">Date</label>
                      <input
                        id="reschedule-date"
                        type="date"
                        value={reschedule.date}
                        min={toDateKey(new Date())}
                        onChange={(e) => setReschedule({ ...reschedule, date: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="reschedule-time">Heure</label>
                      <input
                        id="reschedule-time"
                        type="time"
                        step="300"
                        value={reschedule.time}
                        onChange={(e) => setReschedule({ ...reschedule, time: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    {!isStaff && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="reschedule-staff">Personnel</label>
                        <select
                          id="reschedule-staff"
                          value={reschedule.staffId}
                          onChange={(e) => setReschedule({ ...reschedule, staffId: e.target.value })}
                          className={fieldClass}
                        >
                          <option value="">Non assigné</option>
                          {staffList.map((s) => (
                            <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button type="button" onClick={() => setShowReschedule(false)} className="btn-ghost">
                      Annuler
                    </button>
                    <button type="button" onClick={handleReschedule} disabled={loading} className="btn-primary">
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Messages au client */}
          {isActive && (appointment.client_email || appointment.client_phone) && (
            <section aria-label="Messages au client">
              <h3 className={sectionTitle}>Prévenir le client</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {appointment.client_email && (
                  <button
                    type="button"
                    onClick={() => initiateSendConfirmation("email")}
                    disabled={loading}
                    className={`${actionButton} bg-white text-slate-700 border border-slate-200 hover:bg-slate-50`}
                  >
                    <EnvelopeIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                    Confirmation par email
                  </button>
                )}
                {appointment.client_phone && (
                  <button
                    type="button"
                    onClick={() => initiateSendConfirmation("whatsapp")}
                    disabled={loading}
                    className={`${actionButton} bg-white text-slate-700 border border-slate-200 hover:bg-slate-50`}
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                    Confirmation WhatsApp
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={loading}
                  className={`${actionButton} bg-white text-slate-700 border border-slate-200 hover:bg-slate-50`}
                >
                  <PaperAirplaneIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                  Envoyer un rappel
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotificationModal(true)}
                  className={`${actionButton} bg-white text-slate-700 border border-slate-200 hover:bg-slate-50`}
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                  Message personnalisé
                </button>
              </div>
            </section>
          )}
        </div>
      </Modal>

      {/* Confirmation d'action (au-dessus de la fenêtre de détail) */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        loading={loading}
      >
        {confirmConfig.status === "cancelled" && (
          <>
            <label htmlFor="cancel-reason" className="block text-sm font-medium text-slate-700 mb-1">
              Motif communiqué au client (facultatif)
            </label>
            <input
              id="cancel-reason"
              type="text"
              value={cancelReason}
              maxLength={255}
              onChange={(e) => {
                cancelReasonRef.current = e.target.value;
                setCancelReason(e.target.value);
              }}
              placeholder="Ex. fermeture exceptionnelle"
              className={fieldClass}
            />
          </>
        )}
      </ConfirmModal>

      {/* Message personnalisé */}
      <Modal
        open={showNotificationModal}
        onClose={() => {
          setShowNotificationModal(false);
          setNotificationMessage("");
        }}
        size="sm"
        title={`Contacter ${appointment.client_first_name}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowNotificationModal(false);
                setNotificationMessage("");
              }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSendNotification}
              disabled={loading || !notificationMessage.trim()}
              className="btn-primary"
            >
              <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
              {loading ? "Envoi..." : "Envoyer"}
            </button>
          </>
        }
      >
        <label htmlFor="client-message" className="block text-sm font-medium text-slate-700 mb-1">
          Message
        </label>
        <textarea
          id="client-message"
          value={notificationMessage}
          onChange={(e) => setNotificationMessage(e.target.value)}
          placeholder="Saisissez votre message..."
          rows="4"
          data-autofocus
          className={fieldClass}
        />
      </Modal>

      {showReceiptModal && (
        <ReceiptModal
          appointmentId={appointment.id}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </>
  );
};

export default AppointmentDetails;
