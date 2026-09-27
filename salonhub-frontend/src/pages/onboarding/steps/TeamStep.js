/**
 * TeamStep - Étape 4 (facultative) : ajouter les membres de l'équipe
 *
 * Crée les comptes employés (POST /auth/staff) avec un mot de passe
 * provisoire généré, à transmettre à chaque employé. Les disponibilités
 * de chacun se règlent ensuite dans Paramètres > Personnel.
 */

import { useState, useEffect } from "react";
import api from "../../../services/api";
import {
  UserPlusIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import StepFooter from "./StepFooter";

const EMPTY_FORM = { first_name: "", last_name: "", email: "", phone: "" };
// Sans caractères ambigus (0/O, 1/l/I)
const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

const generatePassword = (length = 10) => {
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  return Array.from(values, (v) => PASSWORD_CHARS[v % PASSWORD_CHARS.length]).join("");
};

const TeamStep = ({ term, onNext, onSkip, onBack }) => {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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
    const password = generatePassword();
    setAdding(true);
    try {
      const res = await api.post("/auth/staff", {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: "staff",
        password,
      });
      setMembers((current) => [
        ...current,
        { id: res.data?.data?.id, ...form, temporaryPassword: password },
      ]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout");
    } finally {
      setAdding(false);
    }
  };

  const handleCopy = async (member) => {
    const text = `Connexion SalonHub\nEmail : ${member.email}\nMot de passe provisoire : ${member.temporaryPassword}\n${window.location.origin}/login`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(member.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      /* presse-papiers indisponible : le mot de passe reste affiché */
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
              {member.temporaryPassword && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                  <p className="text-xs text-amber-800">
                    Mot de passe provisoire :{" "}
                    <code className="font-semibold tracking-wide">{member.temporaryPassword}</code>
                    {" "}— à transmettre à {member.first_name}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(member)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:text-amber-900"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    {copiedId === member.id ? "Copié !" : "Copier les accès"}
                  </button>
                </div>
              )}
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
          Un mot de passe provisoire est généré pour chaque compte. Horaires, congés et
          prestations de chacun se règlent ensuite dans Paramètres › {term.staff}.
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
