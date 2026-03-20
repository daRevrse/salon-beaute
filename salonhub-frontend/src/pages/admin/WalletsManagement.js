import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = process.env.REACT_APP_API_URL;

function WalletsManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("wallets"); // 'wallets' or 'withdrawals'
  const [wallets, setWallets] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const { toast, hideToast, success, error: showError } = useToast();

  const getToken = () => localStorage.getItem("superadmin_token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/superadmin/login");
      return;
    }
    if (activeTab === "wallets") {
      loadWallets();
    } else {
      loadWithdrawals();
    }
  }, [navigate, activeTab, statusFilter]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/system/wallets`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setWallets(res.data.wallets || []);
    } catch (error) {
      console.error("Erreur chargement wallets:", error);
      if (error.response?.status === 401) navigate("/superadmin/login");
    } finally {
      setLoading(false);
    }
  };

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);

      const res = await axios.get(`${API_URL}/admin/system/withdrawals?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setWithdrawals(res.data.requests || []);
    } catch (error) {
      console.error("Erreur chargement withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (id, status) => {
    if (!window.confirm(`Voulez-vous vraiment marquer cette demande comme ${status} ?`)) return;
    const notes = prompt("Ajouter une note (optionnel) :") || "";

    try {
      await axios.put(`${API_URL}/admin/system/withdrawals/${id}/status`, 
        { status, notes },
        { headers: { Authorization: `Bearer ${getToken()}` }}
      );
      success("Demande traitée avec succès");
      loadWithdrawals();
    } catch (error) {
      console.error("Erreur processing withdrawal:", error);
      showError(error.response?.data?.error || "Erreur lors du traitement de la demande");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <header style={{ background: "#1e1e2e", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", margin: 0 }}>Gestion des Wallets</h1>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>Contrôlez les soldes et demandes de retraits des salons</p>
          </div>
          <button
            onClick={() => navigate("/superadmin/dashboard")}
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#e2e8f0",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retour Dashboard
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab("wallets")}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: activeTab === "wallets" ? "rgba(99,102,241,0.1)" : "transparent",
              color: activeTab === "wallets" ? "#818cf8" : "#94a3b8",
              border: `1px solid ${activeTab === "wallets" ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.1)"}`,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Soldes des Salons
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: activeTab === "withdrawals" ? "rgba(99,102,241,0.1)" : "transparent",
              color: activeTab === "withdrawals" ? "#818cf8" : "#94a3b8",
              border: `1px solid ${activeTab === "withdrawals" ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.1)"}`,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Demandes de Retrait
          </button>
        </div>

        <div style={{ background: "#1e1e2e", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          
          {activeTab === "wallets" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Salon</th>
                    <th style={{ padding: "14px 24px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Solde Disponible</th>
                    <th style={{ padding: "14px 24px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Solde en Retrait</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Chargement...</td></tr>
                  ) : wallets.map((w) => (
                    <tr key={w.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0" }}>{w.tenant_name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{w.tenant_email}</div>
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "right", fontSize: 15, fontWeight: 700, color: "#34d399" }}>
                        {parseFloat(w.balance).toFixed(2)}€
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "right", fontSize: 14, fontWeight: 600, color: "#fbbf24" }}>
                        {parseFloat(w.pending_balance).toFixed(2)}€
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "withdrawals" && (
            <div>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none",
                  }}
                >
                  <option value="">Tous les statuts</option>
                  <option value="PENDING">En attente</option>
                  <option value="COMPLETED">Complétés</option>
                  <option value="REJECTED">Rejetés</option>
                </select>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Date</th>
                      <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Salon</th>
                      <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Montant</th>
                      <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Méthode</th>
                      <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Statut</th>
                      {statusFilter === "PENDING" && <th style={{ padding: "14px 24px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={statusFilter === "PENDING" ? 6 : 5} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Chargement...</td></tr>
                    ) : withdrawals.length === 0 ? (
                      <tr><td colSpan={statusFilter === "PENDING" ? 6 : 5} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Aucune demande trouvée</td></tr>
                    ) : withdrawals.map((wr) => (
                      <tr key={wr.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "16px 24px", fontSize: 13, color: "#94a3b8" }}>
                          {new Date(wr.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0" }}>{wr.tenant_name}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{wr.tenant_email}</div>
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>
                          {parseFloat(wr.amount).toFixed(2)}€
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: 13, color: "#e2e8f0" }}>
                          {wr.payout_method}<br/>
                          <span style={{color: "#94a3b8", fontSize: 11}}>{wr.payout_details}</span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{
                            padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: wr.status === "COMPLETED" ? "rgba(52,211,153,0.1)" : wr.status === "PENDING" ? "rgba(251,191,36,0.1)" : "rgba(248,113,113,0.1)",
                            color: wr.status === "COMPLETED" ? "#34d399" : wr.status === "PENDING" ? "#fbbf24" : "#f87171"
                          }}>
                            {wr.status}
                          </span>
                        </td>
                        {statusFilter === "PENDING" && (
                          <td style={{ padding: "16px 24px", textAlign: "right" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                              <button
                                onClick={() => handleProcessWithdrawal(wr.id, "COMPLETED")}
                                style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                              >
                                Approuver
                              </button>
                              <button
                                onClick={() => handleProcessWithdrawal(wr.id, "REJECTED")}
                                style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                              >
                                Rejeter
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  );
}

export default WalletsManagement;
