/**
 * SALONHUB - Routes Notifications
 * Gestion des notifications clients (email/SMS)
 */

const express = require("express");
const router = express.Router();
const { query } = require("../config/database");
const { authMiddleware } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");

// Appliquer middlewares sur toutes les routes
router.use(authMiddleware);
router.use(tenantMiddleware);

// ==========================================
// POST - Envoyer une notification à un client
// ==========================================
router.post("/send", async (req, res) => {
  try {
    const { client_id, type, subject, message, send_via } = req.body;

    // Validation
    if (!client_id || !message || !send_via) {
      return res.status(400).json({
        success: false,
        error: "client_id, message et send_via sont requis",
      });
    }

    if (!["email", "sms", "both"].includes(send_via)) {
      return res.status(400).json({
        success: false,
        error: "send_via doit être: email, sms ou both",
      });
    }

    // Récupérer le client
    const [client] = await query(
      "SELECT * FROM clients WHERE id = ? AND tenant_id = ?",
      [client_id, req.tenantId]
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        error: "Client introuvable",
      });
    }

    // Vérifier les consentements
    if (send_via === "email" || send_via === "both") {
      if (!client.email) {
        return res.status(400).json({
          success: false,
          error: "Le client n'a pas d'adresse email",
        });
      }
      // Note: Dans une vraie application, vérifier client.email_marketing_consent
    }

    if (send_via === "sms" || send_via === "both") {
      if (!client.phone) {
        return res.status(400).json({
          success: false,
          error: "Le client n'a pas de numéro de téléphone",
        });
      }
      // Note: Dans une vraie application, vérifier client.sms_marketing_consent
    }

    // ===== SIMULATION =====
    // Dans une vraie application, intégrer :
    // - SendGrid/Mailgun pour les emails
    // - Twilio/Vonage pour les SMS

    console.log("=== NOTIFICATION SIMULATION ===");
    console.log(`Tenant: ${req.tenantId}`);
    console.log(`Client: ${client.first_name} ${client.last_name}`);
    console.log(`Type: ${type || "manual"}`);
    console.log(`Send via: ${send_via}`);

    if (send_via === "email" || send_via === "both") {
      console.log(`Email to: ${client.email}`);
      console.log(`Subject: ${subject || "Message de votre salon"}`);
      console.log(`Message: ${message}`);
    }

    if (send_via === "sms" || send_via === "both") {
      console.log(`SMS to: ${client.phone}`);
      console.log(`Message: ${message}`);
    }

    console.log("=================================");

    // Enregistrer dans la base (optionnel - pour historique)
    await query(
      `INSERT INTO client_notifications (
        tenant_id, client_id, type, subject, message, send_via, status, sent_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        client_id,
        type || "manual",
        subject || null,
        message,
        send_via,
        "sent", // Dans une vraie app: 'pending', puis 'sent' ou 'failed'
        req.user.id,
      ]
    );

    res.json({
      success: true,
      message: "Notification envoyée avec succès (simulation)",
      data: {
        client_name: `${client.first_name} ${client.last_name}`,
        sent_via: send_via,
        simulation: true,
      },
    });
  } catch (error) {
    console.error("Erreur envoi notification:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// POST - Envoyer notification de rappel RDV automatique
// ==========================================
router.post("/appointment-reminder", async (req, res) => {
  try {
    const { appointment_id } = req.body;

    if (!appointment_id) {
      return res.status(400).json({
        success: false,
        error: "appointment_id requis",
      });
    }

    // Récupérer le RDV avec infos client et service
    const [appointment] = await query(
      `SELECT
        a.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.email as client_email,
        c.phone as client_phone,
        c.email_marketing_consent,
        c.sms_marketing_consent,
        s.name as service_name,
        s.duration as service_duration
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      WHERE a.id = ? AND a.tenant_id = ?`,
      [appointment_id, req.tenantId]
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Rendez-vous introuvable",
      });
    }

    // Générer le message de rappel
    const date = new Date(appointment.appointment_date).toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const message = `Bonjour ${appointment.client_first_name},\n\nNous vous rappelons votre rendez-vous ${appointment.service_name} prévu le ${date} à ${appointment.start_time}.\n\nÀ bientôt !`;

    // Envoyer selon les consentements
    let send_via = [];
    if (appointment.client_email && appointment.email_marketing_consent) {
      send_via.push("email");
    }
    if (appointment.client_phone && appointment.sms_marketing_consent) {
      send_via.push("sms");
    }

    if (send_via.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "Le client n'a pas donné son consentement pour les notifications",
      });
    }

    // SIMULATION
    console.log("=== RAPPEL RDV AUTOMATIQUE ===");
    console.log(`RDV ID: ${appointment_id}`);
    console.log(`Client: ${appointment.client_first_name} ${appointment.client_last_name}`);
    console.log(`Service: ${appointment.service_name}`);
    console.log(`Date: ${date} à ${appointment.start_time}`);
    console.log(`Send via: ${send_via.join(", ")}`);
    console.log(`Message: ${message}`);
    console.log("================================");

    // Enregistrer
    await query(
      `INSERT INTO client_notifications (
        tenant_id, client_id, appointment_id, type, message, send_via, status, sent_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        appointment.client_id,
        appointment_id,
        "appointment_reminder",
        message,
        send_via.join(","),
        "sent",
        req.user.id,
      ]
    );

    res.json({
      success: true,
      message: "Rappel de rendez-vous envoyé (simulation)",
      data: {
        appointment_id,
        client_name: `${appointment.client_first_name} ${appointment.client_last_name}`,
        sent_via: send_via,
      },
    });
  } catch (error) {
    console.error("Erreur rappel RDV:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// GET - Historique notifications d'un client
// ==========================================
router.get("/client/:client_id", async (req, res) => {
  try {
    const { client_id } = req.params;

    const notifications = await query(
      `SELECT
        n.*,
        u.first_name as sender_first_name,
        u.last_name as sender_last_name
      FROM client_notifications n
      LEFT JOIN users u ON n.sent_by = u.id
      WHERE n.client_id = ? AND n.tenant_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50`,
      [client_id, req.tenantId]
    );

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Erreur récupération notifications:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

module.exports = router;
