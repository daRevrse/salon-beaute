/**
 * SalonSwitcher - Dropdown pour changer de salon actif
 * Affiché dans la navbar quand l'utilisateur a accès à plusieurs salons
 */

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  ChevronUpDownIcon,
  CheckIcon,
  BuildingStorefrontIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import CreateSalonModal from "./CreateSalonModal";

const SalonSwitcher = () => {
  const { tenant, salons, switchSalon, hasMultipleSalons } = useAuth();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const ref = useRef(null);

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Afficher si plusieurs salons OU si le plan permet d'en créer d'autres (plan custom)
  const canSeeSwitcher = hasMultipleSalons || tenant?.subscription_plan === "custom";
  if (!canSeeSwitcher) return null;

  const handleSwitch = async (targetTenantId) => {
    if (targetTenantId === tenant?.id) {
      setOpen(false);
      return;
    }

    setSwitching(true);
    const result = await switchSalon(targetTenantId);
    setSwitching(false);
    setOpen(false);

    if (result.success) {
      // Recharger la page pour rafraîchir toutes les données
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        disabled={switching}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 group"
        title="Changer de salon"
      >
        {tenant?.logo_url ? (
          <img
            src={tenant.logo_url}
            alt=""
            className="w-6 h-6 rounded-md object-cover"
          />
        ) : (
          <BuildingStorefrontIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
        )}
        <span className="hidden lg:block text-sm font-medium text-slate-700 max-w-[140px] truncate">
          {tenant?.name || "Salon"}
        </span>
        <ChevronUpDownIcon className="w-4 h-4 text-slate-400" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Mes salons ({salons.length})
            </p>
          </div>

          {/* Liste */}
          <div className="max-h-64 overflow-y-auto py-1">
            {salons.map((salon) => {
              const isActive = salon.tenant_id === tenant?.id;
              return (
                <button
                  key={salon.tenant_id}
                  onClick={() => handleSwitch(salon.tenant_id)}
                  disabled={switching}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-indigo-50"
                      : "hover:bg-slate-50"
                  } ${switching ? "opacity-50 cursor-wait" : ""}`}
                >
                  {/* Logo/Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? "bg-indigo-100"
                        : "bg-slate-100"
                    }`}
                  >
                    {salon.logo_url ? (
                      <img
                        src={salon.logo_url}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <BuildingStorefrontIcon
                        className={`w-4 h-4 ${
                          isActive ? "text-indigo-500" : "text-slate-400"
                        }`}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isActive ? "text-indigo-700" : "text-slate-700"
                      }`}
                    >
                      {salon.name}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span className="capitalize">{salon.role}</span>
                      {salon.is_primary && (
                        <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0 rounded-full">
                          Principal
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Check actif */}
                  {isActive && (
                    <CheckIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer - Créer un salon (si plan Custom) */}
          {tenant?.subscription_plan === "custom" && (
            <div className="border-t border-slate-100 p-2">
              <button
                onClick={() => {
                  setOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Créer un nouveau salon
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de création */}
      <CreateSalonModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newSalon) => {
          // Recharger la page pour rafraîchir la liste des salons
          window.location.href = "/dashboard";
        }}
      />
    </div>
  );
};

export default SalonSwitcher;
