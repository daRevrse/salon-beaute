/**
 * TeamStep - Étape 4 (facultative) : ajouter les membres de l'équipe
 *
 * Crée les comptes employés (POST /auth/staff) sans mot de passe : chaque
 * employé reçoit un lien d'invitation (email, copie, WhatsApp) pour choisir
 * le sien. Les disponibilités se règlent ensuite dans Paramètres > Personnel.
 */

import { useState, useEffect } from "react";
import api from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { UserPlusIcon, CheckIcon } from "@heroicons/react/24/outline";
import InvitationLinkPanel from "../../../components/staff/InvitationLinkPanel";
import StepFooter from "./StepFooter";

const EMPTY_FORM = { first_name: "", last_name: "", email: "", phone: "" };

const TeamStep = ({ term, onNext, onSkip, onBack }) => {
  const { tenant } = useAuth();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  // Membres déjà créés (hors propriétaire)
  useEffect(() => {
    api
      .get("/auth/staff")
      .then((res) =>
        setMembers((res.data?.data || []).filter((m) => m.role !== "owner").map((m) => ({ ...m })))
      )
      .catch(() => setMembers([]));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async () => {
    setError(null);
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      setError("Le prénom, le nom et l'email sont obligatoires");
      return;
    }
    setAdding(true);
    try {
      const res = await api.post("/auth/staff", {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: "staff",
      });
      setMembers((current) => [
        ...current,
        { id: res.data?.data?.id, ...form, invitationToken: res.data?.data?.invitation_token },
      ]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h2 className="font-display text-xl text-slate-800 mb-1">Votre équipe</h2>
        <p className="text-sm text-slate-500">
          Ajoutez vos {term.staffMember.toLowerCase()}s : vos {term.clients.toLowerCase()} pourront
          les choisir en réservant, et chacun verra son propre planning. Vous travaillez
          seul(e) ? Passez cette étape.
        </p>
      </div>

      {members.length > 0 && (
        <ul className="mb-5 space-y-2">
          {members.map((member) => (
            <li key={member.id || member.email} className="px-4 py-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{member.email}</p>
                </div>
                <CheckIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              </div>
              {member.invitationToken ? (
                <div className="mt-3">
                  <InvitationLinkPanel
                    token={member.invitationToken}
                    firstName={member.first_name}
                    salonName={tenant?.name}
                  />
                </div>
              ) : Number(member.invitation_pending) === 1 ? (
                <p className="mt-1 text-xs text-amber-700">Invitation envoyée, en attente d'activation</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="alert-error-premium mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-premium" htmlFor="team-first-name">Prénom</label>
            <input id="team-first-name" name="first_name" value={form.first_name} onChange={handleChange} className="input-premium" placeholder="Anna" />
          </div>
          <div>
            <label className="label-premium" htmlFor="team-last-name">Nom</label>
            <input id="team-last-name" name="last_name" value={form.last_name} onChange={handleChange} className="input-premium" placeholder="Koffi" />
          </div>
          <div>
            <label className="label-premium" htmlFor="team-email">Email</label>
            <input id="team-email" type="email" name="email" value={form.email} onChange={handleChange} className="input-premium" placeholder="anna@exemple.com" />
          </div>
          <div>
            <label className="label-premium" htmlFor="team-phone">Téléphone (optionnel)</label>
            <input id="team-phone" type="tel" name="phone" value={form.phone} onChange={handleChange} className="input-premium" />
          </div>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="btn-premium-secondary w-full sm:w-auto inline-flex items-center justify-center"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          {adding ? "Ajout..." : `Ajouter ce ${term.staffMember.toLowerCase()}`}
        </button>
        <p className="text-xs text-slate-500">
          Chaque {term.staffMember.toLowerCase()} reçoit un lien pour choisir son mot de passe.
          Horaires, congés et prestations de chacun se règlent ensuite dans Paramètres › {term.staff}.
        </p>
      </div>

      <StepFooter
        onBack={onBack}
        onSkip={onSkip}
        onContinue={onNext}
        continueLabel={members.length > 0 ? "Continuer" : "Je travaille seul(e)"}
      />
    </div>
  );
};

export default TeamStep;
