import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

function SectorsManagement() {
  const navigate = useNavigate();
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast, hideToast, success, error: showError } = useToast();

  const getToken = () => localStorage.getItem("superadmin_token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/superadmin/login");
      return;
    }
    loadSectors();
  }, [navigate]);

  const loadSectors = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/system/sectors`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSectors(res.data.sectors || []);
    } catch (error) {
      console.error("Erreur chargement secteurs:", error);
      if (error.response?.status === 401) navigate("/superadmin/login");
    } finally {
      setLoading(false);
    }
  };

  const toggleSectorStatus = async (id, currentStatus) => {
    try {
      await axios.put(`${API_URL}/admin/system/sectors/${id}/status`, 
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      success(`Secteur ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
      loadSectors();
    } catch (error) {
      showError("Erreur lors de la modification du statut");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <header style={{ background: "#1e1e2e", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", margin: 0 }}>Gestion des Secteurs</h1>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>Activez ou désactivez l'inscription pour certains métiers</p>
          </div>
          <button
            onClick={() => navigate("/superadmin/dashboard")}
            style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Retour Dashboard
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px" }}>
        <div style={{ background: "#1e1e2e", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Secteur</th>
                  <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Valeur ID</th>
                  <th style={{ padding: "14px 24px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Inscriptions (Statut)</th>
                  <th style={{ padding: "14px 24px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Chargement...</td></tr>
                ) : sectors.map((sector) => (
                  <tr key={sector.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", opacity: sector.is_active ? 1 : 0.6 }}>
                    <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
                      {sector.label}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: 13, color: "#94a3b8", fontFamily: "monospace" }}>
                      {sector.value}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "center" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: sector.is_active ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                        color: sector.is_active ? "#34d399" : "#f87171"
                      }}>
                        {sector.is_active ? "Ouvertes" : "Fermées"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <button
                        onClick={() => toggleSectorStatus(sector.id, sector.is_active)}
                        style={{
                          padding: "6px 12px", borderRadius: 6,
                          background: sector.is_active ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)",
                          color: sector.is_active ? "#f87171" : "#34d399",
                          border: `1px solid ${sector.is_active ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)"}`,
                          cursor: "pointer", fontSize: 12, fontWeight: 600
                        }}
                      >
                        {sector.is_active ? "Fermer" : "Ouvrir"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}
    </div>
  );
}

export default SectorsManagement;
