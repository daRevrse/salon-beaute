/**
 * SALONHUB - Routes Appointments (Rendez-vous)
 * Gestion complète avec vérification de conflits horaires
 */

const express = require("express");
const router = express.Router();
const { query } = require("../config/database");
const { authMiddleware } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");

// Appliquer middlewares
router.use(authMiddleware);
router.use(tenantMiddleware);

// ==========================================
// HELPER: Vérifier conflit horaire
// ==========================================
const checkTimeConflict = async (
  tenantId,
  staffId,
  date,
  startTime,
  endTime,
  excludeAppointmentId = null
) => {
  let sql = `
    SELECT id FROM appointments 
    WHERE tenant_id = ? 
    AND appointment_date = ?
    AND status IN ('pending', 'confirmed')
  `;

  const params = [tenantId, date];

  // Si staff spécifié, vérifier pour ce staff
  if (staffId) {
    sql += " AND staff_id = ?";
    params.push(staffId);
  }

  // Exclure le RDV en cours de modification
  if (excludeAppointmentId) {
    sql += " AND id != ?";
    params.push(excludeAppointmentId);
  }

  // Vérifier chevauchement
  sql += ` AND (
    (start_time < ? AND end_time > ?) OR
    (start_time < ? AND end_time > ?) OR
    (start_time >= ? AND end_time <= ?)
  )`;
  params.push(endTime, startTime, endTime, startTime, startTime, endTime);

  const conflicts = await query(sql, params);
  return conflicts.length > 0;
};

// ==========================================
// GET - Liste des RDV
// ==========================================
router.get("/", async (req, res) => {
  try {
    const {
      date,
      start_date,
      end_date,
      status,
      client_id,
      staff_id,
      limit = 100,
      offset = 0,
    } = req.query;

    let sql = `
      SELECT 
        a.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.email as client_email,
        c.phone as client_phone,
        s.name as service_name,
        s.duration as service_duration,
        s.price as service_price,
        u.first_name as staff_first_name,
        u.last_name as staff_last_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users u ON a.staff_id = u.id
      WHERE a.tenant_id = ?
    `;
    const params = [req.tenantId];

    // Filtres
    if (date) {
      sql += " AND a.appointment_date = ?";
      params.push(date);
    }

    if (start_date && end_date) {
      sql += " AND a.appointment_date BETWEEN ? AND ?";
      params.push(start_date, end_date);
    }

    if (status) {
      sql += " AND a.status = ?";
      params.push(status);
    }

    if (client_id) {
      sql += " AND a.client_id = ?";
      params.push(client_id);
    }

    if (staff_id) {
      sql += " AND a.staff_id = ?";
      params.push(staff_id);
    }

    sql +=
      " ORDER BY a.appointment_date DESC, a.start_time DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const appointments = await query(sql, params);

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Erreur récupération RDV:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// GET - RDV du jour (vue planning)
// ==========================================
router.get("/today", async (req, res) => {
  try {
    const appointments = await query(
      `SELECT 
        a.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.phone as client_phone,
        s.name as service_name,
        s.duration as service_duration,
        u.first_name as staff_first_name,
        u.last_name as staff_last_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users u ON a.staff_id = u.id
      WHERE a.tenant_id = ? 
      AND a.appointment_date = CURDATE()
      AND a.status IN ('pending', 'confirmed')
      ORDER BY a.start_time`,
      [req.tenantId]
    );

    res.json({
      success: true,
      data: appointments,
      date: new Date().toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Erreur RDV du jour:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// GET - Un RDV par ID
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [appointment] = await query(
      `SELECT 
        a.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.email as client_email,
        c.phone as client_phone,
        s.name as service_name,
        s.duration as service_duration,
        s.price as service_price,
        u.first_name as staff_first_name,
        u.last_name as staff_last_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users u ON a.staff_id = u.id
      WHERE a.id = ? AND a.tenant_id = ?`,
      [id, req.tenantId]
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Rendez-vous introuvable",
      });
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Erreur récupération RDV:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// POST - Créer un RDV
// ==========================================
router.post("/", async (req, res) => {
  try {
    const {
      client_id,
      service_id,
      staff_id,
      appointment_date,
      start_time,
      end_time,
      notes,
      client_notes,
      booked_by,
      booking_source,
    } = req.body;

    // Validation
    if (
      !client_id ||
      !service_id ||
      !appointment_date ||
      !start_time ||
      !end_time
    ) {
      return res.status(400).json({
        success: false,
        error: "Client, service, date et horaires obligatoires",
      });
    }

    // Vérifier que le client existe
    const [client] = await query(
      "SELECT id FROM clients WHERE id = ? AND tenant_id = ?",
      [client_id, req.tenantId]
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        error: "Client introuvable",
      });
    }

    // Vérifier que le service existe
    const [service] = await query(
      "SELECT id, is_active FROM services WHERE id = ? AND tenant_id = ?",
      [service_id, req.tenantId]
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Service introuvable",
      });
    }

    if (!service.is_active) {
      return res.status(400).json({
        success: false,
        error: "Ce service n'est plus disponible",
      });
    }

    // Vérifier que le staff existe (si spécifié)
    if (staff_id) {
      const [staff] = await query(
        "SELECT id FROM users WHERE id = ? AND tenant_id = ? AND is_active = TRUE",
        [staff_id, req.tenantId]
      );

      if (!staff) {
        return res.status(404).json({
          success: false,
          error: "Employé introuvable ou inactif",
        });
      }
    }

    // Vérifier conflit horaire
    const hasConflict = await checkTimeConflict(
      req.tenantId,
      staff_id,
      appointment_date,
      start_time,
      end_time
    );

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        error: "Conflit horaire",
        message: "Un rendez-vous existe déjà sur ce créneau",
      });
    }

    // Insertion
    const result = await query(
      `INSERT INTO appointments (
        tenant_id, client_id, service_id, staff_id,
        appointment_date, start_time, end_time,
        status, notes, client_notes, booked_by, booking_source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        req.tenantId,
        client_id,
        service_id,
        staff_id || null,
        appointment_date,
        start_time,
        end_time,
        notes || null,
        client_notes || null,
        booked_by || "admin",
        booking_source || "admin",
      ]
    );

    res.status(201).json({
      success: true,
      message: "Rendez-vous créé avec succès",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error("Erreur création RDV:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// PUT - Modifier un RDV
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_id,
      service_id,
      staff_id,
      appointment_date,
      start_time,
      end_time,
      notes,
      client_notes,
    } = req.body;

    // Vérifier existence
    const [existing] = await query(
      "SELECT * FROM appointments WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Rendez-vous introuvable",
      });
    }

    // Empêcher modification si RDV passé et complété
    if (
      existing.status === "completed" &&
      existing.appointment_date < new Date().toISOString().split("T")[0]
    ) {
      return res.status(400).json({
        success: false,
        error: "Impossible de modifier un rendez-vous complété",
      });
    }

    // Vérifier conflit horaire (si horaire changé)
    if (appointment_date || start_time || end_time || staff_id !== undefined) {
      const hasConflict = await checkTimeConflict(
        req.tenantId,
        staff_id !== undefined ? staff_id : existing.staff_id,
        appointment_date || existing.appointment_date,
        start_time || existing.start_time,
        end_time || existing.end_time,
        id // Exclure ce RDV de la vérification
      );

      if (hasConflict) {
        return res.status(409).json({
          success: false,
          error: "Conflit horaire",
          message: "Un autre rendez-vous existe déjà sur ce créneau",
        });
      }
    }

    // Mise à jour
    await query(
      `UPDATE appointments SET
        client_id = ?,
        service_id = ?,
        staff_id = ?,
        appointment_date = ?,
        start_time = ?,
        end_time = ?,
        notes = ?,
        client_notes = ?
      WHERE id = ? AND tenant_id = ?`,
      [
        client_id || existing.client_id,
        service_id || existing.service_id,
        staff_id !== undefined ? staff_id : existing.staff_id,
        appointment_date || existing.appointment_date,
        start_time || existing.start_time,
        end_time || existing.end_time,
        notes !== undefined ? notes : existing.notes,
        client_notes !== undefined ? client_notes : existing.client_notes,
        id,
        req.tenantId,
      ]
    );

    res.json({
      success: true,
      message: "Rendez-vous modifié avec succès",
    });
  } catch (error) {
    console.error("Erreur modification RDV:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// PATCH - Changer statut
// ==========================================
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellation_reason } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "cancelled",
      "completed",
      "no_show",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Statut invalide",
      });
    }

    const [appointment] = await query(
      "SELECT * FROM appointments WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Rendez-vous introuvable",
      });
    }

    // Préparer la requête
    let updateSql = "UPDATE appointments SET status = ?";
    const params = [status];

    if (status === "cancelled") {
      updateSql += ", cancelled_at = NOW(), cancellation_reason = ?";
      params.push(cancellation_reason || null);
    }

    updateSql += " WHERE id = ? AND tenant_id = ?";
    params.push(id, req.tenantId);

    await query(updateSql, params);

    res.json({
      success: true,
      message: `Rendez-vous ${
        status === "confirmed"
          ? "confirmé"
          : status === "cancelled"
          ? "annulé"
          : "mis à jour"
      }`,
    });
  } catch (error) {
    console.error("Erreur changement statut:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// DELETE - Supprimer un RDV
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      "DELETE FROM appointments WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Rendez-vous introuvable",
      });
    }

    res.json({
      success: true,
      message: "Rendez-vous supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression RDV:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// GET - Créneaux disponibles
// ==========================================
router.get("/availability/slots", async (req, res) => {
  try {
    const { date, service_id, staff_id } = req.query;

    if (!date || !service_id) {
      return res.status(400).json({
        success: false,
        error: "Date et service_id obligatoires",
      });
    }

    // Récupérer durée du service
    const [service] = await query(
      "SELECT duration FROM services WHERE id = ? AND tenant_id = ?",
      [service_id, req.tenantId]
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Service introuvable",
      });
    }

    // RDV existants ce jour
    let sql = `SELECT start_time, end_time FROM appointments 
               WHERE tenant_id = ? AND appointment_date = ? 
               AND status IN ('pending', 'confirmed')`;
    const params = [req.tenantId, date];

    if (staff_id) {
      sql += " AND staff_id = ?";
      params.push(staff_id);
    }

    sql += " ORDER BY start_time";

    const bookedSlots = await query(sql, params);

    // TODO: Implémenter génération créneaux basée sur business_hours
    // Pour l'instant, retourner les slots occupés

    res.json({
      success: true,
      data: {
        date,
        service_duration: service.duration,
        booked_slots: bookedSlots,
      },
    });
  } catch (error) {
    console.error("Erreur créneaux disponibles:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// POST - Envoyer une confirmation de RDV
// ==========================================
router.post("/:id/send-confirmation", async (req, res) => {
  try {
    const { id } = req.params;
    const { send_via } = req.body; // 'email', 'whatsapp', ou 'both'

    // Validation
    if (!send_via || !['email', 'whatsapp', 'both'].includes(send_via)) {
      return res.status(400).json({
        success: false,
        error: "send_via doit être: email, whatsapp ou both"
      });
    }

    // Récupérer le RDV avec toutes les infos
    const [appointment] = await query(
      `SELECT
        a.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.email as client_email,
        c.phone as client_phone,
        s.name as service_name,
        s.duration as service_duration,
        s.price as service_price,
        u.first_name as staff_first_name,
        u.last_name as staff_last_name,
        t.name as salon_name,
        t.phone as salon_phone,
        t.email as salon_email
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      JOIN tenants t ON a.tenant_id = t.id
      LEFT JOIN users u ON a.staff_id = u.id
      WHERE a.id = ? AND a.tenant_id = ?`,
      [id, req.tenantId]
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Rendez-vous introuvable"
      });
    }

    const emailService = require("../services/emailService");

    // Préparer les données de la confirmation
    const confirmationData = {
      clientName: `${appointment.client_first_name} ${appointment.client_last_name}`,
      salonName: appointment.salon_name,
      serviceName: appointment.service_name,
      date: new Date(appointment.appointment_date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: appointment.start_time.substring(0, 5),
      staffName: appointment.staff_first_name ?
        `${appointment.staff_first_name} ${appointment.staff_last_name}` :
        "Un membre de notre équipe",
      duration: appointment.service_duration,
      salonPhone: appointment.salon_phone
    };

    let emailSent = false;
    let whatsappSent = false;

    // Envoyer par email
    if (send_via === 'email' || send_via === 'both') {
      if (!appointment.client_email) {
        return res.status(400).json({
          success: false,
          error: "Le client n'a pas d'adresse email"
        });
      }

      try {
        await emailService.sendEmail({
          to: appointment.client_email,
          subject: `Confirmation de rendez-vous - ${confirmationData.salonName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Confirmation de rendez-vous</h2>

              <p>Bonjour <strong>${confirmationData.clientName}</strong>,</p>

              <p>Votre rendez-vous a bien été confirmé :</p>

              <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Service :</strong> ${confirmationData.serviceName}</p>
                <p style="margin: 5px 0;"><strong>Date :</strong> ${confirmationData.date}</p>
                <p style="margin: 5px 0;"><strong>Heure :</strong> ${confirmationData.time}</p>
                <p style="margin: 5px 0;"><strong>Durée :</strong> ${confirmationData.duration} minutes</p>
                <p style="margin: 5px 0;"><strong>Avec :</strong> ${confirmationData.staffName}</p>
              </div>

              <p>Nous vous attendons avec plaisir !</p>

              <p>Pour toute question, contactez-nous au ${confirmationData.salonPhone}</p>

              <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
                ${confirmationData.salonName}
              </p>
            </div>
          `
        });
        emailSent = true;
      } catch (error) {
        console.error("Erreur envoi email confirmation:", error);
      }
    }

    // Envoyer par WhatsApp (simulation pour l'instant)
    if (send_via === 'whatsapp' || send_via === 'both') {
      if (!appointment.client_phone) {
        return res.status(400).json({
          success: false,
          error: "Le client n'a pas de numéro de téléphone"
        });
      }

      // Message WhatsApp formaté
      const whatsappMessage = `
🎉 *Confirmation de rendez-vous*

Bonjour ${confirmationData.clientName},

Votre rendez-vous est confirmé :

📋 *Service :* ${confirmationData.serviceName}
📅 *Date :* ${confirmationData.date}
🕐 *Heure :* ${confirmationData.time}
⏱️ *Durée :* ${confirmationData.duration} min
👤 *Avec :* ${confirmationData.staffName}

Nous vous attendons avec plaisir ! 😊

📞 ${confirmationData.salonPhone}
*${confirmationData.salonName}*
      `.trim();

      console.log(`📱 [WHATSAPP] To: ${appointment.client_phone}`);
      console.log(whatsappMessage);

      // TODO: Intégrer l'API WhatsApp Business (Twilio, etc.)
      whatsappSent = true; // Simulation
    }

    // Enregistrer la notification dans la DB
    await query(
      `INSERT INTO client_notifications (
        tenant_id, client_id, appointment_id, type, subject, message, send_via, status, sent_by, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        appointment.client_id,
        appointment.id,
        'appointment_confirmation',
        'Confirmation de rendez-vous',
        `Rendez-vous confirmé le ${confirmationData.date} à ${confirmationData.time}`,
        send_via,
        (emailSent || whatsappSent) ? 'sent' : 'failed',
        req.user.id,
        new Date()
      ]
    );

    res.json({
      success: true,
      message: "Confirmation envoyée avec succès",
      data: {
        emailSent,
        whatsappSent
      }
    });
  } catch (error) {
    console.error("Erreur envoi confirmation:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'envoi de la confirmation"
    });
  }
});

module.exports = router;
