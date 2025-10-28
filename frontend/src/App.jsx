import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:3000/api";

function App() {
  const [page, setPage] = useState("home"); // 'home', 'booking', 'admin'
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'admin' ou 'manager'

  // Détecter si l'URL contient /admin
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes("/admin")) {
      setPage("admin");
    }
  }, []);

  return (
    <div className="app">
      {page === "home" && <PageAccueil onReserver={() => setPage("booking")} />}
      {page === "booking" && (
        <InterfaceClient onRetour={() => setPage("home")} />
      )}
      {page === "admin" &&
        (isAdminAuth ? (
          <InterfaceAdmin
            onLogout={() => {
              setIsAdminAuth(false);
              setUserRole(null);
              localStorage.removeItem("adminPassword");
              localStorage.removeItem("userRole");
              setPage("home");
            }}
            userRole={userRole}
          />
        ) : (
          <LoginAdmin
            onLoginSuccess={(role) => {
              setIsAdminAuth(true);
              setUserRole(role);
            }}
            onCancel={() => setPage("home")}
          />
        ))}
    </div>
  );
}

// ===== PAGE D'ACCUEIL =====
function PageAccueil({ onReserver }) {
  const [salonInfo, setSalonInfo] = useState(null);
  const [services, setServices] = useState([]);
  const [horaires, setHoraires] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/public/info`)
      .then((r) => r.json())
      .then(setSalonInfo);
    fetch(`${API_URL}/public/services`)
      .then((r) => r.json())
      .then(setServices);
    fetch(`${API_URL}/public/horaires`)
      .then((r) => r.json())
      .then(setHoraires);
  }, []);

  const joursNoms = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            💇‍♀️ {salonInfo?.nom_salon || "Salon de Beauté"}
          </h1>
          <p className="hero-subtitle">Votre beauté, notre passion</p>
          <button className="btn-hero" onClick={onReserver}>
            ✨ Réserver un rendez-vous
          </button>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <div className="container-landing">
          <h2 className="section-title">Nos Prestations</h2>
          <p className="section-subtitle">
            Des services de qualité pour sublimer votre beauté
          </p>

          <div className="services-grid-landing">
            {services.slice(0, 6).map((service) => (
              <div key={service.id} className="service-card-landing">
                <div className="service-icon">✂️</div>
                <h3 className="service-name-landing">{service.nom}</h3>
                <p className="service-description-landing">
                  {service.description}
                </p>
                <div className="service-price-landing">
                  <span className="price">{service.prix}XOF</span>
                  <span className="duration">{service.duree} min</span>
                </div>
              </div>
            ))}
          </div>

          {services.length > 6 && (
            <div style={{ textAlign: "center", marginTop: "30px" }}>
              <button className="btn btn-primary" onClick={onReserver}>
                Voir tous nos services
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Horaires Section */}
      <section className="horaires-section">
        <div className="container-landing">
          <h2 className="section-title">Horaires d'ouverture</h2>
          <div className="horaires-grid">
            {horaires
              .filter((h) => h.actif === 1)
              .map((h) => (
                <div key={h.jour_semaine} className="horaire-item">
                  <span className="horaire-jour-name">
                    {joursNoms[h.jour_semaine]}
                  </span>
                  <span className="horaire-heures">
                    {h.heure_debut} - {h.heure_fin}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container-landing">
          <h2 className="cta-title">Prêt à prendre soin de vous ?</h2>
          <p className="cta-text">
            Réservez votre rendez-vous en quelques clics
          </p>
          <button className="btn-hero" onClick={onReserver}>
            📅 Je prends rendez-vous
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-landing">
        <div className="container-landing">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Contact</h4>
              <p>📞 {salonInfo?.telephone}</p>
              <p>📍 {salonInfo?.adresse}</p>
            </div>
            <div className="footer-section">
              <h4>{salonInfo?.nom_salon}</h4>
              <p>Votre beauté, notre passion</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 {salonInfo?.nom_salon}. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LoginAdmin({ onLoginSuccess, onCancel }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("adminPassword", password);
        localStorage.setItem("userRole", data.role); // 'admin' ou 'manager'
        onLoginSuccess(data.role);
      } else {
        setError("Mot de passe incorrect");
      }
    } catch (error) {
      setError("Erreur de connexion");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🔐 Accès Administration</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" className="btn btn-primary">
              Se connecter
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Retour
            </button>
          </div>
          <div className="login-hint">
            💡 Admin : <code>admin123</code>
          </div>
        </form>
      </div>
    </div>
  );
}

function InterfaceClient({ onRetour }) {
  const [step, setStep] = useState("services");
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [creneaux, setCreneaux] = useState([]);
  const [selectedCreneau, setSelectedCreneau] = useState(null);
  const [loading, setLoading] = useState(false);
  const [salonInfo, setSalonInfo] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    notes: "",
    moyen_confirmation: "email", // 'email', 'sms', 'whatsapp'
  });

  useEffect(() => {
    fetch(`${API_URL}/public/services`)
      .then((r) => r.json())
      .then(setServices);
    fetch(`${API_URL}/public/info`)
      .then((r) => r.json())
      .then(setSalonInfo);
  }, []);

  const fetchCreneaux = async (date) => {
    setLoading(true);
    const r = await fetch(
      `${API_URL}/public/creneaux-disponibles?service_id=${selectedService.id}&date=${date}`
    );
    const data = await r.json();
    setCreneaux(data.creneaux || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const response = await fetch(`${API_URL}/public/rendez-vous`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        service_id: selectedService.id,
        date_heure: selectedCreneau.datetime,
      }),
    });
    if (response.ok) setStep("confirmation");
    else alert("Erreur");
    setLoading(false);
  };

  return (
    <>
      <header className="header-client">
        <div>
          <button className="btn-retour" onClick={onRetour}>
            ← Retour à l'accueil
          </button>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <h1>💇‍♀️ {salonInfo?.nom_salon || "Salon de Beauté"}</h1>
          <p className="salon-subtitle">Réservation en ligne</p>
        </div>
        <div style={{ width: "120px" }}></div>
      </header>

      <div className="client-content">
        {step === "services" && (
          <div className="step-container">
            <h2 className="step-title">1️⃣ Choisissez votre prestation</h2>
            <div className="services-grid">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="service-card clickable"
                  onClick={() => {
                    setSelectedService(s);
                    setStep("date");
                  }}
                >
                  <div className="service-name">{s.nom}</div>
                  <div className="service-description">{s.description}</div>
                  <div className="service-info">
                    <div className="service-detail">
                      <span className="service-detail-value">{s.duree}</span>
                      <span className="service-detail-label">min</span>
                    </div>
                    <div className="service-detail">
                      <span className="service-detail-value">{s.prix}XOF</span>
                      <span className="service-detail-label">prix</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "date" && (
          <div className="step-container">
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setStep("services")}
            >
              ← Retour
            </button>
            <h2 className="step-title">2️⃣ Choisissez la date et l'heure</h2>
            <div className="selected-service-banner">
              <strong>{selectedService.nom}</strong> - {selectedService.duree}{" "}
              min - {selectedService.prix}XOF
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  fetchCreneaux(e.target.value);
                }}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            {loading && (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            )}
            {!loading && creneaux.length > 0 && (
              <div className="creneaux-grid">
                {creneaux.map((c, i) => (
                  <button
                    key={i}
                    className={`creneau-btn ${
                      selectedCreneau?.heure === c.heure ? "selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedCreneau(c);
                      setStep("infos");
                    }}
                  >
                    {c.heure}
                  </button>
                ))}
              </div>
            )}
            {!loading && selectedDate && creneaux.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <h3 className="empty-state-title">Aucun créneau disponible</h3>
              </div>
            )}
          </div>
        )}

        {step === "infos" && (
          <div className="step-container">
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setStep("date")}
            >
              ← Retour
            </button>
            <h2 className="step-title">3️⃣ Vos informations</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Prénom *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.prenom}
                    onChange={(e) =>
                      setFormData({ ...formData, prenom: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.telephone}
                  onChange={(e) =>
                    setFormData({ ...formData, telephone: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Comment souhaitez-vous recevoir la confirmation ? *
                </label>
                <div className="confirmation-methods">
                  <label
                    className={`method-option ${
                      formData.moyen_confirmation === "email" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="moyen_confirmation"
                      value="email"
                      checked={formData.moyen_confirmation === "email"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          moyen_confirmation: e.target.value,
                        })
                      }
                    />
                    <span className="method-icon">📧</span>
                    <span className="method-label">Email</span>
                  </label>

                  <label
                    className={`method-option ${
                      formData.moyen_confirmation === "sms" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="moyen_confirmation"
                      value="sms"
                      checked={formData.moyen_confirmation === "sms"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          moyen_confirmation: e.target.value,
                        })
                      }
                    />
                    <span className="method-icon">📱</span>
                    <span className="method-label">SMS</span>
                  </label>

                  <label
                    className={`method-option ${
                      formData.moyen_confirmation === "whatsapp"
                        ? "selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="moyen_confirmation"
                      value="whatsapp"
                      checked={formData.moyen_confirmation === "whatsapp"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          moyen_confirmation: e.target.value,
                        })
                      }
                    />
                    <span className="method-icon">💬</span>
                    <span className="method-label">WhatsApp</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-large">
                ✓ Confirmer
              </button>
            </form>
          </div>
        )}

        {step === "confirmation" && (
          <div className="step-container">
            <div className="confirmation-box">
              <div className="confirmation-icon">✅</div>
              <h2>Rendez-vous enregistré !</h2>
              <p className="confirmation-text">
                Votre demande de rendez-vous a été enregistrée avec succès.
                <br />
                <strong>
                  Vous recevrez une confirmation par{" "}
                  {formData.moyen_confirmation === "sms"
                    ? "SMS 📱"
                    : formData.moyen_confirmation === "whatsapp"
                    ? "WhatsApp 💬"
                    : "email 📧"}
                  .
                </strong>
              </p>

              <div className="confirmation-details">
                <h3>Récapitulatif</h3>
                <p>
                  <strong>Service :</strong> {selectedService.nom}
                </p>
                <p>
                  <strong>Date :</strong>{" "}
                  {new Date(selectedCreneau.datetime).toLocaleDateString(
                    "fr-FR",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
                <p>
                  <strong>Heure :</strong> {selectedCreneau.heure}
                </p>
                <p>
                  <strong>Durée :</strong> {selectedService.duree} minutes
                </p>
                <p>
                  <strong>Prix :</strong> {selectedService.prix}XOF
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setStep("services");
                    setSelectedService(null);
                    setSelectedDate("");
                    setSelectedCreneau(null);
                    setFormData({
                      nom: "",
                      prenom: "",
                      telephone: "",
                      email: "",
                      notes: "",
                      moyen_confirmation: "email",
                    });
                  }}
                >
                  Prendre un autre RDV
                </button>
                <button className="btn btn-secondary" onClick={onRetour}>
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        )}
        {/* </div>
          </div>
        )} */}
      </div>

      {salonInfo && (
        <footer className="client-footer">
          <p>
            📞 {salonInfo.telephone} | 📍 {salonInfo.adresse}
          </p>
        </footer>
      )}
    </>
  );
}

// ===== INTERFACE ADMIN =====
function InterfaceAdmin({ onLogout, userRole }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [statsAvancees, setStatsAvancees] = useState(null);
  const adminPassword = localStorage.getItem("adminPassword");

  useEffect(() => {
    fetchStats();
    if (userRole === "admin") {
      fetchStatsAvancees();
    }
  }, [userRole]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: { "x-admin-password": adminPassword },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const fetchStatsAvancees = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/stats/avancees`, {
        headers: { "x-admin-password": adminPassword },
      });
      const data = await response.json();
      setStatsAvancees(data);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const isAdmin = userRole === "admin";

  return (
    <>
      <header className="header">
        <div>
          <h1>🔐 {isAdmin ? "Administration" : "Manager"}</h1>
          <span className="role-badge">
            {isAdmin ? "👑 Admin" : "📋 Manager"}
          </span>
        </div>
        {stats && (
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-value">{stats.en_attente.total}</span>
              <span className="stat-label">En attente</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.aujourd_hui.total}</span>
              <span className="stat-label">Aujourd'hui</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.cette_semaine.total}</span>
              <span className="stat-label">Semaine</span>
            </div>
            {isAdmin && (
              <div className="stat-card">
                <span className="stat-value">{stats.total_clients.total}</span>
                <span className="stat-label">Clients</span>
              </div>
            )}
          </div>
        )}
        <button className="btn btn-secondary" onClick={onLogout}>
          Déconnexion
        </button>
      </header>

      <nav className="nav">
        <button
          className={`nav-button ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-button ${
            activeTab === "validations" ? "active" : ""
          }`}
          onClick={() => setActiveTab("validations")}
        >
          🔔 Validations{" "}
          {stats?.en_attente.total > 0 && `(${stats.en_attente.total})`}
        </button>
        <button
          className={`nav-button ${
            activeTab === "rendez-vous" ? "active" : ""
          }`}
          onClick={() => setActiveTab("rendez-vous")}
        >
          📅 Planning
        </button>

        {isAdmin && (
          <>
            <button
              className={`nav-button ${
                activeTab === "horaires" ? "active" : ""
              }`}
              onClick={() => setActiveTab("horaires")}
            >
              ⏰ Horaires
            </button>
            <button
              className={`nav-button ${
                activeTab === "services" ? "active" : ""
              }`}
              onClick={() => setActiveTab("services")}
            >
              ✂️ Services
            </button>
            <button
              className={`nav-button ${
                activeTab === "clients" ? "active" : ""
              }`}
              onClick={() => setActiveTab("clients")}
            >
              👥 Clients
            </button>
          </>
        )}
      </nav>

      <main className="content">
        {activeTab === "dashboard" && (
          <Dashboard
            stats={stats}
            statsAvancees={statsAvancees}
            isAdmin={isAdmin}
          />
        )}
        {activeTab === "validations" && (
          <TabValidations onUpdate={fetchStats} />
        )}
        {activeTab === "rendez-vous" && <TabRendezVous />}
        {isAdmin && activeTab === "horaires" && <TabHoraires />}
        {isAdmin && activeTab === "services" && <TabServices />}
        {isAdmin && activeTab === "clients" && <TabClients />}
      </main>
    </>
  );
}

// ===== DASHBOARD =====
function Dashboard({ stats, statsAvancees, isAdmin }) {
  const [prochains, setProchains] = useState([]);
  const pwd = localStorage.getItem("adminPassword");

  useEffect(() => {
    // Charger les 5 prochains RDV
    fetch(`${API_URL}/admin/rendez-vous`, {
      headers: { "x-admin-password": pwd },
    })
      .then((r) => r.json())
      .then((data) => {
        const futurs = data
          .filter(
            (r) =>
              new Date(r.date_heure) >= new Date() && r.statut === "confirmé"
          )
          .slice(0, 5);
        setProchains(futurs);
      });
  }, []);

  if (!stats)
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">
        {isAdmin ? "📊 Dashboard Complet" : "📋 Vue d'ensemble"}
      </h2>

      {/* Stats principales */}
      <div className="dashboard-grid">
        <div className="dashboard-card card-urgent">
          <div className="dashboard-card-icon">🔔</div>
          <div className="dashboard-card-content">
            <h3 className="dashboard-card-title">En attente</h3>
            <p className="dashboard-card-value">{stats.en_attente.total}</p>
            <p className="dashboard-card-subtitle">À valider maintenant</p>
          </div>
        </div>

        <div className="dashboard-card card-today">
          <div className="dashboard-card-icon">📅</div>
          <div className="dashboard-card-content">
            <h3 className="dashboard-card-title">Aujourd'hui</h3>
            <p className="dashboard-card-value">{stats.aujourd_hui.total}</p>
            <p className="dashboard-card-subtitle">Rendez-vous du jour</p>
          </div>
        </div>

        <div className="dashboard-card card-week">
          <div className="dashboard-card-icon">📆</div>
          <div className="dashboard-card-content">
            <h3 className="dashboard-card-title">Cette semaine</h3>
            <p className="dashboard-card-value">{stats.cette_semaine.total}</p>
            <p className="dashboard-card-subtitle">RDV prévus</p>
          </div>
        </div>

        {isAdmin && (
          <div className="dashboard-card card-clients">
            <div className="dashboard-card-icon">👥</div>
            <div className="dashboard-card-content">
              <h3 className="dashboard-card-title">Clients</h3>
              <p className="dashboard-card-value">
                {stats.total_clients.total}
              </p>
              <p className="dashboard-card-subtitle">Total base</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats avancées (Admin uniquement) */}
      {isAdmin && statsAvancees && (
        <div className="dashboard-advanced">
          <h3 className="section-subtitle">📈 Statistiques avancées</h3>
          <div className="dashboard-grid">
            <div className="dashboard-card card-revenue">
              <div className="dashboard-card-icon">💰</div>
              <div className="dashboard-card-content">
                <h3 className="dashboard-card-title">Revenu du mois</h3>
                <p className="dashboard-card-value">
                  {statsAvancees.revenu_mois}XOF
                </p>
                <p className="dashboard-card-subtitle">Services terminés</p>
              </div>
            </div>

            <div className="dashboard-card card-popular">
              <div className="dashboard-card-icon">⭐</div>
              <div className="dashboard-card-content">
                <h3 className="dashboard-card-title">Service populaire</h3>
                <p className="dashboard-card-value-small">
                  {statsAvancees.service_populaire?.nom || "N/A"}
                </p>
                <p className="dashboard-card-subtitle">
                  {statsAvancees.service_populaire?.count || 0} fois ce mois
                </p>
              </div>
            </div>

            <div className="dashboard-card card-rate">
              <div className="dashboard-card-icon">✅</div>
              <div className="dashboard-card-content">
                <h3 className="dashboard-card-title">Taux validation</h3>
                <p className="dashboard-card-value">
                  {statsAvancees.taux_validation}%
                </p>
                <p className="dashboard-card-subtitle">RDV acceptés</p>
              </div>
            </div>

            <div className="dashboard-card card-moyenne">
              <div className="dashboard-card-icon">⏱️</div>
              <div className="dashboard-card-content">
                <h3 className="dashboard-card-title">RDV par jour</h3>
                <p className="dashboard-card-value">
                  {statsAvancees.rdv_par_jour}
                </p>
                <p className="dashboard-card-subtitle">Moyenne (30j)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prochains RDV */}
      <div className="dashboard-upcoming">
        <h3 className="section-subtitle">🔜 Prochains rendez-vous confirmés</h3>
        {prochains.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <p>Aucun rendez-vous confirmé à venir</p>
          </div>
        ) : (
          <div className="dashboard-list">
            {prochains.map((rdv) => (
              <div key={rdv.id} className="dashboard-rdv-item">
                <div className="dashboard-rdv-time">
                  <div className="dashboard-rdv-date">
                    {new Date(rdv.date_heure).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="dashboard-rdv-hour">
                    {new Date(rdv.date_heure).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="dashboard-rdv-info">
                  <div className="dashboard-rdv-client">
                    {rdv.client_prenom} {rdv.client_nom}
                  </div>
                  <div className="dashboard-rdv-service">{rdv.service_nom}</div>
                </div>
                <div className="dashboard-rdv-badge">
                  <span className="badge-confirmed">✓ Confirmé</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabValidations({ onUpdate }) {
  const [rdvs, setRdvs] = useState([]);
  const pwd = localStorage.getItem("adminPassword");

  useEffect(() => {
    loadRdvs();
  }, []);

  const loadRdvs = () => {
    fetch(`${API_URL}/admin/rendez-vous/en-attente`, {
      headers: { "x-admin-password": pwd },
    })
      .then((r) => r.json())
      .then(setRdvs);
  };

  const updateStatut = async (id, statut) => {
    await fetch(`${API_URL}/admin/rendez-vous/${id}/statut`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": pwd },
      body: JSON.stringify({ statut }),
    });
    setRdvs(rdvs.filter((r) => r.id !== id));
    if (onUpdate) onUpdate();
  };

  return (
    <div>
      <h2 className="card-title">Demandes en attente</h2>
      {rdvs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <h3>Aucune demande</h3>
        </div>
      ) : (
        <div className="rdv-list">
          {rdvs.map((r) => (
            <div key={r.id} className="rdv-card">
              <div className="rdv-time">
                {new Date(r.date_heure).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
                <br />
                {new Date(r.date_heure).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="rdv-info">
                <div className="rdv-client">
                  {r.client_prenom} {r.client_nom}
                </div>
                <div className="rdv-service">{r.service_nom}</div>
                <div className="rdv-details">📞 {r.client_telephone}</div>
              </div>
              <div className="rdv-actions">
                <button
                  className="btn btn-small btn-success"
                  onClick={() => updateStatut(r.id, "confirmé")}
                >
                  ✓
                </button>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => updateStatut(r.id, "refusé")}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabRendezVous() {
  const [rdvs, setRdvs] = useState([]);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const pwd = localStorage.getItem("adminPassword");

  useEffect(() => {
    loadRdvs();
  }, []);

  const loadRdvs = () => {
    fetch(`${API_URL}/admin/rendez-vous`, {
      headers: { "x-admin-password": pwd },
    })
      .then((r) => r.json())
      .then((data) =>
        setRdvs(
          data.filter(
            (r) =>
              new Date(r.date_heure) >= new Date() &&
              r.statut !== "annulé" &&
              r.statut !== "refusé"
          )
        )
      );
  };

  const updateStatut = async (id, statut) => {
    await fetch(`${API_URL}/admin/rendez-vous/${id}/statut`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": pwd },
      body: JSON.stringify({ statut }),
    });
    loadRdvs();
    setSelectedRdv(null);
  };

  const openContactModal = (rdv) => {
    setSelectedRdv(rdv);
    setContactMessage(
      `Bonjour ${
        rdv.client_prenom
      },\n\nConcernant votre rendez-vous du ${new Date(
        rdv.date_heure
      ).toLocaleDateString("fr-FR")} à ${new Date(
        rdv.date_heure
      ).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}...\n\nCordialement,\nL'équipe`
    );
    setShowContactModal(true);
  };

  const handleContact = () => {
    const rdv = selectedRdv;
    let contactUrl = "";

    if (rdv.moyen_confirmation === "sms") {
      // SMS
      contactUrl = `sms:${rdv.client_telephone}${
        /iPhone|iPad|iPod/.test(navigator.userAgent) ? "&" : "?"
      }body=${encodeURIComponent(contactMessage)}`;
    } else if (rdv.moyen_confirmation === "whatsapp") {
      // WhatsApp
      const phone = rdv.client_telephone.replace(/[^0-9]/g, "");
      contactUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
        contactMessage
      )}`;
    } else {
      // Email
      contactUrl = `mailto:${rdv.client_email}?subject=${encodeURIComponent(
        `Votre rendez-vous`
      )}&body=${encodeURIComponent(contactMessage)}`;
    }

    window.open(contactUrl, "_blank");
    setShowContactModal(false);
  };

  return (
    <div>
      <h2 className="card-title">Rendez-vous à venir</h2>
      <div className="rdv-list">
        {rdvs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>Aucun rendez-vous à venir</h3>
          </div>
        ) : (
          rdvs.map((r) => (
            <div
              key={r.id}
              className="rdv-card"
              onClick={() => setSelectedRdv(r)}
            >
              <div className="rdv-time">
                {new Date(r.date_heure).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
                <br />
                {new Date(r.date_heure).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="rdv-info">
                <div className="rdv-client">
                  {r.client_prenom} {r.client_nom}
                </div>
                <div className="rdv-service">{r.service_nom}</div>
                <span
                  className={`status-badge status-${r.statut.replace(
                    "_",
                    "-"
                  )}`}
                >
                  {r.statut.replace("_", " ")}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal détails RDV */}
      {selectedRdv && !showContactModal && (
        <div className="modal-overlay" onClick={() => setSelectedRdv(null)}>
          <div
            className="modal-content modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Détails du rendez-vous</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedRdv(null)}
              >
                ×
              </button>
            </div>
            <div className="rdv-details">
              <div className="rdv-detail-section">
                <h4>📅 Date & Heure</h4>
                <p>
                  {new Date(selectedRdv.date_heure).toLocaleDateString(
                    "fr-FR",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}{" "}
                  à{" "}
                  {new Date(selectedRdv.date_heure).toLocaleTimeString(
                    "fr-FR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>

              <div className="rdv-detail-section">
                <h4>👤 Client</h4>
                <p>
                  <strong>
                    {selectedRdv.client_prenom} {selectedRdv.client_nom}
                  </strong>
                </p>
                <p>📞 {selectedRdv.client_telephone}</p>
                {selectedRdv.client_email && (
                  <p>📧 {selectedRdv.client_email}</p>
                )}
                <p>
                  💬 Contact via :{" "}
                  <strong>
                    {selectedRdv.moyen_confirmation === "sms"
                      ? "SMS"
                      : selectedRdv.moyen_confirmation === "whatsapp"
                      ? "WhatsApp"
                      : "Email"}
                  </strong>
                </p>
              </div>

              <div className="rdv-detail-section">
                <h4>✂️ Service</h4>
                <p>
                  <strong>{selectedRdv.service_nom}</strong>
                </p>
                <p>⏱️ Durée : {selectedRdv.service_duree} min</p>
                <p>💰 Prix : {selectedRdv.service_prix}XOF</p>
              </div>

              {selectedRdv.notes && (
                <div className="rdv-detail-section">
                  <h4>📝 Notes</h4>
                  <p>{selectedRdv.notes}</p>
                </div>
              )}

              <div className="rdv-detail-section">
                <h4>📊 Statut</h4>
                <span
                  className={`status-badge status-${selectedRdv.statut.replace(
                    "_",
                    "-"
                  )}`}
                >
                  {selectedRdv.statut.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => openContactModal(selectedRdv)}
              >
                💬 Contacter le client
              </button>

              {selectedRdv.statut === "confirmé" && (
                <button
                  className="btn btn-success"
                  onClick={() => updateStatut(selectedRdv.id, "terminé")}
                >
                  ✓ Marquer terminé
                </button>
              )}

              {selectedRdv.statut === "en_cours" && (
                <button
                  className="btn btn-success"
                  onClick={() => updateStatut(selectedRdv.id, "terminé")}
                >
                  ✓ Terminer
                </button>
              )}

              <button
                className="btn btn-danger"
                onClick={() => {
                  if (confirm("Annuler ce rendez-vous ?")) {
                    updateStatut(selectedRdv.id, "annulé");
                  }
                }}
              >
                ✕ Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal contact client */}
      {showContactModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowContactModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                💬 Contacter {selectedRdv.client_prenom}{" "}
                {selectedRdv.client_nom}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowContactModal(false)}
              >
                ×
              </button>
            </div>
            <div className="contact-info">
              <p>
                <strong>
                  Contact via :{" "}
                  {selectedRdv.moyen_confirmation === "sms"
                    ? "📱 SMS"
                    : selectedRdv.moyen_confirmation === "whatsapp"
                    ? "💬 WhatsApp"
                    : "📧 Email"}
                </strong>
              </p>
              <p>
                {selectedRdv.moyen_confirmation === "email"
                  ? selectedRdv.client_email
                  : selectedRdv.client_telephone}
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea
                className="form-input"
                rows="8"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowContactModal(false)}
              >
                Annuler
              </button>
              <button className="btn btn-primary" onClick={handleContact}>
                {selectedRdv.moyen_confirmation === "sms"
                  ? "📱 Envoyer SMS"
                  : selectedRdv.moyen_confirmation === "whatsapp"
                  ? "💬 Ouvrir WhatsApp"
                  : "📧 Envoyer Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
//       </div>
//     </div>
//   );
// }

function TabHoraires() {
  const [horaires, setHoraires] = useState([]);
  const pwd = localStorage.getItem("adminPassword");
  const jours = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  useEffect(() => {
    fetch(`${API_URL}/admin/horaires`, { headers: { "x-admin-password": pwd } })
      .then((r) => r.json())
      .then(setHoraires);
  }, []);

  const update = async (jour, debut, fin, actif) => {
    await fetch(`${API_URL}/admin/horaires/${jour}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": pwd },
      body: JSON.stringify({
        heure_debut: debut,
        heure_fin: fin,
        actif: actif ? 1 : 0,
      }),
    });
    fetch(`${API_URL}/admin/horaires`, { headers: { "x-admin-password": pwd } })
      .then((r) => r.json())
      .then(setHoraires);
  };

  return (
    <div>
      <h2 className="card-title">Horaires d'ouverture</h2>
      <div className="horaires-list">
        {horaires.map((h) => (
          <div key={h.jour_semaine} className="horaire-card">
            <div className="horaire-jour">
              <strong>{jours[h.jour_semaine]}</strong>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={h.actif === 1}
                  onChange={(e) =>
                    update(
                      h.jour_semaine,
                      h.heure_debut,
                      h.heure_fin,
                      e.target.checked
                    )
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {h.actif === 1 && (
              <div className="horaire-inputs">
                <input
                  type="time"
                  className="form-input"
                  value={h.heure_debut}
                  onChange={(e) =>
                    update(h.jour_semaine, e.target.value, h.heure_fin, true)
                  }
                />
                <span>à</span>
                <input
                  type="time"
                  className="form-input"
                  value={h.heure_fin}
                  onChange={(e) =>
                    update(h.jour_semaine, h.heure_debut, e.target.value, true)
                  }
                />
              </div>
            )}
            {h.actif === 0 && <div className="horaire-ferme">Fermé</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TabServices() {
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    duree: 30,
    prix: 0,
  });
  const pwd = localStorage.getItem("adminPassword");

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = () => {
    fetch(`${API_URL}/admin/services`, { headers: { "x-admin-password": pwd } })
      .then((r) => r.json())
      .then(setServices);
  };

  const toggle = async (id, actif) => {
    const s = services.find((x) => x.id === id);
    await fetch(`${API_URL}/admin/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": pwd },
      body: JSON.stringify({ ...s, actif: actif ? 1 : 0 }),
    });
    loadServices();
  };

  const openModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        nom: service.nom,
        description: service.description,
        duree: service.duree,
        prix: service.prix,
      });
    } else {
      setEditingService(null);
      setFormData({ nom: "", description: "", duree: 30, prix: 0 });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingService) {
      // Update
      await fetch(`${API_URL}/admin/services/${editingService.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": pwd,
        },
        body: JSON.stringify({ ...formData, actif: editingService.actif }),
      });
    } else {
      // Create
      await fetch(`${API_URL}/admin/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": pwd,
        },
        body: JSON.stringify({ ...formData, actif: 1 }),
      });
    }
    setShowModal(false);
    loadServices();
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce service ?")) return;
    await fetch(`${API_URL}/admin/services/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": pwd },
    });
    loadServices();
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 className="card-title">Services</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          ➕ Ajouter un service
        </button>
      </div>

      <div className="services-grid">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-header">
              <h3>{service.nom}</h3>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={service.actif === 1}
                  onChange={(e) => toggle(service.id, e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <p className="service-description">{service.description}</p>
            <div className="service-details">
              <span>⏱️ {service.duree} min</span>
              <span>💰 {service.prix}XOF</span>
            </div>
            <div className="service-actions">
              <button
                className="btn btn-small btn-secondary"
                onClick={() => openModal(service)}
              >
                ✏️ Modifier
              </button>
              <button
                className="btn btn-small btn-danger"
                onClick={() => handleDelete(service.id)}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingService ? "Modifier le service" : "Nouveau service"}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Durée (min) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.duree}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duree: parseInt(e.target.value),
                      })
                    }
                    required
                    min="5"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prix (XOF) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.prix}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prix: parseFloat(e.target.value),
                      })
                    }
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingService ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// return (
//   <div>
//     <h2 className="card-title">Services</h2>
//     <div className="services-grid">
//       {services.map((s) => (
//         <div
//           key={s.id}
//           className={`service-card ${s.actif ? "" : "service-inactive"}`}
//         >
//           <div className="service-header">
//             <div className="service-name">{s.nom}</div>
//             <label className="toggle-switch">
//               <input
//                 type="checkbox"
//                 checked={s.actif === 1}
//                 onChange={(e) => toggle(s.id, e.target.checked)}
//               />
//               <span className="toggle-slider"></span>
//             </label>
//           </div>
//           <div className="service-description">{s.description}</div>
//           <div className="service-info">
//             <div className="service-detail">
//               <span className="service-detail-value">{s.duree}</span>
//               <span className="service-detail-label">min</span>
//             </div>
//             <div className="service-detail">
//               <span className="service-detail-value">{s.prix}XOF</span>
//               <span className="service-detail-label">prix</span>
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   </div>
// );
// }

function TabClients() {
  const [clients, setClients] = useState([]);
  const pwd = localStorage.getItem("adminPassword");

  useEffect(() => {
    fetch(`${API_URL}/admin/clients`, { headers: { "x-admin-password": pwd } })
      .then((r) => r.json())
      .then(setClients);
  }, []);

  return (
    <div>
      <h2 className="card-title">Clients ({clients.length})</h2>
      <div className="rdv-list">
        {clients.map((c) => (
          <div key={c.id} className="card">
            <h3 style={{ fontSize: "18px", fontWeight: "bold" }}>
              {c.prenom} {c.nom}
            </h3>
            <div style={{ color: "#6c757d", fontSize: "14px" }}>
              📞 {c.telephone} {c.email && `• ✉️ ${c.email}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
