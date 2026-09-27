/**
 * ClientPicker - Sélection d'un client avec recherche serveur
 * et création rapide d'un nouveau client sans quitter le formulaire.
 *
 * Props :
 *  - value            : client sélectionné ({ id, first_name, last_name, phone }) ou null
 *  - onChange(client) : appelé avec le client choisi ou créé (null pour effacer)
 *  - term             : terminologie du secteur (term.client…)
 */

import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const SEARCH_LIMIT = 8;
const EMPTY_FORM = { first_name: "", last_name: "", phone: "", email: "" };

const ClientPicker = ({ value, onChange, term = {}, inputId }) => {
  const clientLabel = (term.client || "Client").toLowerCase();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  // Recherche serveur (debounce 300 ms) tant qu'aucun client n'est sélectionné
  useEffect(() => {
    if (value || creating || !open) return undefined;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { limit: SEARCH_LIMIT };
        if (search.trim()) params.search = search.trim();
        const response = await api.get("/clients", { params });
        if (!active) return;
        setResults(response.data?.data || []);
        setTotal(response.data?.pagination?.total || 0);
      } catch (err) {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, value, creating, open]);

  // Fermer la liste au clic extérieur
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const select = (client) => {
    onChange(client);
    setOpen(false);
    setSearch("");
  };

  const startCreate = () => {
    // Pré-remplir avec la recherche : "Marie Dupont" ou un numéro de téléphone
    const query = search.trim();
    const isPhone = /^[0-9\s+().-]{6,}$/.test(query);
    const [first = "", ...rest] = isPhone ? [] : query.split(/\s+/);
    setForm({
      ...EMPTY_FORM,
      first_name: first,
      last_name: rest.join(" "),
      phone: isPhone ? query : "",
    });
    setError(null);
    setCreating(true);
    setOpen(false);
  };

  // Entrée ne doit pas soumettre le formulaire parent (création du RDV)
  const handleCreateKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0 && !loading) select(results[0]);
    } else if (e.key === "Escape" && open) {
      // Ferme la liste sans fermer la fenêtre qui contient le champ
      e.stopPropagation();
      setOpen(false);
    }
  };

  const handleCreate = async () => {
    setError(null);
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("Le prénom et le nom sont obligatoires");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
      };
      const response = await api.post("/clients", payload);
      select({ id: response.data?.data?.id, ...payload });
      setCreating(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  // Client sélectionné
  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 flex-shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {value.first_name} {value.last_name}
            </p>
            {(value.phone || value.email) && (
              <p className="text-xs text-slate-500 truncate">{value.phone || value.email}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          Changer
        </button>
      </div>
    );
  }

  // Création rapide
  if (creating) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Nouveau {clientLabel}</p>
          <button
            type="button"
            onClick={() => setCreating(false)}
            aria-label="Annuler la création"
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            placeholder="Prénom *"
            aria-label="Prénom"
            className="input-premium"
            onKeyDown={handleCreateKeyDown}
            autoFocus
          />
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            onKeyDown={handleCreateKeyDown}
            placeholder="Nom *"
            aria-label="Nom"
            className="input-premium"
          />
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            onKeyDown={handleCreateKeyDown}
            placeholder="Téléphone"
            aria-label="Téléphone"
            className="input-premium"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onKeyDown={handleCreateKeyDown}
            placeholder="Email"
            aria-label="Email"
            className="input-premium"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="btn-premium w-full"
        >
          {saving ? "Création..." : `Créer et sélectionner`}
        </button>
      </div>
    );
  }

  // Recherche
  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id={inputId}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleSearchKeyDown}
          placeholder={`Rechercher un ${clientLabel} (nom, téléphone, email)`}
          aria-label={`Rechercher un ${clientLabel}`}
          className="input-premium input-premium-icon"
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-soft-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-3 text-sm text-slate-500">Recherche...</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">
                Aucun {clientLabel} trouvé
              </p>
            ) : (
              results.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => select(client)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                >
                  <p className="text-sm font-medium text-slate-800">
                    {client.first_name} {client.last_name}
                  </p>
                  {(client.phone || client.email) && (
                    <p className="text-xs text-slate-500">{client.phone || client.email}</p>
                  )}
                </button>
              ))
            )}
            {!loading && total > results.length && (
              <p className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
                {total - results.length} autre(s) résultat(s) : précisez la recherche
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border-t border-slate-100"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau {clientLabel}
            {search.trim() ? ` « ${search.trim()} »` : ""}
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientPicker;
