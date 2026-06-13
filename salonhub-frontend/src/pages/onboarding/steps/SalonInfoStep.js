/**
 * SalonInfoStep - Étape 1 : coordonnées de l'établissement + logo
 * GET/PUT /settings/salon
 */

import { useState, useEffect } from "react";
import api from "../../../services/api";
import ImageUploader from "../../../components/common/ImageUploader";
import { MapPinIcon, PhoneIcon } from "@heroicons/react/24/outline";
import StepFooter from "./StepFooter";

const SalonInfoStep = ({ config, term, onNext, onSkip, onBack }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
  });
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get("/settings/salon")
      .then((res) => {
        if (!active) return;
        const salon = res.data?.data || {};
        setForm({
          name: salon.name || "",
          phone: salon.phone || "",
          address: salon.address || "",
          city: salon.city || "",
          postal_code: salon.postal_code || "",
        });
        if (salon.logo_url) setLogoUrl(salon.logo_url);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleContinue = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put("/settings/salon", {
        phone: form.phone,
        address: form.address,
        city: form.city,
        postal_code: form.postal_code,
        logo_url: logoUrl,
      });
      onNext();
    } catch (err) {
      setError(
        err.response?.data?.error || "Erreur lors de l'enregistrement des infos"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 rounded-xl border-2 border-slate-200 border-t-violet-600 animate-elegant-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h2 className="font-display text-xl text-slate-800 mb-1">
          Les coordonnées de votre {term.establishment.toLowerCase()}
        </h2>
        <p className="text-sm text-slate-500">
          Ces informations apparaissent sur votre page de réservation.
          {form.name ? (
            <>
              {" "}
              Établissement : <strong>{form.name}</strong>.
            </>
          ) : null}
        </p>
      </div>

      {error && (
        <div className="alert-error-premium mb-5">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="label-premium">Téléphone</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <PhoneIcon className="h-5 w-5 text-slate-300" />
            </div>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="input-premium input-premium-icon"
              placeholder="01 23 45 67 89"
            />
          </div>
        </div>

        <div>
          <label className="label-premium">Adresse</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPinIcon className="h-5 w-5 text-slate-300" />
            </div>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="input-premium input-premium-icon"
              placeholder="123 Rue de la Paix"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label-premium">Ville</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="input-premium"
              placeholder="Paris"
            />
          </div>
          <div>
            <label className="label-premium">Code postal</label>
            <input
              type="text"
              name="postal_code"
              value={form.postal_code}
              onChange={handleChange}
              className="input-premium"
              placeholder="75001"
            />
          </div>
        </div>

        <div>
          <label className="label-premium">Logo (optionnel)</label>
          <div className="max-w-xs">
            <ImageUploader
              target="tenant-logo"
              imageUrl={logoUrl}
              onImageUpload={setLogoUrl}
              onDelete={() => setLogoUrl(null)}
              label="Logo"
              aspectRatio="aspect-square"
            />
          </div>
        </div>
      </div>

      <StepFooter
        onBack={onBack}
        onSkip={onSkip}
        onContinue={handleContinue}
        saving={saving}
      />
    </div>
  );
};

export default SalonInfoStep;
