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

module.exports = router;
