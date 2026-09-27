/**
 * InvitationLinkPanel - Lien d'activation d'un employé à partager
 *
 * Le lien est aussi envoyé par email ; ce panneau permet de le copier ou de
 * l'envoyer par WhatsApp (utile si l'email n'arrive pas).
 *
 * Props :
 *  - token      : jeton d'invitation renvoyé par l'API
 *  - firstName  : prénom de l'employé
 *  - salonName  : nom de l'établissement (message WhatsApp)
 */

import { useState } from "react";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

export const getInvitationUrl = (token) => `${window.location.origin}/invitation/${token}`;

const InvitationLinkPanel = ({ token, firstName, salonName }) => {
  const [copied, setCopied] = useState(false);
  const url = getInvitationUrl(token);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      /* presse-papiers indisponible : le lien reste sélectionnable */
    }
  };

  const whatsappText = `Bonjour ${firstName}, voici ton lien pour activer ton compte ${salonName || "SalonHub"} et choisir ton mot de passe : ${url}`;

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4 space-y-3">
      <p className="text-sm text-slate-700">
        Un email d'invitation a été envoyé à {firstName}. Vous pouvez aussi lui transmettre ce lien
        (valable 7 jours) : {firstName} y choisira son mot de passe.
      </p>
      <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
        <input
          type="text"
          readOnly
          value={url}
          aria-label="Lien d'invitation"
          onFocus={(e) => e.target.select()}
          className="flex-1 min-w-0 px-3 py-2 text-xs sm:text-sm text-slate-600 border-0 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 text-sm font-medium text-slate-600 border-l border-slate-200 hover:bg-slate-50"
        >
          {copied ? <CheckIcon className="h-4 w-4 text-emerald-600" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        Envoyer par WhatsApp →
      </a>
    </div>
  );
};

export default InvitationLinkPanel;
