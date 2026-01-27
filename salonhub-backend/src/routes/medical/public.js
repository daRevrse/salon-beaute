/**
 * Routes publiques pour le secteur Médical
 * Accessible sans authentification pour les patients
 * MAIS vérifient que l'abonnement du tenant est actif
 */

const express = require("express");
const router = express.Router();
const db = require("../../config/database");
const { checkPublicSubscription } = require("../../middleware/tenant");

/**
 * GET /api/public/medical/:slug/practitioners
 * Récupérer les praticiens du cabinet
 * Vérifie que l'abonnement est actif
 */
router.get("/:slug/practitioners", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;

    // Récupérer le tenant
    const tenants = await db.query(
      "SELECT id FROM tenants WHERE slug = ? AND business_type = 'medical' AND is_active = TRUE",
      [slug]
    );

    if (tenants.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Cabinet médical introuvable",
      });
    }

    const tenantId = tenants[0].id;

    // Récupérer les praticiens (staff actif)
    const practitioners = await db.query(
      `SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) as name,
              u.avatar_url, u.specialty, u.bio
       FROM users u
       WHERE u.tenant_id = ? AND u.is_active = TRUE AND u.role IN ('admin', 'staff')
       ORDER BY u.first_name, u.last_name`,
      [tenantId]
    );

    res.json({
      success: true,
      data: practitioners,
    });
  } catch (error) {
    console.error("Erreur récupération praticiens:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

/**
 * GET /api/public/medical/:slug/availability
 * Récupérer les créneaux disponibles
 * Vérifie que l'abonnement est actif
 */
router.get("/:slug/availability", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;
    const { date, practitioner_id, service_id } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Date requise",
      });
    }

    // Récupérer le tenant
    const tenants = await db.query(
      "SELECT id FROM tenants WHERE slug = ? AND business_type = 'medical' AND is_active = TRUE",
      [slug]
    );

    if (tenants.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Cabinet médical introuvable",
      });
    }

    const tenantId = tenants[0].id;

    // Récupérer les horaires d'ouverture
    const settings = await db.query(
      "SELECT setting_value FROM settings WHERE tenant_id = ? AND setting_key = 'business_hours'",
      [tenantId]
    );

    let businessHours = {
      monday: { open: "09:00", close: "18:00", closed: false },
      tuesday: { open: "09:00", close: "18:00", closed: false },
      wednesday: { open: "09:00", close: "18:00", closed: false },
      thursday: { open: "09:00", close: "18:00", closed: false },
      friday: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "09:00", close: "13:00", closed: false },
      sunday: { closed: true },
    };

    if (settings.length > 0) {
      try {
        businessHours = JSON.parse(settings[0].setting_value);
      } catch (e) {
        console.error("Erreur parsing business_hours:", e);
      }
    }

    // Déterminer le jour de la semaine
    const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const dayHours = businessHours[dayOfWeek];

    if (!dayHours || dayHours.closed) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Récupérer la durée du service si spécifié
    let duration = 30; // Par défaut 30 min
    if (service_id) {
      const services = await db.query(
        "SELECT duration FROM services WHERE id = ? AND tenant_id = ?",
        [service_id, tenantId]
      );
      if (services.length > 0) {
        duration = services[0].duration || 30;
      }
    }

    // Récupérer les RDV existants pour cette date
    let appointmentsQuery = `
      SELECT appointment_time as time, duration
      FROM appointments
      WHERE tenant_id = ? AND appointment_date = ? AND status NOT IN ('cancelled', 'no_show')
    `;
    const appointmentsParams = [tenantId, date];

    if (practitioner_id) {
      appointmentsQuery += " AND staff_id = ?";
      appointmentsParams.push(practitioner_id);
    }

    const existingAppointments = await db.query(appointmentsQuery, appointmentsParams);

    // Générer les créneaux disponibles
    const slots = [];
    const openTime = dayHours.open.split(":").map(Number);
    const closeTime = dayHours.close.split(":").map(Number);

    let currentMinutes = openTime[0] * 60 + openTime[1];
    const endMinutes = closeTime[0] * 60 + closeTime[1];

    while (currentMinutes + duration <= endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

      // Vérifier si le créneau n'est pas déjà pris
      const slotEndMinutes = currentMinutes + duration;
      const isAvailable = !existingAppointments.some((apt) => {
        const aptTime = apt.time.split(":").map(Number);
        const aptMinutes = aptTime[0] * 60 + aptTime[1];
        const aptEndMinutes = aptMinutes + (apt.duration || 30);

        // Vérifier le chevauchement
        return !(slotEndMinutes <= aptMinutes || currentMinutes >= aptEndMinutes);
      });

      if (isAvailable) {
        slots.push(timeStr);
      }

      currentMinutes += 30; // Incrément de 30 min
    }

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error("Erreur récupération disponibilités:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

/**
 * POST /api/public/medical/:slug/appointments
 * Prendre un rendez-vous
 * Vérifie que l'abonnement est actif
 */
router.post("/:slug/appointments", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      service_id,
      practitioner_id,
      date,
      time,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      reason,
      is_first_visit,
    } = req.body;

    // Validation
    if (!service_id || !date || !time || !first_name || !last_name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: "Tous les champs obligatoires doivent être remplis",
      });
    }

    // Récupérer le tenant
    const tenants = await db.query(
      "SELECT id FROM tenants WHERE slug = ? AND business_type = 'medical' AND is_active = TRUE",
      [slug]
    );

    if (tenants.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Cabinet médical introuvable",
      });
    }

    const tenantId = tenants[0].id;

    // Récupérer le service
    const services = await db.query(
      "SELECT id, name, duration, price FROM services WHERE id = ? AND tenant_id = ? AND is_active = TRUE",
      [service_id, tenantId]
    );

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Service introuvable",
      });
    }

    const service = services[0];

    // Vérifier la disponibilité du créneau
    let availabilityQuery = `
      SELECT id FROM appointments
      WHERE tenant_id = ? AND appointment_date = ? AND appointment_time = ?
        AND status NOT IN ('cancelled', 'no_show')
    `;
    const availabilityParams = [tenantId, date, time];

    if (practitioner_id) {
      availabilityQuery += " AND staff_id = ?";
      availabilityParams.push(practitioner_id);
    }

    const existingAppointments = await db.query(availabilityQuery, availabilityParams);

    if (existingAppointments.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Ce créneau n'est plus disponible",
      });
    }

    // Créer ou récupérer le client
    let clientId;
    const existingClients = await db.query(
      "SELECT id FROM clients WHERE tenant_id = ? AND email = ?",
      [tenantId, email]
    );

    if (existingClients.length > 0) {
      clientId = existingClients[0].id;
      // Mettre à jour les infos
      await db.query(
        `UPDATE clients SET first_name = ?, last_name = ?, phone = ? WHERE id = ?`,
        [first_name, last_name, phone, clientId]
      );
    } else {
      const newClient = await db.query(
        `INSERT INTO clients (tenant_id, first_name, last_name, email, phone)
         VALUES (?, ?, ?, ?, ?)`,
        [tenantId, first_name, last_name, email, phone]
      );
      clientId = newClient.insertId;
    }

    // Générer un code de confirmation
    const confirmationCode = `MED-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Créer le rendez-vous
    const result = await db.query(
      `INSERT INTO appointments
       (tenant_id, client_id, service_id, staff_id, appointment_date, appointment_time, duration, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)`,
      [
        tenantId,
        clientId,
        service_id,
        practitioner_id || null,
        date,
        time,
        service.duration,
        reason ? `Motif: ${reason}${is_first_visit ? " (Première visite)" : ""}` : (is_first_visit ? "Première visite" : null),
      ]
    );

    // Créer une entrée dans medical_patients si première visite
    if (is_first_visit) {
      const existingPatient = await db.query(
        "SELECT id FROM medical_patients WHERE tenant_id = ? AND email = ?",
        [tenantId, email]
      );

      if (existingPatient.length === 0) {
        await db.query(
          `INSERT INTO medical_patients
           (tenant_id, first_name, last_name, email, phone, date_of_birth)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [tenantId, first_name, last_name, email, phone, date_of_birth || null]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Rendez-vous confirmé",
      data: {
        appointment_id: result.insertId,
        confirmation_code: confirmationCode,
        appointment: {
          date,
          time,
          service: service.name,
          duration: service.duration,
          price: service.price,
        },
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

module.exports = router;
