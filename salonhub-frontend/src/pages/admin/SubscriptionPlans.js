import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

const API_URL = process.env.REACT_APP_API_URL;

function SubscriptionPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const { toast, hideToast, success, error: showError } = useToast();

  const getToken = () => localStorage.getItem("superadmin_token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/superadmin/login");
      return;
    }
    loadPlans();
  }, [navigate]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/subscription-plans`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setPlans(res.data.plans || []);
    } catch (error) {
      console.error("Erreur chargement plans:", error);
      if (error.response?.status === 401) navigate("/superadmin/login");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingPlan,
        features: typeof editingPlan.features === "string" 
          ? editingPlan.features.split("\\n").map(f => f.trim()).filter(Boolean)
          : editingPlan.features
      };

      if (editingPlan.id) {
        await axios.put(`${API_URL}/admin/subscription-plans/${editingPlan.id}`, payload, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        success("Plan mis à jour avec succès");
      } else {
        await axios.post(`${API_URL}/admin/subscription-plans`, payload, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        success("Plan créé avec succès");
      }
      setEditingPlan(null);
      loadPlans();
    } catch (error) {
      showError("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment désactiver ce plan ?")) return;
    try {
      await axios.delete(`${API_URL}/admin/subscription-plans/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      success("Plan désactivé");
      loadPlans();
    } catch (error) {
      showError("Erreur lors de la désactivation");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <header style={{ background: "#1e1e2e", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", margin: 0 }}>Prix et Abonnements</h1>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>Gérez les différents plans proposés aux salons</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setEditingPlan({ name: "", display_name: "", price: 0, description: "", features: [], is_active: true })}
              style={{
                padding: "8px 16px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 8,
                color: "#fff", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", border: "none"
              }}
            >
              <PlusIcon style={{ width: 16 }} /> Nouveau Plan
            </button>
            <button
              onClick={() => navigate("/superadmin/dashboard")}
              style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Retour
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px", display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        {editingPlan ? (
          <div style={{ background: "#1e1e2e", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#e2e8f0", marginBottom: 24 }}>
              {editingPlan.id ? "Modifier le plan" : "Créer un plan"}
            </h2>
            <form onSubmit={handleSave} style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Identifiant (ex: pro)</label>
                  <input required disabled={!!editingPlan.id} value={editingPlan.name} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} style={{ width: "100%", padding: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Nom affiché</label>
                  <input required value={editingPlan.display_name} onChange={e => setEditingPlan({...editingPlan, display_name: e.target.value})} style={{ width: "100%", padding: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14 }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Description courte</label>
                <input required value={editingPlan.description} onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} style={{ width: "100%", padding: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Prix (EUR)</label>
                  <input required type="number" step="0.01" value={editingPlan.price} onChange={e => setEditingPlan({...editingPlan, price: parseFloat(e.target.value)})} style={{ width: "100%", padding: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>ID Prix Stripe (optionnel)</label>
                  <input value={editingPlan.stripe_price_id || ""} onChange={e => setEditingPlan({...editingPlan, stripe_price_id: e.target.value})} style={{ width: "100%", padding: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14 }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Fonctionnalités (une par ligne)</label>
                <textarea rows="4" value={typeof editingPlan.features === "string" ? editingPlan.features : (editingPlan.features || []).join("\\n")} onChange={e => setEditingPlan({...editingPlan, features: e.target.value})} style={{ width: "100%", padding: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14 }} />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button type="submit" style={{ padding: "10px 24px", background: "#34d399", color: "#064e3b", borderRadius: 8, fontWeight: 600, border: "none", cursor: "pointer" }}>Enregistrer</button>
                <button type="button" onClick={() => setEditingPlan(null)} style={{ padding: "10px 24px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 8, cursor: "pointer" }}>Annuler</button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {plans.map(plan => (
              <div key={plan.id} style={{ background: "#1e1e2e", borderRadius: 16, border: `1px solid ${plan.is_active ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`, padding: 24, position: "relative", opacity: plan.is_active ? 1 : 0.6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{plan.display_name}</h3>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>{plan.description}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEditingPlan({...plan, features: Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : [])})} style={{ background: "transparent", border: "none", color: "#818cf8", cursor: "pointer", padding: 4 }}><PencilIcon style={{width: 18}}/></button>
                    {plan.is_active && <button onClick={() => handleDelete(plan.id)} style={{ background: "transparent", border: "none", color: "#fb7185", cursor: "pointer", padding: 4 }}><TrashIcon style={{width: 18}}/></button>}
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#f8fafc", marginBottom: 24 }}>
                  {plan.price}€ <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>/ {plan.interval_type}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
                  {(Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : [])).map((feature, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#cbd5e1" }}>
                      <span style={{ color: "#34d399" }}>✓</span> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {plans.length === 0 && !loading && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: "#64748b" }}>Aucun plan configuré.</div>
            )}
          </div>
        )}
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}
    </div>
  );
}

export default SubscriptionPlans;
