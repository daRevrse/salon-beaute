/**
 * Routes publiques pour le système de réservation
 * Ces routes sont accessibles sans authentification
 * MAIS vérifient que l'abonnement du tenant est actif
 */

const express = require("express");
const router = express.Router();
const db = require("../config/database");
const emailService = require("../services/emailService");
const pushService = require("../services/pushService");
const expoPushService = require("../services/expoPushService");
const { checkPublicSubscription } = require("../middleware/tenant");
const availabilityService = require("../services/availabilityService");

// ===== ABONNEMENTS =====

/**
 * GET /api/public/subscription-plans
 * Récupère la liste des forfaits actifs
 */
router.get('/subscription-plans', async (req, res) => {
  try {
    const plans = await db.query("SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC");
    res.json({ success: true, plans });
  } catch (error) {
    console.error("Erreur GET /public/subscription-plans:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

/**
 * GET /api/public/business-sectors
 * Récupère la liste des secteurs d'activité
 */
router.get('/business-sectors', async (req, res) => {
  try {
    const sectors = await db.query("SELECT value, label, is_active FROM business_sectors WHERE is_active = true ORDER BY label ASC");
    res.json({ success: true, sectors });
  } catch (error) {
    console.error("Erreur GET /public/business-sectors:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

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
      `SELECT id, name, description, duration, price, category, image_url, requires_deposit, deposit_amount
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
              subscription_status, subscription_plan, logo_url, banner_url, slogan, currency
       FROM tenants
       WHERE slug = ? `,
      [slug]
    );

    if (tenant.length === 0) {
      return res.status(404).json({ error: "Salon non trouvé ou inactif" });
    }

    // Récupérer les business_hours et require_appointment_deposit depuis les settings
    const settings = await db.query(
      `SELECT setting_key, setting_value FROM settings
       WHERE tenant_id = ? AND setting_key IN ('business_hours', 'require_appointment_deposit')`,
      [tenant[0].id]
    );

    const salonData = { ...tenant[0] };

    // Ajouter business_hours et require_appointment_deposit si disponible
    settings.forEach(s => {
      if (s.setting_key === 'business_hours') {
        try {
          salonData.business_hours = JSON.parse(s.setting_value);
        } catch (e) {
          console.error("Erreur parsing business_hours:", e);
          salonData.business_hours = null;
        }
      } else if (s.setting_key === 'require_appointment_deposit') {
        salonData.require_appointment_deposit = s.setting_value === 'true' || s.setting_value === true;
      }
    });

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
      `SELECT id, name, description, duration, slot_duration, price, category, image_url, gallery, requires_deposit, deposit_amount
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
         AND setting_key IN ('business_hours', 'appointment_buffer', 'slot_duration', 'theme_settings', 'require_appointment_deposit')`,
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
 * GET /api/public/salon/:slug/staff
 * Professionnels proposés au client pour une prestation (étape "Avec qui ?")
 * Query params: service_id
 * Retourne une liste vide si le salon n'a pas d'employé réservable.
 */
router.get("/salon/:slug/staff", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;
    const { service_id } = req.query;

    if (!service_id) {
      return res.status(400).json({ error: "service_id est requis" });
    }

    const [tenant] = await db.query("SELECT id FROM tenants WHERE slug = ?", [slug]);
    if (!tenant) {
      return res.status(404).json({ error: "Salon non trouvé" });
    }

    const staff = await availabilityService.getStaffForService(tenant.id, service_id);

    // Données publiques minimales : prénom + initiale du nom
    res.json({
      staff: staff.map((member) => ({
        id: member.id,
        first_name: member.first_name,
        last_initial: member.last_name ? `${member.last_name.charAt(0)}.` : "",
        avatar_url: member.avatar_url || null,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des professionnels:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /api/public/salon/:slug/availability
 * Obtenir les créneaux disponibles pour un service et une date
 * Query params: service_id, date (YYYY-MM-DD), staff_id (optionnel)
 * Les créneaux sont calculés par employé (horaires, congés, prestations, RDV)
 * et les créneaux déjà passés du jour ne sont pas proposés.
 * Vérifie que l'abonnement est actif
 */
router.get("/salon/:slug/availability", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;
    const { service_id, date, staff_id } = req.query;

    if (!service_id || !date) {
      return res.status(400).json({ error: "service_id et date sont requis" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Format de date invalide (YYYY-MM-DD)" });
    }

    const [tenant] = await db.query("SELECT id FROM tenants WHERE slug = ?", [slug]);
    if (!tenant) {
      return res.status(404).json({ error: "Salon non trouvé" });
    }

    const result = await availabilityService.getAvailableSlots({
      tenantId: tenant.id,
      serviceId: service_id,
      date,
      staffId: staff_id || null,
    });

    if (result.error === "SERVICE_NOT_FOUND") {
      return res.status(404).json({ error: "Service non trouvé" });
    }

    res.json(result);
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
      staff_id,
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

    // Vérifier la disponibilité et choisir l'employé (préférence du client ou le moins chargé)
    const assignment = await availabilityService.findStaffForSlot({
      tenantId,
      serviceId: service_id,
      date: appointment_date,
      startTime: start_time,
      staffId: staff_id || null,
    });

    if (!assignment.available) {
      return res.status(400).json({
        error:
          assignment.reason === "PAST"
            ? "Ce créneau est déjà passé. Veuillez en choisir un autre."
            : "Ce créneau vient d'être réservé. Veuillez en choisir un autre.",
      });
    }
    const assignedStaffId = assignment.staffId;

    // Vérifier si le client existe déjà (par téléphone)
    let client = await db.query(
      "SELECT id FROM clients WHERE tenant_id = ? AND phone = ?",
      [tenantId, phone]
    );

    let clientId;

    // Nom saisi différent de la fiche existante : signalé au salon sur le RDV
    let bookedAsNote = null;

    if (client.length > 0) {
      // Client existant (même téléphone) : la fiche du salon n'est jamais écrasée
      // par une réservation publique, on complète seulement les champs vides.
      clientId = client[0].id;
      const [existing] = await db.query(
        "SELECT first_name, last_name, email, preferred_contact_method FROM clients WHERE id = ?",
        [clientId]
      );

      const updates = [];
      const params = [];
      if (!existing.email && email) {
        updates.push("email = ?");
        params.push(email);
      }
      if (!existing.preferred_contact_method && preferred_contact_method) {
        updates.push("preferred_contact_method = ?");
        params.push(preferred_contact_method);
      }
      if (updates.length > 0) {
        await db.query(
          `UPDATE clients SET ${updates.join(", ")} WHERE id = ? AND tenant_id = ?`,
          [...params, clientId, tenantId]
        );
      }

      const normalize = (value) => String(value || "").trim().toLowerCase();
      if (
        normalize(existing.first_name) !== normalize(first_name) ||
        normalize(existing.last_name) !== normalize(last_name)
      ) {
        bookedAsNote = `Réservé en ligne au nom de ${first_name} ${last_name}${email && email !== existing.email ? ` (${email})` : ""}`;
      }
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
       (tenant_id, client_id, service_id, staff_id, appointment_date, start_time, end_time,
        status, notes, booked_by, booking_source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'client', 'website', NOW())`,
      [
        tenantId,
        clientId,
        service_id,
        assignedStaffId,
        appointment_date,
        start_time,
        end_time,
        [bookedAsNote, notes].filter(Boolean).join("\n") || null,
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
         a.tenant_id,
         a.client_id,
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
         t.name as salon_name,
         a.staff_id,
         u.first_name as staff_first_name
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       JOIN services s ON a.service_id = s.id
       JOIN tenants t ON a.tenant_id = t.id
       LEFT JOIN users u ON a.staff_id = u.id
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

    // Notifier le staff via Push (Web + Mobile)
    try {
      // Web Push (navigateurs/PWA)
      await pushService.sendToTenant(tenantId, {
        title: "Nouveau rendez-vous !",
        body: `${newApt.client_first_name} ${newApt.client_last_name} a réservé : ${newApt.service_name}`,
        icon: "/logo192.png",
        data: {
          url: `/dashboard/appointments/${newApt.id}`,
          appointmentId: newApt.id
        }
      }, true);
    } catch (pushError) {
      console.error("❌ Erreur web push staff:", pushError.message);
    }

    // Expo Push (appareils mobiles)
    try {
      await expoPushService.sendToTenant(tenantId, {
        title: "Nouveau rendez-vous !",
        body: `${newApt.client_first_name} ${newApt.client_last_name} a réservé : ${newApt.service_name}`,
        data: {
          type: "new_appointment",
          appointmentId: newApt.id,
        },
      });
    } catch (expoPushError) {
      console.error("❌ Erreur expo push staff:", expoPushError.message);
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

// ==========================================
// POLLING PAIEMENT PUBLIC
// ==========================================
router.get("/appointments/:id/payment-status", async (req, res) => {
  try {
    const { id } = req.params;
    const [appointment] = await db.query(
      "SELECT id, payment_status, payment_reference, amount_paid, status FROM appointments WHERE id = ?",
      [id]
    );

    if (!appointment) {
      return res.status(404).json({ success: false, error: "Rendez-vous introuvable" });
    }

    res.json({
      success: true,
      data: {
        payment_status: appointment.payment_status,
        payment_reference: appointment.payment_reference,
        amount_paid: appointment.amount_paid,
        status: appointment.status
      }
    });

  } catch (error) {
    console.error("Erreur statut paiement:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

module.exports = router;
