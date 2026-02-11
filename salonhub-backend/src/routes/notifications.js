/**
 * SALONHUB - Routes Notifications
 * Gestion des notifications clients (email/SMS)
 */

const express = require("express");
const router = express.Router();
const { query } = require("../config/database");
const { authMiddleware } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");
const emailService = require("../services/emailService");
const whatsappService = require("../services/whatsappService");

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

    // Préparer le statut de notification
    let notificationStatus = "pending";
    let emailSent = false;
    let smsSent = false;

    // Envoyer l'email si demandé
    if (send_via === "email" || send_via === "both") {
      try {
        await emailService.sendEmail({
          to: client.email,
          subject: subject || "Message de votre salon",
          html: `
            <p>Bonjour <strong>${client.first_name} ${client.last_name}</strong>,</p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <p>Cordialement,<br>Votre salon</p>
          `
        });
        emailSent = true;
        console.log(`✓ Email envoyé à ${client.email}`);
      } catch (error) {
        console.error(`❌ Erreur envoi email à ${client.email}:`, error.message);
      }
    }

    // Générer le lien WhatsApp si demandé
    let whatsappLink = null;
    if (send_via === "sms" || send_via === "both") {
      try {
        const result = await whatsappService.sendCustomMessage({
          to: client.phone,
          firstName: client.first_name,
          lastName: client.last_name,
          message: message
        });
        whatsappLink = result.link;
        smsSent = true;
        console.log(`✓ Lien WhatsApp généré pour ${client.phone}`);
      } catch (error) {
        console.error(`❌ Erreur génération lien WhatsApp:`, error.message);
      }
    }

    // Déterminer le statut final
    if (send_via === "email") {
      notificationStatus = emailSent ? "sent" : "failed";
    } else if (send_via === "sms") {
      notificationStatus = smsSent ? "sent" : "failed";
    } else if (send_via === "both") {
      notificationStatus = (emailSent || smsSent) ? "sent" : "failed";
    }

    // Enregistrer dans la base pour historique
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
        notificationStatus,
        req.user.id,
      ]
    );

    res.json({
      success: true,
      message: notificationStatus === "sent"
        ? "Notification envoyée avec succès"
        : "Notification partiellement envoyée",
      data: {
        client_name: `${client.first_name} ${client.last_name}`,
        sent_via: send_via,
        email_sent: emailSent,
        sms_sent: smsSent,
        status: notificationStatus,
        whatsapp_link: whatsappLink, // Retourner le lien WhatsApp
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

    // Récupérer le RDV avec infos client, service et salon
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
        s.duration as service_duration,
        s.price as service_price,
        t.name as salon_name
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      JOIN tenants t ON a.tenant_id = t.id
      WHERE a.id = ? AND a.tenant_id = ?`,
      [appointment_id, req.tenantId]
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Rendez-vous introuvable",
      });
    }

    // Formater la date en français
    const date = new Date(appointment.appointment_date).toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    // Envoyer selon les consentements
    let send_via = [];
    let emailSent = false;
    let smsSent = false;

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

    // Envoyer l'email de rappel si le client a consenti
    if (send_via.includes("email")) {
      try {
        await emailService.sendAppointmentReminder({
          to: appointment.client_email,
          firstName: appointment.client_first_name,
          appointmentDate: date,
          appointmentTime: appointment.start_time,
          serviceName: appointment.service_name,
          salonName: appointment.salon_name
        });
        emailSent = true;
        console.log(`✓ Rappel email envoyé à ${appointment.client_email}`);
      } catch (error) {
        console.error(`❌ Erreur envoi rappel email:`, error.message);
      }
    }

    // Envoyer le WhatsApp/SMS si demandé
    if (send_via.includes("sms")) {
      try {
        await whatsappService.sendAppointmentReminder({
          to: appointment.client_phone,
          firstName: appointment.client_first_name,
          serviceName: appointment.service_name,
          date: date,
          time: appointment.start_time,
          salonName: appointment.salon_name
        });
        smsSent = true;
        console.log(`✓ Rappel WhatsApp envoyé à ${appointment.client_phone}`);
      } catch (error) {
        console.error(`❌ Erreur envoi rappel WhatsApp:`, error.message);
        // En cas d'erreur, on marque quand même comme envoyé si c'est en mode simulation
        if (error.message.includes('simulation')) {
          smsSent = true;
        }
      }
    }

    // Déterminer le statut
    const notificationStatus = (emailSent || smsSent) ? "sent" : "failed";

    // Créer le message texte pour la base de données
    const message = `Rappel: Rendez-vous ${appointment.service_name} le ${date} à ${appointment.start_time}`;

    // Enregistrer dans la base
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
        notificationStatus,
        req.user.id,
      ]
    );

    // Mettre à jour le rendez-vous pour indiquer que le rappel a été envoyé
    if (notificationStatus === "sent") {
      await query(
        `UPDATE appointments SET reminder_sent = TRUE, reminder_sent_at = NOW() WHERE id = ?`,
        [appointment_id]
      );
    }

    res.json({
      success: true,
      message: notificationStatus === "sent"
        ? "Rappel de rendez-vous envoyé avec succès"
        : "Erreur lors de l'envoi du rappel",
      data: {
        appointment_id,
        client_name: `${appointment.client_first_name} ${appointment.client_last_name}`,
        sent_via: send_via,
        email_sent: emailSent,
        sms_sent: smsSent,
        status: notificationStatus,
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

// ==========================================
// ADMIN INBOX - Receive announcements & messages from SuperAdmin
// ==========================================

/**
 * GET /api/notifications/admin-inbox/unread-count
 * Returns unread count for announcements + messages
 */
router.get("/admin-inbox/unread-count", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.id;

    // Récupérer le plan du tenant
    const [tenant] = await query(
      "SELECT subscription_plan FROM tenants WHERE id = ?",
      [tenantId]
    );
    const tenantPlan = tenant?.subscription_plan || "starter";

    let announcementsCount = 0;
    try {
      const unreadAnnouncements = await query(
        `SELECT COUNT(*) as count FROM admin_announcements a
         WHERE a.sent_via IN ('in_app', 'both')
         AND a.sent_at IS NOT NULL
         AND (
           a.target_type = 'all'
           OR (a.target_type = 'plan' AND a.target_plans IS NOT NULL AND JSON_CONTAINS(a.target_plans, ?))
           OR (a.target_type = 'specific' AND a.target_tenant_ids IS NOT NULL AND JSON_CONTAINS(a.target_tenant_ids, CAST(? AS JSON)))
         )
         AND NOT EXISTS (
           SELECT 1 FROM announcement_reads ar
           WHERE ar.announcement_id = a.id AND ar.tenant_id = ? AND ar.user_id = ?
         )`,
        [JSON.stringify(tenantPlan), tenantId, tenantId, userId]
      );
      announcementsCount = unreadAnnouncements[0]?.count || 0;
    } catch (err) {
      // announcement_reads table may not exist yet
      console.error("Erreur count announcements:", err.message);
    }

    let messagesCount = 0;
    try {
      const unreadMessages = await query(
        `SELECT COUNT(*) as count FROM admin_messages
         WHERE tenant_id = ? AND is_read = 0`,
        [tenantId]
      );
      messagesCount = unreadMessages[0]?.count || 0;
    } catch (err) {
      console.error("Erreur count messages:", err.message);
    }

    res.json({
      success: true,
      data: {
        announcements: announcementsCount,
        messages: messagesCount,
        total: announcementsCount + messagesCount,
      },
    });
  } catch (error) {
    console.error("Erreur GET /admin-inbox/unread-count:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

/**
 * GET /api/notifications/admin-inbox
 * Returns unified list of announcements + messages for this tenant
 */
router.get("/admin-inbox", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.id;
    const { limit = 30, offset = 0 } = req.query;

    // Récupérer le plan du tenant
    const [tenant] = await query(
      "SELECT subscription_plan FROM tenants WHERE id = ?",
      [tenantId]
    );
    const tenantPlan = tenant?.subscription_plan || "starter";

    // Fetch announcements targeted at this tenant
    let announcements = [];
    try {
      announcements = await query(
        `SELECT
           a.id, 'announcement' as type, a.title, a.content, a.created_at,
           IF(ar.id IS NOT NULL, TRUE, FALSE) as is_read,
           sa.first_name as admin_first_name, sa.last_name as admin_last_name
         FROM admin_announcements a
         JOIN super_admins sa ON a.super_admin_id = sa.id
         LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.tenant_id = ? AND ar.user_id = ?
         WHERE a.sent_via IN ('in_app', 'both')
         AND a.sent_at IS NOT NULL
         AND (
           a.target_type = 'all'
           OR (a.target_type = 'plan' AND a.target_plans IS NOT NULL AND JSON_CONTAINS(a.target_plans, ?))
           OR (a.target_type = 'specific' AND a.target_tenant_ids IS NOT NULL AND JSON_CONTAINS(a.target_tenant_ids, CAST(? AS JSON)))
         )
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?`,
        [tenantId, userId, JSON.stringify(tenantPlan), tenantId, parseInt(limit), parseInt(offset)]
      );
    } catch (err) {
      // announcement_reads table may not exist yet
      console.error("Erreur fetch announcements:", err.message);
    }

    // Fetch direct messages for this tenant
    let messages = [];
    try {
      messages = await query(
        `SELECT
           m.id, 'message' as type, m.subject as title, m.content, m.created_at,
           m.is_read,
           sa.first_name as admin_first_name, sa.last_name as admin_last_name
         FROM admin_messages m
         JOIN super_admins sa ON m.super_admin_id = sa.id
         WHERE m.tenant_id = ?
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [tenantId, parseInt(limit), parseInt(offset)]
      );
    } catch (err) {
      console.error("Erreur fetch messages:", err.message);
    }

    // Merge and sort by date
    const combined = [...announcements, ...messages]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: combined,
    });
  } catch (error) {
    console.error("Erreur GET /admin-inbox:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

/**
 * PUT /api/notifications/admin-inbox/announcements/:id/read
 * Mark an announcement as read for the current user/tenant
 */
router.put("/admin-inbox/announcements/:id/read", async (req, res) => {
  try {
    await query(
      `INSERT INTO announcement_reads (announcement_id, tenant_id, user_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE read_at = NOW()`,
      [req.params.id, req.tenantId, req.user.id]
    );

    res.json({ success: true, message: "Marqué comme lu" });
  } catch (error) {
    console.error("Erreur PUT /announcements/:id/read:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

/**
 * PUT /api/notifications/admin-inbox/messages/:id/read
 * Mark a message as read
 */
router.put("/admin-inbox/messages/:id/read", async (req, res) => {
  try {
    await query(
      `UPDATE admin_messages SET is_read = 1, read_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      [req.params.id, req.tenantId]
    );

    res.json({ success: true, message: "Marqué comme lu" });
  } catch (error) {
    console.error("Erreur PUT /messages/:id/read:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

module.exports = router;
