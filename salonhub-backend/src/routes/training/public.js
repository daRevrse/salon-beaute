/**
 * Routes publiques pour le secteur Formation
 * Accessible sans authentification pour les clients
 * MAIS vérifient que l'abonnement du tenant est actif
 */

const express = require("express");
const router = express.Router();
const db = require("../../config/database");
const { checkPublicSubscription } = require("../../middleware/tenant");

/**
 * GET /api/public/training/:slug/courses
 * Récupérer les cours disponibles
 * Vérifie que l'abonnement est actif
 */
router.get("/:slug/courses", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;

    // Récupérer le tenant
    const tenants = await db.query(
      "SELECT id FROM tenants WHERE slug = ? AND business_type = 'training' AND is_active = TRUE",
      [slug]
    );

    if (tenants.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Centre de formation introuvable",
      });
    }

    const tenantId = tenants[0].id;

    // Récupérer les cours actifs
    const courses = await db.query(
      `SELECT id, name, description, category, duration_hours, price, level,
              max_participants, image_url, is_active
       FROM training_courses
       WHERE tenant_id = ? AND is_active = TRUE
       ORDER BY category, name`,
      [tenantId]
    );

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Erreur récupération cours:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

/**
 * GET /api/public/training/:slug/sessions
 * Récupérer les sessions à venir
 * Vérifie que l'abonnement est actif
 */
router.get("/:slug/sessions", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;
    const { course_id } = req.query;

    // Récupérer le tenant
    const tenants = await db.query(
      "SELECT id FROM tenants WHERE slug = ? AND business_type = 'training' AND is_active = TRUE",
      [slug]
    );

    if (tenants.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Centre de formation introuvable",
      });
    }

    const tenantId = tenants[0].id;

    // Construire la requête
    let query = `
      SELECT s.id, s.course_id, s.session_date, s.start_time, s.end_time,
             s.location, s.max_participants, s.status,
             c.name as course_name, c.price as course_price,
             (s.max_participants - COALESCE((
               SELECT COUNT(*) FROM training_enrollments e
               WHERE e.session_id = s.id AND e.status IN ('enrolled', 'confirmed')
             ), 0)) as available_spots
      FROM training_sessions s
      JOIN training_courses c ON s.course_id = c.id
      WHERE s.tenant_id = ?
        AND s.session_date >= CURDATE()
        AND s.status = 'scheduled'
        AND c.is_active = TRUE
    `;
    const params = [tenantId];

    if (course_id) {
      query += " AND s.course_id = ?";
      params.push(course_id);
    }

    query += " ORDER BY s.session_date, s.start_time LIMIT 50";

    const sessions = await db.query(query, params);

    // Filtrer les sessions avec des places disponibles
    const availableSessions = sessions.filter((s) => s.available_spots > 0);

    res.json({
      success: true,
      data: availableSessions,
    });
  } catch (error) {
    console.error("Erreur récupération sessions:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

/**
 * POST /api/public/training/:slug/enroll
 * S'inscrire à une session
 * Vérifie que l'abonnement est actif
 */
router.post("/:slug/enroll", checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { slug } = req.params;
    const { session_id, name, email, phone, notes } = req.body;

    // Validation
    if (!session_id || !name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: "Session, nom, email et téléphone requis",
      });
    }

    // Récupérer le tenant
    const tenants = await db.query(
      "SELECT id FROM tenants WHERE slug = ? AND business_type = 'training' AND is_active = TRUE",
      [slug]
    );

    if (tenants.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Centre de formation introuvable",
      });
    }

    const tenantId = tenants[0].id;

    // Vérifier la session
    const sessions = await db.query(
      `SELECT s.*, c.name as course_name, c.price as course_price,
              (s.max_participants - COALESCE((
                SELECT COUNT(*) FROM training_enrollments e
                WHERE e.session_id = s.id AND e.status IN ('enrolled', 'confirmed')
              ), 0)) as available_spots
       FROM training_sessions s
       JOIN training_courses c ON s.course_id = c.id
       WHERE s.id = ? AND s.tenant_id = ? AND s.status = 'scheduled'`,
      [session_id, tenantId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Session introuvable",
      });
    }

    const session = sessions[0];

    if (session.available_spots <= 0) {
      return res.status(400).json({
        success: false,
        error: "Cette session est complète",
      });
    }

    // Vérifier si pas déjà inscrit
    const existingEnrollment = await db.query(
      `SELECT id FROM training_enrollments
       WHERE session_id = ? AND email = ? AND status IN ('enrolled', 'confirmed')`,
      [session_id, email]
    );

    if (existingEnrollment.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Vous êtes déjà inscrit à cette session",
      });
    }

    // Générer un code de confirmation
    const confirmationCode = `TRN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Créer l'inscription
    const result = await db.query(
      `INSERT INTO training_enrollments
       (tenant_id, session_id, participant_name, email, phone, notes, status, confirmation_code)
       VALUES (?, ?, ?, ?, ?, ?, 'enrolled', ?)`,
      [tenantId, session_id, name, email, phone, notes || null, confirmationCode]
    );

    res.status(201).json({
      success: true,
      message: "Inscription confirmée",
      data: {
        enrollment_id: result.insertId,
        confirmation_code: confirmationCode,
        session: {
          date: session.session_date,
          start_time: session.start_time,
          end_time: session.end_time,
          location: session.location,
          course_name: session.course_name,
          price: session.course_price,
        },
      },
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

module.exports = router;
