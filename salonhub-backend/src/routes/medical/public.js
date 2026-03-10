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
              u.avatar_url, u.role
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

    // Helper pour parser les horaires quel que soit le format
    const parseDaySchedule = (daySchedule) => {
      if (!daySchedule || daySchedule === "closed") return { closed: true };
      if (typeof daySchedule === "string" && daySchedule.includes("-")) {
        const [open, close] = daySchedule.split("-");
        return { open, close, closed: false };
      }
      return daySchedule; // Suppose déjà au format { open, close, closed }
    };

    const settings = await db.query(
      "SELECT setting_key, setting_value FROM settings WHERE tenant_id = ? AND setting_key IN ('business_hours', 'slot_duration')",
      [tenantId]
    );

    console.log(`[Medical Availability] Debug - Tenant: ${tenantId}, Settings length: ${settings.length}`);

    let businessHours = {
      monday: { open: "09:00", close: "18:00", closed: false },
      tuesday: { open: "09:00", close: "18:00", closed: false },
      wednesday: { open: "09:00", close: "18:00", closed: false },
      thursday: { open: "09:00", close: "18:00", closed: false },
      friday: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "09:00", close: "13:00", closed: false },
      sunday: { closed: true },
    };
    let slotDuration = 30;

    settings.forEach((s) => {
      if (s.setting_key === "business_hours") {
        try {
          businessHours =
            typeof s.setting_value === "string" && (s.setting_value.startsWith("{") || s.setting_value.startsWith("["))
              ? JSON.parse(s.setting_value)
              : s.setting_value;
        } catch (e) {
          console.error("Erreur parsing business_hours:", e);
          businessHours = s.setting_value;
        }
      } else if (s.setting_key === "slot_duration") {
        slotDuration = parseInt(s.setting_value) || 30;
      }
    });

    // Déterminer le jour de la semaine
    const dateObj = new Date(date + "T00:00:00");
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayOfWeek = dayNames[dateObj.getDay()];

    const dayHours = parseDaySchedule(businessHours ? businessHours[dayOfWeek] : null);

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
      SELECT start_time, end_time
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

      console.log(`[Medical Availability] Loop - current: ${currentMinutes}, end: ${endMinutes}, duration: ${duration}, slotDuration: ${slotDuration}`);
      
      while (currentMinutes + duration <= endMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const minutes = currentMinutes % 60;
        const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

        // Vérifier si le créneau n'est pas déjà pris
        const slotEndMinutes = currentMinutes + duration;
        const isAvailable = !existingAppointments.some((apt) => {
          if (!apt.start_time || !apt.end_time) return false;
          
          const [startH, startM] = apt.start_time.split(":").map(Number);
          const [endH, endM] = apt.end_time.split(":").map(Number);
          
          const aptStartMinutes = startH * 60 + startM;
          const aptEndMinutes = endH * 60 + endM;

          // Vérifier le chevauchement
          return !(slotEndMinutes <= aptStartMinutes || currentMinutes >= aptEndMinutes);
        });

        if (isAvailable) {
          slots.push(timeStr);
        }

        currentMinutes += slotDuration;
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
      WHERE tenant_id = ? AND appointment_date = ? AND start_time = ?
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
      // Mettre à jour les infos (source unique)
      await db.query(
        `UPDATE clients SET first_name = ?, last_name = ?, phone = ?, date_of_birth = COALESCE(?, date_of_birth) WHERE id = ?`,
        [first_name, last_name, phone, date_of_birth || null, clientId]
      );
    } else {
      const newClient = await db.query(
        `INSERT INTO clients (tenant_id, first_name, last_name, email, phone, date_of_birth)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tenantId, first_name, last_name, email, phone, date_of_birth || null]
      );
      clientId = newClient.insertId;
    }

    // Gérer le profil médical
    let patientId = null;
    const existingPatients = await db.query(
      "SELECT id FROM medical_patients WHERE tenant_id = ? AND client_id = ?",
      [tenantId, clientId]
    );

    if (existingPatients.length > 0) {
      patientId = existingPatients[0].id;
    } else if (is_first_visit) {
        // Créer un profil médical
        const patient_number = `PAT-${Date.now().toString().substring(7)}-${Math.floor(Math.random() * 1000)}`;
        const patientResult = await db.query(
          `INSERT INTO medical_patients
           (tenant_id, client_id, patient_number)
           VALUES (?, ?, ?)`,
          [tenantId, clientId, patient_number]
        );
        patientId = patientResult.insertId;
    }

    // Générer un code de confirmation
    const confirmationCode = `MED-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Calculer end_time
    const [h, m] = time.split(':').map(Number);
    const endMinutes = h * 60 + m + (service.duration || 30);
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // Créer le rendez-vous
    const result = await db.query(
      `INSERT INTO appointments
       (tenant_id, client_id, patient_id, service_id, staff_id, appointment_date, start_time, end_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)`,
      [
        tenantId,
        clientId,
        patientId,
        service_id,
        practitioner_id || null,
        date,
        time,
        endTime,
        reason ? `Motif: ${reason}${is_first_visit ? " (Première visite)" : ""}` : (is_first_visit ? "Première visite" : null),
      ]
    );

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
