/**
 * Routes publiques pour le système de réservation
 * Ces routes sont accessibles sans authentification
 * MAIS vérifient que l'abonnement du tenant est actif
 */

const express = require("express");
const router = express.Router();
const db = require("../config/database");
const emailService = require("../services/emailService");
const { checkPublicSubscription } = require("../middleware/tenant");

// ===== RECHERCHE PUBLIQUE =====

/**
 * GET /api/public/search?q=...&type=...&limit=...&offset=...
 * Recherche publique de salons/établissements
 * Pas de vérification d'abonnement côté chercheur
 */
router.get("/search", async (req, res) => {
  try {
    const { q, type, limit = 20, offset = 0 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Le terme de recherche doit contenir au moins 2 caractères",
      });
    }

    const searchTerm = `%${q.trim()}%`;
    const params = [searchTerm, searchTerm, searchTerm];

    let query = `
      SELECT t.name, t.slug, t.city, t.business_type, t.logo_url, t.slogan
      FROM tenants t
      WHERE t.is_active = TRUE
        AND t.subscription_status IN ('active', 'trial')
        AND (t.name LIKE ? OR t.city LIKE ? OR t.business_type LIKE ?)
    `;

    if (type) {
      query += ` AND t.business_type = ?`;
      params.push(type);
    }

    query += ` ORDER BY t.name ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const results = await db.query(query, params);

    // Compter le total
    let countQuery = `
      SELECT COUNT(*) as total FROM tenants t
      WHERE t.is_active = TRUE
        AND t.subscription_status IN ('active', 'trial')
        AND (t.name LIKE ? OR t.city LIKE ? OR t.business_type LIKE ?)
    `;
    const countParams = [searchTerm, searchTerm, searchTerm];
    if (type) {
      countQuery += ` AND t.business_type = ?`;
      countParams.push(type);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: results,
      query: q,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + results.length < total,
      },
    });
  } catch (error) {
    console.error("Erreur recherche publique:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// ===== ROUTES PUBLIQUES (BOOKING CLIENT) =====

/**
 * GET /api/public/tenant/:slug
 * Récupérer les infos de base d'un tenant (avec business_type)
 * Utilisé par PublicRouter pour rediriger vers la bonne page
 * Vérifie que l'abonnement est actif
 */
router.get("/tenant/:slug", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;

    const tenant = await db.query(
      `SELECT id, name, slug, phone, email, address, city, postal_code,
              logo_url, banner_url, slogan, currency, business_type
       FROM tenants
       WHERE slug = ? AND is_active = TRUE`,
      [slug]
    );

    if (tenant.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Établissement non trouvé ou inactif"
      });
    }

    res.json({
      success: true,
      data: tenant[0]
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du tenant:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

/**
 * GET /api/public/services/:slug
 * Récupérer les services d'un tenant par son slug (route générique)
 * Vérifie que l'abonnement est actif
 */
router.get("/services/:slug", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;

    const tenant = await db.query(
      "SELECT id FROM tenants WHERE slug = ? AND is_active = TRUE",
      [slug]
    );

    if (tenant.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Établissement non trouvé"
      });
    }

    const tenantId = tenant[0].id;

    const services = await db.query(
      `SELECT id, name, description, duration, price, category, image_url
       FROM services
       WHERE tenant_id = ? AND is_active = TRUE AND available_for_online_booking = TRUE
       ORDER BY category, name`,
      [tenantId]
    );

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des services:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

/**
 * GET /api/public/salon/:slug
 * Obtenir les informations d'un salon par son slug
 * Vérifie que l'abonnement est actif
 */
router.get("/salon/:slug", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;

    const tenant = await db.query(
      `SELECT id, name, slug, phone, address, city, postal_code,
              subscription_status, logo_url, banner_url, slogan, currency
       FROM tenants
       WHERE slug = ? `,
      [slug]
    );

    if (tenant.length === 0) {
      return res.status(404).json({ error: "Salon non trouvé ou inactif" });
    }

    // Récupérer les business_hours depuis les settings
    const settings = await db.query(
      `SELECT setting_value FROM settings
       WHERE tenant_id = ? AND setting_key = 'business_hours'`,
      [tenant[0].id]
    );

    const salonData = { ...tenant[0] };

    // Ajouter business_hours si disponible
    if (settings.length > 0) {
      try {
        salonData.business_hours = JSON.parse(settings[0].setting_value);
      } catch (e) {
        console.error("Erreur parsing business_hours:", e);
        salonData.business_hours = null;
      }
    }

    res.json(salonData);
  } catch (error) {
    console.error("Erreur lors de la récupération du salon:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /api/public/salon/:slug/services
 * Obtenir tous les services actifs d'un salon
 * Vérifie que l'abonnement est actif
 */
router.get("/salon/:slug/services", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;

    // Récupérer le tenant_id à partir du slug
    const tenant = await db.query(
      "SELECT id FROM tenants WHERE slug = ? ",
      [slug]
    );

    if (tenant.length === 0) {
      return res.status(404).json({ error: "Salon non trouvé" });
    }

    const tenantId = tenant[0].id;

    // Récupérer les services actifs et disponibles pour réservation en ligne
    const services = await db.query(
      `SELECT id, name, description, duration, slot_duration, price, category, image_url, gallery
       FROM services
       WHERE tenant_id = ?
         AND is_active = 1
         AND available_for_online_booking = 1
       ORDER BY category, name`,
      [tenantId]
    );

    res.json(services);
  } catch (error) {
    console.error("Erreur lors de la récupération des services:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /api/public/salon/:slug/settings
 * Obtenir les paramètres publics du salon (horaires, etc.)
 * Vérifie que l'abonnement est actif
 */
router.get("/salon/:slug/settings", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;

    const tenant = await db.query(
      "SELECT id FROM tenants WHERE slug = ? ",
      [slug]
    );

    if (tenant.length === 0) {
      return res.status(404).json({ error: "Salon non trouvé" });
    }

    const tenantId = tenant[0].id;

    // Récupérer les paramètres publics (inclut theme_settings pour le style de la page)
    const settings = await db.query(
      `SELECT setting_key, setting_value, setting_type
       FROM settings
       WHERE tenant_id = ?
         AND setting_key IN ('business_hours', 'appointment_buffer', 'slot_duration', 'theme_settings')`,
      [tenantId]
    );

    // Formater les settings en objet
    const formattedSettings = {};
    settings.forEach((setting) => {
      let value = setting.setting_value;

      // Parser selon le type
      if (setting.setting_type === "json") {
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.error("Erreur parsing JSON:", e);
        }
      } else if (setting.setting_type === "number") {
        value = parseFloat(value);
      } else if (setting.setting_type === "boolean") {
        value = value === "true" || value === "1";
      }

      formattedSettings[setting.setting_key] = value;
    });

    // Valeurs par défaut si non configurées
    if (!formattedSettings.business_hours) {
      formattedSettings.business_hours = {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "17:00", closed: false },
        sunday: { open: "00:00", close: "00:00", closed: true },
      };
    }

    if (!formattedSettings.slot_duration) {
      formattedSettings.slot_duration = 30; // 30 minutes par défaut
    }

    if (!formattedSettings.appointment_buffer) {
      formattedSettings.appointment_buffer = 0; // Pas de buffer par défaut
    }

    // Valeurs par défaut pour le thème
    const defaultTheme = {
      primaryColor: "#8B5CF6",
      secondaryColor: "#6366F1",
      fontFamily: "Inter",
      footerBgColor: "#1E293B",
      footerTextColor: "#FFFFFF"
    };
    formattedSettings.theme_settings = {
      ...defaultTheme,
      ...(formattedSettings.theme_settings || {})
    };

    res.json(formattedSettings);
  } catch (error) {
    console.error("Erreur lors de la récupération des paramètres:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /api/public/salon/:slug/availability
 * Obtenir les créneaux disponibles pour un service et une date
 * Query params: service_id, date (YYYY-MM-DD)
 * Vérifie que l'abonnement est actif
 */
router.get("/salon/:slug/availability", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;
    const { service_id, date } = req.query;

    if (!service_id || !date) {
      return res.status(400).json({ error: "service_id et date sont requis" });
    }

    // Récupérer le tenant
    const tenant = await db.query(
      "SELECT id FROM tenants WHERE slug = ? ",
      [slug]
    );

    if (tenant.length === 0) {
      return res.status(404).json({ error: "Salon non trouvé" });
    }

    const tenantId = tenant[0].id;

    // Récupérer le service pour connaître sa durée
    const service = await db.query(
      "SELECT id, duration FROM services WHERE id = ? AND tenant_id = ? AND is_active = 1",
      [service_id, tenantId]
    );

    if (service.length === 0) {
      return res.status(404).json({ error: "Service non trouvé" });
    }

    const serviceDuration = service[0].duration;

    // Récupérer les paramètres du salon
    const settings = await db.query(
      `SELECT setting_key, setting_value, setting_type
       FROM settings
       WHERE tenant_id = ? AND setting_key IN ('business_hours', 'slot_duration')`,
      [tenantId]
    );

    let businessHours = null;
    let slotDuration = 30;

    settings.forEach((setting) => {
      if (setting.setting_key === "business_hours") {
        try {
          businessHours = JSON.parse(setting.setting_value);
        } catch (e) {
          console.error("Erreur parsing business_hours:", e);
        }
      } else if (setting.setting_key === "slot_duration") {
        slotDuration = parseInt(setting.setting_value);
      }
    });

    // Business hours par défaut
    if (!businessHours) {
      businessHours = {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "17:00", closed: false },
        sunday: { open: "00:00", close: "00:00", closed: true },
      };
    }

    // Déterminer le jour de la semaine
    const dateObj = new Date(date + "T00:00:00");
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayName = dayNames[dateObj.getDay()];

    console.log(
      "Debug - businessHours:",
      JSON.stringify(businessHours, null, 2)
    );
    console.log("Debug - dayName:", dayName);

    const daySchedule = businessHours[dayName];

    // Vérifier si le salon est fermé ce jour
    if (!daySchedule || daySchedule.closed) {
      return res.json({ slots: [], message: "Fermé ce jour" });
    }

    // Vérifier que les horaires sont bien définis
    if (!daySchedule.open || !daySchedule.close) {
      return res.json({ slots: [], message: "Horaires non configurés" });
    }

    // Générer tous les créneaux possibles
    const slots = [];
    const [openHour, openMinute] = daySchedule.open.split(":").map(Number);
    const [closeHour, closeMinute] = daySchedule.close.split(":").map(Number);

    let currentMinutes = openHour * 60 + openMinute;
    const endMinutes = closeHour * 60 + closeMinute - serviceDuration;

    while (currentMinutes <= endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;
      const timeStr = `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;
      const datetimeStr = `${date} ${timeStr}:00`;

      slots.push({
        time: timeStr,
        datetime: datetimeStr,
        available: true,
      });

      currentMinutes += slotDuration;
    }

    // Vérifier les créneaux déjà réservés
    const appointments = await db.query(
      `SELECT appointment_date, start_time, end_time
       FROM appointments
       WHERE tenant_id = ?
         AND appointment_date = ?
         AND status NOT IN ('cancelled', 'no_show')`,
      [tenantId, date]
    );

    // Marquer les créneaux non disponibles
    appointments.forEach((apt) => {
      const aptStart = apt.start_time.substring(0, 5); // Format HH:MM
      const aptEnd = apt.end_time.substring(0, 5);

      const [aptStartHour, aptStartMinute] = aptStart.split(":").map(Number);
      const [aptEndHour, aptEndMinute] = aptEnd.split(":").map(Number);

      const aptStartMinutes = aptStartHour * 60 + aptStartMinute;
      const aptEndMinutes = aptEndHour * 60 + aptEndMinute;

      slots.forEach((slot) => {
        const [slotHour, slotMinute] = slot.time.split(":").map(Number);
        const slotStartMinutes = slotHour * 60 + slotMinute;
        const slotEndMinutes = slotStartMinutes + serviceDuration;

        // Vérifier le chevauchement
        if (
          (slotStartMinutes >= aptStartMinutes &&
            slotStartMinutes < aptEndMinutes) ||
          (slotEndMinutes > aptStartMinutes &&
            slotEndMinutes <= aptEndMinutes) ||
          (slotStartMinutes <= aptStartMinutes &&
            slotEndMinutes >= aptEndMinutes)
        ) {
          slot.available = false;
        }
      });
    });

    // Filtrer pour ne retourner que les créneaux disponibles
    const availableSlots = slots.filter((slot) => slot.available);

    res.json({ slots: availableSlots });
  } catch (error) {
    console.error("Erreur lors du calcul des disponibilités:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * POST /api/public/appointments
 * Créer un nouveau rendez-vous (réservation client)
 */
router.post("/appointments", async (req, res) => {
  try {
    const {
      salon_slug,
      first_name,
      last_name,
      phone,
      email,
      service_id,
      appointment_date,
      start_time,
      notes,
      preferred_contact_method,
      promo_code,
      final_amount,
    } = req.body;

    // Validation des champs obligatoires
    if (
      !salon_slug ||
      !first_name ||
      !last_name ||
      !phone ||
      !service_id ||
      !appointment_date ||
      !start_time
    ) {
      return res.status(400).json({
        error: "Tous les champs obligatoires doivent être remplis",
      });
    }

    // Récupérer le tenant
    const tenant = await db.query(
      "SELECT id FROM tenants WHERE slug = ? ",
      [salon_slug]
    );

    if (tenant.length === 0) {
      return res.status(404).json({ error: "Salon non trouvé" });
    }

    const tenantId = tenant[0].id;

    // Récupérer le service
    const service = await db.query(
      "SELECT id, name, duration, price FROM services WHERE id = ? AND tenant_id = ? AND is_active = 1",
      [service_id, tenantId]
    );

    if (service.length === 0) {
      return res.status(404).json({ error: "Service non trouvé ou inactif" });
    }

    const serviceDuration = service[0].duration;

    // Calculer l'heure de fin
    const [startHour, startMinute] = start_time.split(":").map(Number);
    const endMinutes = startHour * 60 + startMinute + serviceDuration;
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;
    const end_time = `${String(endHour).padStart(2, "0")}:${String(
      endMinute
    ).padStart(2, "0")}:00`;

    // Vérifier les conflits horaires
    const conflicts = await db.query(
      `SELECT id FROM appointments
       WHERE tenant_id = ?
         AND appointment_date = ?
         AND status NOT IN ('cancelled', 'no_show')
         AND (
           (start_time <= ? AND end_time > ?) OR
           (start_time < ? AND end_time >= ?) OR
           (start_time >= ? AND end_time <= ?)
         )`,
      [
        tenantId,
        appointment_date,
        start_time,
        start_time,
        end_time,
        end_time,
        start_time,
        end_time,
      ]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({
        error: "Ce créneau vient d'être réservé. Veuillez en choisir un autre.",
      });
    }

    // Vérifier si le client existe déjà (par téléphone)
    let client = await db.query(
      "SELECT id FROM clients WHERE tenant_id = ? AND phone = ?",
      [tenantId, phone]
    );

    let clientId;

    if (client.length > 0) {
      // Client existant
      clientId = client[0].id;

      // Mettre à jour les infos du client
      await db.query(
        `UPDATE clients
         SET first_name = ?, last_name = ?, email = ?, preferred_contact_method = ?
         WHERE id = ? AND tenant_id = ?`,
        [
          first_name,
          last_name,
          email,
          preferred_contact_method || "email",
          clientId,
          tenantId,
        ]
      );
    } else {
      // Créer un nouveau client
      const result = await db.query(
        `INSERT INTO clients (tenant_id, first_name, last_name, email, phone, preferred_contact_method, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          tenantId,
          first_name,
          last_name,
          email,
          phone,
          preferred_contact_method || "email",
        ]
      );
      clientId = result.insertId;
    }

    // Gérer le code promo si fourni
    let promotionId = null;
    let discountAmount = 0;
    let appointmentPrice = service[0].price;

    if (promo_code && final_amount !== undefined) {
      // Valider et récupérer la promotion
      const promotion = await db.query(
        `SELECT id, discount_value, discount_type
         FROM promotions
         WHERE tenant_id = ? AND code = ? AND is_active = 1
           AND valid_from <= NOW() AND valid_until >= NOW()`,
        [tenantId, promo_code]
      );

      if (promotion.length > 0) {
        promotionId = promotion[0].id;
        discountAmount = service[0].price - final_amount;
        appointmentPrice = final_amount;
      }
    }

    // Créer le rendez-vous avec statut "pending" (en attente de validation)
    const appointment = await db.query(
      `INSERT INTO appointments
       (tenant_id, client_id, service_id, appointment_date, start_time, end_time,
        status, notes, booked_by, booking_source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, 'client', 'website', NOW())`,
      [
        tenantId,
        clientId,
        service_id,
        appointment_date,
        start_time,
        end_time,
        notes || null,
      ]
    );

    // Si un code promo a été utilisé, enregistrer l'utilisation
    if (promotionId && discountAmount > 0) {
      await db.query(
        `INSERT INTO promotion_usages
         (tenant_id, promotion_id, client_id, appointment_id, discount_amount, order_amount, used_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          tenantId,
          promotionId,
          clientId,
          appointment.insertId,
          discountAmount,
          service[0].price,
        ]
      );
    }

    // Récupérer le rendez-vous créé avec tous les détails
    const createdAppointment = await db.query(
      `SELECT
         a.id,
         a.appointment_date,
         a.start_time,
         a.end_time,
         a.status,
         a.notes,
         c.first_name as client_first_name,
         c.last_name as client_last_name,
         c.phone as client_phone,
         c.email as client_email,
         s.name as service_name,
         s.duration as service_duration,
         s.price as service_price,
         t.name as salon_name
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       JOIN services s ON a.service_id = s.id
       JOIN tenants t ON a.tenant_id = t.id
       WHERE a.id = ?`,
      [appointment.insertId]
    );

    const newApt = createdAppointment[0];

    // === DÉBUT MODIFICATION PHASE 4 ===
    // Envoyer l'email d'accusé de réception (si le client a un email)
    if (newApt.client_email) {
      // On ne 'await' pas obligatoirement pour ne pas ralentir la réponse HTTP
      // Mais on log l'erreur au cas où
      const formattedDate = new Date(
        newApt.appointment_date
      ).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const formattedTime = newApt.start_time.substring(0, 5);

      emailService
        .sendBookingRequestReceived({
          to: newApt.client_email,
          firstName: newApt.client_first_name,
          appointmentDate: formattedDate,
          appointmentTime: formattedTime,
          serviceName: newApt.service_name,
          salonName: newApt.salon_name || "Le Salon", // Fallback si le nom n'est pas récupéré
        })
        .catch((err) =>
          console.error("❌ Erreur envoi accusé réception:", err)
        );

      console.log(`✉️ Accusé de réception envoyé à ${newApt.client_email}`);
    }
    // === FIN MODIFICATION PHASE 4 ===

    // === DÉBUT MODIFICATION PHASE 3 ===
    // Notifier le dashboard du salon en temps réel
    try {
      // On émet l'événement uniquement vers la "room" de ce salon spécifique
      req.io.to(`tenant_${tenantId}`).emit("new_appointment", {
        appointment: newApt,
        message: `Nouveau RDV : ${newApt.client_first_name} ${newApt.client_last_name}`,
      });
      console.log(`📡 Notification temps réel envoyée au salon ${tenantId}`);
    } catch (socketError) {
      console.error("❌ Erreur socket:", socketError);
    }
    // === FIN MODIFICATION PHASE 3 ===

    res.status(201).json({
      success: true,
      appointment: newApt,
      message:
        "Votre rendez-vous a été enregistré avec succès. Vous recevrez une confirmation prochainement.",
    });
  } catch (error) {
    console.error("Erreur lors de la création du rendez-vous:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la création du rendez-vous" });
  }
});

/**
 * POST /api/public/promotions/validate
 * Valider un code promo publiquement (sans authentification)
 */
router.post("/promotions/validate", async (req, res) => {
  try {
    const { code, salon_slug, order_amount, service_ids } = req.body;

    if (!code || !salon_slug) {
      return res
        .status(400)
        .json({ success: false, error: "Code et salon requis" });
    }

    // 1. Récupérer l'ID du salon (Tenant) via le slug
    const tenant = await db.query(
      "SELECT id FROM tenants WHERE slug = ? ",
      [salon_slug]
    );

    if (tenant.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Salon introuvable" });
    }

    const tenantId = tenant[0].id;
    const amount = parseFloat(order_amount);

    // 2. Chercher la promotion active pour ce salon
    const [promotion] = await db.query(
      `SELECT * FROM promotions
       WHERE tenant_id = ? AND code = ? AND is_active = TRUE
       AND valid_from <= NOW() AND valid_until >= NOW()`,
      [tenantId, code.toUpperCase()]
    );

    if (!promotion) {
      return res
        .status(404)
        .json({ success: false, error: "Code promo invalide ou expiré" });
    }

    // 3. Vérifications logiques (Montant min, limites...)
    if (
      promotion.min_purchase_amount &&
      amount < promotion.min_purchase_amount
    ) {
      return res.status(400).json({
        success: false,
        error: `Montant minimum de ${promotion.min_purchase_amount}€ requis`,
      });
    }

    if (promotion.usage_limit) {
      const [usageCount] = await db.query(
        "SELECT COUNT(*) as count FROM promotion_usages WHERE promotion_id = ?",
        [promotion.id]
      );
      if (usageCount.count >= promotion.usage_limit) {
        return res
          .status(400)
          .json({
            success: false,
            error: "Ce code a atteint sa limite d'utilisation",
          });
      }
    }

    // 4. Calculer la réduction
    let discountAmount = 0;
    if (promotion.discount_type === "percentage") {
      discountAmount = (amount * parseFloat(promotion.discount_value)) / 100;
    } else {
      discountAmount = parseFloat(promotion.discount_value);
    }

    // Plafonner si nécessaire
    if (
      promotion.max_discount_amount &&
      discountAmount > parseFloat(promotion.max_discount_amount)
    ) {
      discountAmount = parseFloat(promotion.max_discount_amount);
    }
    if (discountAmount > amount) discountAmount = amount;

    // 5. Renvoyer le résultat
    res.json({
      success: true,
      data: {
        promotion_id: promotion.id,
        code: promotion.code,
        title: promotion.title,
        discount_amount: parseFloat(discountAmount.toFixed(2)),
        final_amount: parseFloat((amount - discountAmount).toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Erreur validation promo publique:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

module.exports = router;
