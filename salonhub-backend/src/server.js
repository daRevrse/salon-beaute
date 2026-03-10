/**
 * SALONHUB - Serveur Backend Principal
 * Express API avec isolation multi-tenant
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const { testConnection } = require("./config/database");
const scheduler = require("./services/scheduler");

// Initialiser Express
const app = express();

// Créer le serveur HTTP (wrapper)
const server = http.createServer(app);

// Initialiser Socket.io
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:8081",
  "http://192.168.1.77:8081",
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow mobile apps (no origin) and listed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins for socket (mobile needs it)
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Gestion des connexions Socket.io
io.on("connection", (socket) => {
  console.log(`⚡ Client connecté: ${socket.id}`);

  // Rejoindre la "room" du salon spécifique (pour isolation multi-tenant)
  socket.on("join_tenant", (tenantId) => {
    if (tenantId) {
      socket.join(`tenant_${tenantId}`);
      console.log(`🔌 Socket ${socket.id} a rejoint le salon ${tenantId}`);

      // Confirmer au client qu'il a bien rejoint la room
      socket.emit("joined", {
        tenantId,
        socketId: socket.id,
        message: `Vous avez rejoint le salon ${tenantId}`,
      });
    } else {
      console.warn(`⚠️  Socket ${socket.id} a essayé de rejoindre sans tenantId`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client déconnecté: ${socket.id}`);
  });
});

// ==========================================
// MIDDLEWARES GLOBAUX
// ==========================================

app.use((req, res, next) => {
  // <--- AJOUT 5
  req.io = io;
  next();
});

// CORS - Autoriser frontend + landing page
const corsAllowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.LANDING_URL || "http://localhost:8080",
  "http://localhost:8081",
  "http://192.168.1.77:8081",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin || corsAllowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Parser JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (uploads)
app.use("/uploads", express.static("public/uploads"));

// Logger simple (dev)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ==========================================
// ROUTES PUBLIQUES
// ==========================================

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
  });
});

// Root
app.get("/", (req, res) => {
  res.json({
    message: "SalonHub API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      public: {
        salon: "GET /api/public/salon/:slug",
        services: "GET /api/public/salon/:slug/services",
        availability: "GET /api/public/salon/:slug/availability",
        book: "POST /api/public/appointments",
      },
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
        staff: "GET /api/auth/staff",
      },
      clients: "/api/clients",
      services: "/api/services",
      appointments: "/api/appointments",
    },
  });
});

// ==========================================
// ROUTES API
// ==========================================

// Routes auth (PUBLIQUES pour register/login)
app.use("/api/auth/google", require("./routes/google-auth"));
app.use("/api/auth", require("./routes/auth"));

// Routes Stripe (partiellement publiques - webhook)
app.use("/api/stripe", require("./routes/stripe"));

// Routes publiques sectorielles (plus spécifiques - doivent être avant /api/public)
app.use("/api/public/restaurant", require("./routes/restaurant/public"));
app.use("/api/public/training", require("./routes/training/public"));
app.use("/api/public/medical", require("./routes/medical/public"));

// Routes publiques pour le booking (sans authentification)
app.use("/api/public", require("./routes/public"));

// Routes currency (publiques - taux de change)
app.use("/api/currency", require("./routes/currency"));

// Routes Uploads (protégées)
app.use("/api/uploads", require("./routes/uploads")); // <-- NOUVEAU

// Routes Password Reset (publiques - réinitialisation mot de passe)
app.use("/api/password", require("./routes/password-reset"));

// Routes Push Notifications (partiellement publiques)
app.use("/api/push", require("./routes/push"));

// Routes protégées (nécessitent authentification)
app.use("/api/clients", require("./routes/clients"));
app.use("/api/services", require("./routes/services"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/promotions", require("./routes/promotions"));
app.use("/api/scheduler", require("./routes/scheduler"));

// Routes API Keys (Developer/Custom plans)
app.use("/api/api-keys", require("./routes/api-keys"));

// Routes Webhooks (Developer/Custom plans)
app.use("/api/webhooks", require("./routes/webhooks"));

// Routes Salons (Multi-Salon)
app.use("/api/salons", require("./routes/salons"));

// Routes Restaurant (multi-secteur)
app.use("/api/restaurant", require("./routes/restaurant"));

// Routes Training (multi-secteur)
app.use("/api/training", require("./routes/training"));

// Routes Medical (multi-secteur)
app.use("/api/medical", require("./routes/medical"));

// Routes SuperAdmin (système SaaS)
// IMPORTANT: Plus spécifiques d'abord, générales ensuite
app.use("/api/admin/billing", require("./routes/billing"));
app.use("/api/admin/impersonate", require("./routes/impersonation"));
app.use("/api/admin/analytics", require("./routes/analytics-advanced"));
app.use("/api/admin/alerts", require("./routes/alerts"));
app.use("/api/admin/system", require("./routes/system-health"));
app.use("/api/admin", require("./routes/admin"));

// ==========================================
// GESTION ERREURS
// ==========================================

// Route non trouvée
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route non trouvée",
    path: req.path,
  });
});

// Handler d'erreur global
app.use((err, req, res, next) => {
  console.error("❌ Erreur serveur:", err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Erreur serveur interne",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ==========================================
// DÉMARRAGE SERVEUR
// ==========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test connexion DB
    console.log("🔍 Test de connexion MySQL...");
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error("❌ Impossible de démarrer sans connexion DB");
      process.exit(1);
    }

    // Démarrer le scheduler (Cron Jobs)
    scheduler.start();

    // Démarrer serveur
    server.listen(PORT, () => {
      console.log("");
      console.log("🚀 ================================");
      console.log(`🚀 SalonHub Backend démarré !`);
      console.log(`🚀 URL: http://localhost:${PORT}`);
      console.log(`🚀 Env: ${process.env.NODE_ENV}`);
      console.log("🚀 ================================");
      console.log("");
      console.log("📋 Routes disponibles:");
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log("");
      console.log("   🌐 Routes publiques (Booking):");
      console.log(`   GET  http://localhost:${PORT}/api/public/salon/:slug`);
      console.log(
        `   GET  http://localhost:${PORT}/api/public/salon/:slug/services`
      );
      console.log(
        `   GET  http://localhost:${PORT}/api/public/salon/:slug/availability`
      );
      console.log(`   POST http://localhost:${PORT}/api/public/appointments`);
      console.log("");
      console.log("   🔐 Routes authentification:");
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/me (protégé)`);
      console.log("");
      console.log("   📊 Routes protégées:");
      console.log(`   API  http://localhost:${PORT}/api/clients (protégé)`);
      console.log(`   API  http://localhost:${PORT}/api/services (protégé)`);
      console.log(
        `   API  http://localhost:${PORT}/api/appointments (protégé)`
      );
      console.log("");
    });
  } catch (error) {
    console.error("❌ Erreur démarrage serveur:", error);
    process.exit(1);
  }
};

// Démarrer
startServer();

// Gestion arrêt gracieux
process.on("SIGTERM", () => {
  console.log("👋 Arrêt du serveur...");
  scheduler.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 Arrêt du serveur...");
  scheduler.stop();
  process.exit(0);
});
