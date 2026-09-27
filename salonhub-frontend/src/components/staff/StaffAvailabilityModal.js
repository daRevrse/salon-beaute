/**
 * StaffAvailabilityModal - Disponibilités d'un membre de l'équipe
 *
 * Utilisées pour calculer les créneaux de réservation en ligne par employé :
 *  - prend des rendez-vous ou non
 *  - prestations réalisées (toutes par défaut)
 *  - horaires (ceux du salon par défaut)
 *  - congés / absences
 *
 * Props :
 *  - member      : membre de l'équipe (GET /auth/staff)
 *  - salonHours  : horaires du salon (valeur par défaut des horaires personnalisés)
 *  - config      : configuration secteur (couleurs, terminologie)
 *  - onClose()   : fermeture
 *  - onSaved()   : appelé après enregistrement (pour recharger la liste)
 */

import { useState, useEffect } from "react";
import api from "../../services/api";
import Modal from "../common/Modal";
import { useServices } from "../../hooks/useServices";
import BusinessHoursEditor, {
  normalizeBusinessHours,
} from "../common/BusinessHoursEditor";
import { TrashIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

const formatDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const StaffAvailabilityModal = ({ member, salonHours, config, onClose, onSaved }) => {
  const term = config.terminology;
  const { services } = useServices();
  const activeServices = services.filter((service) => service.is_active);

  const [isBookable, setIsBookable] = useState(member.is_bookable !== 0 && member.is_bookable !== false);
  const [customHours, setCustomHours] = useState(!!member.working_hours);
  const [hours, setHours] = useState(
    normalizeBusinessHours(member.working_hours || salonHours)
  );
  const [allServices, setAllServices] = useState(!member.service_ids);
  const [serviceIds, setServiceIds] = useState(member.service_ids || []);
  const [timeOff, setTimeOff] = useState([]);
  const [newTimeOff, setNewTimeOff] = useState({ start_date: "", end_date: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    api
      .get(`/auth/staff/${member.id}/time-off`)
      .then((res) => setTimeOff(res.data?.data || []))
      .catch(() => setTimeOff([]));
  }, [member.id]);

  const toggleService = (id) =>
    setServiceIds((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    );

  const handleSave = async () => {
    setError(null);
    if (!allServices && serviceIds.length === 0) {
      setError("Sélectionnez au moins un élément du catalogue ou cochez « Tout le catalogue ».");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/auth/staff/${member.id}/availability`, {
        is_bookable: isBookable,
        working_hours: customHours ? hours : null,
        service_ids: allServices ? null : serviceIds,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTimeOff = async () => {
    setError(null);
    setNotice(null);
    if (!newTimeOff.start_date) {
      setError("Indiquez la date de début du congé");
      return;
    }
    try {
      const res = await api.post(`/auth/staff/${member.id}/time-off`, {
        ...newTimeOff,
        end_date: newTimeOff.end_date || newTimeOff.start_date,
      });
      setTimeOff((current) =>
        [...current, res.data.data].sort((a, b) => a.start_date.localeCompare(b.start_date))
      );
      setNewTimeOff({ start_date: "", end_date: "", reason: "" });
      if (res.data.conflicting_appointments > 0) {
        setNotice(
          `Attention : ${res.data.conflicting_appointments} ${term.appointments.toLowerCase()} déjà prévu(s) pendant ce congé. Pensez à les réassigner.`
        );
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout du congé");
    }
  };

  const handleDeleteTimeOff = async (id) => {
    try {
      await api.delete(`/auth/staff/${member.id}/time-off/${id}`);
      setTimeOff((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la suppression du congé");
    }
  };

  return (
    <Modal
      onClose={onClose}
      size="lg"
      title={`Disponibilités de ${member.first_name} ${member.last_name}`}
      description="Utilisées pour proposer les créneaux de réservation en ligne"
      bodyClassName=""
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Annuler
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </>
      }
    >
        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">{error}</div>
          )}
          {notice && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">{notice}</div>
          )}

          {/* Prise de RDV */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isBookable}
              onChange={(e) => setIsBookable(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Prend des {term.appointments.toLowerCase()}
              </span>
              <span className="block text-sm text-slate-500">
                Décochez pour un profil de gestion uniquement : il ne sera pas proposé aux {term.clients.toLowerCase()}.
              </span>
            </span>
          </label>

          {isBookable && (
            <>
              {/* Prestations */}
              <section>
                <h4 className="text-sm font-semibold text-slate-800 mb-3">
                  {term.services}
                </h4>
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allServices}
                    onChange={(e) => setAllServices(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-700">Tout le catalogue</span>
                </label>
                {!allServices && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeServices.length === 0 && (
                      <p className="text-sm text-slate-500">{term.noServices}.</p>
                    )}
                    {activeServices.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={serviceIds.includes(service.id)}
                          onChange={() => toggleService(service.id)}
                          className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-sm text-slate-700">{service.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </section>

              {/* Horaires */}
              <section>
                <h4 className="text-sm font-semibold text-slate-800 mb-3">Horaires</h4>
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!customHours}
                    onChange={(e) => setCustomHours(!e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-700">
                    Identiques aux horaires d'ouverture
                  </span>
                </label>
                {customHours && (
                  <BusinessHoursEditor
                    value={hours}
                    onChange={setHours}
                    showSlotDuration={false}
                    config={config}
                    title={`Horaires de ${member.first_name}`}
                  />
                )}
              </section>

              {/* Congés */}
              <section>
                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 mr-2 text-slate-500" />
                  Congés et absences
                </h4>
                {timeOff.length === 0 ? (
                  <p className="text-sm text-slate-500 mb-3">Aucun congé à venir.</p>
                ) : (
                  <ul className="space-y-2 mb-4">
                    {timeOff.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <span className="text-sm text-slate-700">
                          {item.start_date === item.end_date
                            ? formatDate(item.start_date)
                            : `Du ${formatDate(item.start_date)} au ${formatDate(item.end_date)}`}
                          {item.reason ? ` · ${item.reason}` : ""}
                        </span>
                        <button
                          onClick={() => handleDeleteTimeOff(item.id)}
                          aria-label="Supprimer ce congé"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                  <div>
                    <label htmlFor="timeoff-start" className="block text-xs font-medium text-slate-500 mb-1">Du</label>
                    <input
                      type="date"
                      id="timeoff-start"
                      value={newTimeOff.start_date}
                      onChange={(e) => setNewTimeOff({ ...newTimeOff, start_date: e.target.value })}
                      className="input-premium py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="timeoff-end" className="block text-xs font-medium text-slate-500 mb-1">Au (inclus)</label>
                    <input
                      type="date"
                      id="timeoff-end"
                      value={newTimeOff.end_date}
                      min={newTimeOff.start_date || undefined}
                      onChange={(e) => setNewTimeOff({ ...newTimeOff, end_date: e.target.value })}
                      className="input-premium py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="timeoff-reason" className="block text-xs font-medium text-slate-500 mb-1">Motif</label>
                    <input
                      type="text"
                      id="timeoff-reason"
                      value={newTimeOff.reason}
                      onChange={(e) => setNewTimeOff({ ...newTimeOff, reason: e.target.value })}
                      placeholder="Optionnel"
                      className="input-premium py-2"
                    />
                  </div>
                  <button type="button" onClick={handleAddTimeOff} className="btn-premium-secondary py-2">
                    Ajouter
                  </button>
                </div>
              </section>
            </>
          )}
        </div>

    </Modal>
  );
};

export default StaffAvailabilityModal;
