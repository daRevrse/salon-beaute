/**
 * AppointmentDetails Component
 * Modal pour afficher et gérer les détails d'un rendez-vous
 * CORRECTION : Ordre d'affichage des modales (Z-Index)
 */

import { useState } from "react";
import { useCurrency } from "../../contexts/CurrencyContext";
import api from "../../services/api";
import {
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ScissorsIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

import { useToast } from "../../hooks/useToast";
import Toast from "../common/Toast";
import ConfirmModal from "../common/ConfirmModal";

const AppointmentDetails = ({ appointment, onClose, onUpdate }) => {
  const { formatPrice } = useCurrency();
  const { toast, success, error, hideToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    onConfirm: null,
  });

  if (!appointment) return null;

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
        className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  // --- ACTIONS ---

  const initiateStatusChange = (newStatus) => {
    setConfirmConfig({
      isOpen: true,
      title: "Changer le statut",
      message: `Êtes-vous sûr de vouloir passer le statut à "${newStatus}" ?`,
      type: newStatus === "cancelled" ? "danger" : "warning",
      onConfirm: () => processStatusChange(newStatus),
    });
  };

  const processStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      const response = await api.put(`/appointments/${appointment.id}`, {
        status: newStatus,
      });

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
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Toast Container (Toujours visible) */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}

      {/* Overlay Principal - DÉTAILS DU RDV */}
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-0 border w-full max-w-3xl shadow-2xl rounded-xl bg-white mb-10 animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Détails du rendez-vous</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-2">{getStatusBadge(appointment.status)}</div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Client Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-indigo-600" />
                Informations client
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nom complet</p>
                  <p className="text-base font-medium text-gray-900">
                    {appointment.client_first_name}{" "}
                    {appointment.client_last_name}
                  </p>
                </div>
                {appointment.client_email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-base font-medium text-gray-900 flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {appointment.client_email}
                    </p>
                  </div>
                )}
                {appointment.client_phone && (
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="text-base font-medium text-gray-900">
                      {appointment.client_phone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CalendarIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  <p className="text-sm font-medium text-gray-600">Date</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(appointment.appointment_date)}
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <ClockIcon className="h-5 w-5 text-purple-600 mr-2" />
                  <p className="text-sm font-medium text-gray-600">Heure</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {appointment.start_time?.substring(0, 5)} -{" "}
                  {appointment.end_time?.substring(0, 5)}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <ScissorsIcon className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm font-medium text-gray-600">Service</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {appointment.service_name}
                </p>
                <p className="text-sm text-gray-500">
                  {appointment.service_duration} min
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm font-medium text-gray-600">Prix</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(appointment.service_price)}
                </p>
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
                <p className="text-gray-900">{appointment.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actions rapides
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Boutons de statut */}
                {appointment.status === "pending" && (
                  <>
                    <button
                      onClick={() => initiateStatusChange("confirmed")}
                      disabled={loading}
                      className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Confirmer
                    </button>
                    <button
                      onClick={() => initiateStatusChange("cancelled")}
                      disabled={loading}
                      className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
                    >
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      Annuler
                    </button>
                  </>
                )}

                {appointment.status === "confirmed" && (
                  <button
                    onClick={() => initiateStatusChange("completed")}
                    disabled={loading}
                    className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Marquer comme terminé
                  </button>
                )}

                {/* Confirmation Email */}
                {(appointment.status === "pending" ||
                  appointment.status === "confirmed") &&
                  appointment.client_email && (
                    <button
                      onClick={() => initiateSendConfirmation("email")}
                      disabled={loading}
                      className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 font-medium transition-colors"
                    >
                      <EnvelopeIcon className="h-5 w-5 mr-2" />
                      Confirmation Email
                    </button>
                  )}

                {/* Confirmation WhatsApp */}
                {(appointment.status === "pending" ||
                  appointment.status === "confirmed") &&
                  appointment.client_phone && (
                    <button
                      onClick={() => initiateSendConfirmation("whatsapp")}
                      disabled={loading}
                      className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 font-medium transition-colors"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                      Confirmation WhatsApp
                    </button>
                  )}

                {/* Rappel */}
                {(appointment.status === "pending" ||
                  appointment.status === "confirmed") &&
                  (appointment.client_email || appointment.client_phone) && (
                    <button
                      onClick={handleSendReminder}
                      disabled={loading}
                      className="flex items-center justify-center px-4 py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 font-medium transition-colors"
                    >
                      <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                      Envoyer un rappel
                    </button>
                  )}

                {/* Contact */}
                {(appointment.client_email || appointment.client_phone) && (
                  <button
                    onClick={() => setShowNotificationModal(true)}
                    className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 font-medium col-span-1 md:col-span-2 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    Contacter le client
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* MODALE DE CONFIRMATION - PLACÉE APRÈS LA MODALE PRINCIPALE POUR APPARAÎTRE AU-DESSUS */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        loading={loading}
      />

      {/* MODALE DE NOTIFICATION - PLACÉE À LA FIN EGALEMENT */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 animate-scale-in relative z-[70]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contacter {appointment.client_first_name}
            </h3>
            <textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="Saisissez votre message..."
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNotificationModal(false);
                  setNotificationMessage("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSendNotification}
                disabled={loading || !notificationMessage.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center"
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                {loading ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppointmentDetails;
