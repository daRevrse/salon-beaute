/**
 * ServicesStep - Étape 3 : ajouter les premières prestations
 * Réutilise le hook useServices (POST /services). Propose des modèles rapides
 * (beauté) pour pré-remplir le formulaire.
 */

import { useState } from "react";
import { useServices } from "../../../hooks/useServices";
import { useCurrency } from "../../../contexts/CurrencyContext";
import {
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import StepFooter from "./StepFooter";

// Modèles rapides pour le secteur beauté
const BEAUTY_TEMPLATES = [
  { name: "Coupe femme", duration: 45, category: "Coiffure" },
  { name: "Coupe homme", duration: 30, category: "Coiffure" },
  { name: "Coloration", duration: 90, category: "Coloration" },
  { name: "Brushing", duration: 30, category: "Coiffure" },
  { name: "Manucure", duration: 45, category: "Onglerie" },
  { name: "Soin du visage", duration: 60, category: "Soins" },
];

const ServicesStep = ({ config, term, onNext, onSkip, onBack }) => {
  const { services, createService } = useServices();
  const { formatPrice } = useCurrency();

  const [form, setForm] = useState({
    name: "",
    duration: 30,
    price: "",
    category: "",
  });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const applyTemplate = (tpl) =>
    setForm((prev) => ({
      ...prev,
      name: tpl.name,
      duration: tpl.duration,
      category: tpl.category,
    }));

  const handleAdd = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError("Donnez un nom à la prestation");
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      setError("Indiquez un tarif");
      return;
    }
    setAdding(true);
    const result = await createService({
      name: form.name.trim(),
      duration: parseInt(form.duration, 10) || 30,
      price: parseFloat(form.price),
      category: form.category?.trim() || null,
    });
    setAdding(false);
    if (result.success) {
      setForm({ name: "", duration: 30, price: "", category: "" });
    } else {
      setError(result.error || "Erreur lors de l'ajout");
    }
  };

  const isBeauty = config.id === "beauty";

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h2 className="font-display text-xl text-slate-800 mb-1">
          Vos {term.services.toLowerCase()}
        </h2>
        <p className="text-sm text-slate-500">
          Ajoutez au moins une prestation pour que vos clients puissent réserver.
        </p>
      </div>

      {/* Modèles rapides (beauté) */}
      {isBeauty && (
        <div className="mb-5">
          <p className="text-xs font-medium text-slate-500 mb-2">
            Modèles rapides
          </p>
          <div className="flex flex-wrap gap-2">
            {BEAUTY_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-colors"
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="alert-error-premium mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Formulaire d'ajout */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label-premium">Nom de la prestation</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-premium"
              placeholder="Coupe femme"
            />
          </div>
          <div>
            <label className="label-premium">Durée (min)</label>
            <input
              type="number"
              name="duration"
              min="5"
              step="5"
              value={form.duration}
              onChange={handleChange}
              className="input-premium"
              placeholder="30"
            />
          </div>
          <div>
            <label className="label-premium">Tarif</label>
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              className="input-premium"
              placeholder="35"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label-premium">Catégorie (optionnel)</label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="input-premium"
              placeholder="Coiffure"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-xl bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors disabled:opacity-50"
        >
          <PlusIcon className="h-5 w-5 mr-1.5" />
          {adding ? "Ajout..." : "Ajouter cette prestation"}
        </button>
      </div>

      {/* Liste des prestations ajoutées */}
      {services.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-medium text-emerald-700 flex items-center mb-3">
            <CheckCircleIcon className="h-5 w-5 mr-1.5" />
            {services.length} prestation{services.length > 1 ? "s" : ""} ajoutée
            {services.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  {s.category && (
                    <p className="text-xs text-slate-400">{s.category}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {s.duration} min
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatPrice(s.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StepFooter
        onBack={onBack}
        onSkip={onSkip}
        onContinue={onNext}
        continueLabel={services.length > 0 ? "Continuer" : "Continuer sans prestation"}
      />
    </div>
  );
};

export default ServicesStep;
