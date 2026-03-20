import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

function SystemTransactions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0 });

  const getToken = () => localStorage.getItem("superadmin_token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/superadmin/login");
      return;
    }
    loadTransactions();
  }, [navigate, statusFilter, pagination.offset]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: pagination.offset,
      });
      if (statusFilter) params.append("status", statusFilter);

      const res = await axios.get(`${API_URL}/admin/system/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTransactions(res.data.transactions || []);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error("Erreur chargement transactions:", error);
      if (error.response?.status === 401) {
        navigate("/superadmin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination(p => ({ ...p, offset: p.offset + p.limit }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(p => ({ ...p, offset: Math.max(0, p.offset - p.limit) }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <header style={{ background: "#1e1e2e", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", margin: 0 }}>Transactions Système</h1>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>Vue globale de tous les mouvements financiers (salons, wallets)</p>
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
        <div style={{ background: "#1e1e2e", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 12 }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(p => ({ ...p, offset: 0 }));
              }}
              style={{
                padding: "10px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#e2e8f0",
                fontSize: 13,
                outline: "none",
                minWidth: 160,
              }}
            >
              <option value="">Tous les statuts</option>
              <option value="COMPLETED">Complété</option>
              <option value="PENDING">En attente</option>
              <option value="FAILED">Échoué</option>
              <option value="REFUNDED">Remboursé</option>
            </select>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Date</th>
                  <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Salon</th>
                  <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Type</th>
                  <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Montant</th>
                  <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Chargement...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Aucune transaction trouvée</td></tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "16px 24px", fontSize: 13, color: "#94a3b8" }}>
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0" }}>{tx.tenant_name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{tx.tenant_email}</div>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: 13, color: "#e2e8f0", textTransform: "capitalize" }}>
                        {tx.type}
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 600, color: tx.amount > 0 ? "#34d399" : "#f87171" }}>
                        {tx.amount > 0 ? "+" : ""}{parseFloat(tx.amount).toFixed(2)}€
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{
                          padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: tx.status === "COMPLETED" ? "rgba(52,211,153,0.1)" : tx.status === "PENDING" ? "rgba(251,191,36,0.1)" : "rgba(248,113,113,0.1)",
                          color: tx.status === "COMPLETED" ? "#34d399" : tx.status === "PENDING" ? "#fbbf24" : "#f87171"
                        }}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Affichage {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} sur {pagination.total}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handlePrevPage} disabled={pagination.offset === 0} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: pagination.offset === 0 ? "#475569" : "#e2e8f0", cursor: pagination.offset === 0 ? "not-allowed" : "pointer", fontSize: 13 }}>Précédent</button>
              <button onClick={handleNextPage} disabled={pagination.offset + pagination.limit >= pagination.total} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: pagination.offset + pagination.limit >= pagination.total ? "#475569" : "#e2e8f0", cursor: pagination.offset + pagination.limit >= pagination.total ? "not-allowed" : "pointer", fontSize: 13 }}>Suivant</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SystemTransactions;
