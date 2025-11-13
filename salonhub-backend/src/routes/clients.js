/**
 * SALONHUB - Routes Clients
 * CRUD complet avec isolation multi-tenant
 */

const express = require("express");
const router = express.Router();
const { query } = require("../config/database");
const { authMiddleware } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");

// Appliquer les middlewares sur toutes les routes
router.use(authMiddleware);
router.use(tenantMiddleware);

// ==========================================
// GET - Liste des clients
// ==========================================
router.get("/", async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;

    let sql = "SELECT * FROM clients WHERE tenant_id = ?";
    const params = [req.tenantId];

    // Recherche optionnelle
    if (search) {
      sql +=
        " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += " ORDER BY last_name, first_name LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const clients = await query(sql, params);

    // Compte total (pour pagination)
    let countSql = "SELECT COUNT(*) as total FROM clients WHERE tenant_id = ?";
    const countParams = [req.tenantId];

    if (search) {
      countSql +=
        " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)";
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await query(countSql, countParams);

    res.json({
      success: true,
      data: clients,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + clients.length < countResult.total,
      },
    });
  } catch (error) {
    console.error("Erreur récupération clients:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// GET - Un client par ID
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [client] = await query(
      "SELECT * FROM clients WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        error: "Client introuvable",
      });
    }

    // Récupérer les stats du client
    const [stats] = await query(
      `SELECT 
        COUNT(*) as total_appointments,
        SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END) as total_spent,
        MAX(a.appointment_date) as last_visit_date
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.client_id = ? AND a.tenant_id = ?`,
      [id, req.tenantId]
    );

    res.json({
      success: true,
      data: {
        ...client,
        stats: stats || {},
      },
    });
  } catch (error) {
    console.error("Erreur récupération client:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// POST - Créer un client
// ==========================================
router.post("/", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      notes,
      email_marketing_consent,
      sms_marketing_consent,
    } = req.body;

    // Validation
    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: "Prénom et nom obligatoires",
      });
    }

    // Vérifier email unique pour ce tenant (si fourni)
    if (email) {
      const [existing] = await query(
        "SELECT id FROM clients WHERE email = ? AND tenant_id = ?",
        [email, req.tenantId]
      );

      if (existing) {
        return res.status(409).json({
          success: false,
          error: "Un client avec cet email existe déjà",
        });
      }
    }

    // Insertion
    const result = await query(
      `INSERT INTO clients (
        tenant_id, first_name, last_name, email, phone,
        date_of_birth, gender, notes,
        email_marketing_consent, sms_marketing_consent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        first_name,
        last_name,
        email || null,
        phone || null,
        date_of_birth || null,
        gender || null,
        notes || null,
        email_marketing_consent || false,
        sms_marketing_consent || false,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Client créé avec succès",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error("Erreur création client:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// PUT - Modifier un client
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      notes,
      email_marketing_consent,
      sms_marketing_consent,
    } = req.body;

    // Vérifier que le client existe et appartient au tenant
    const [existing] = await query(
      "SELECT id FROM clients WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Client introuvable",
      });
    }

    // Vérifier email unique (si changé)
    if (email) {
      const [duplicate] = await query(
        "SELECT id FROM clients WHERE email = ? AND tenant_id = ? AND id != ?",
        [email, req.tenantId, id]
      );

      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: "Un autre client avec cet email existe déjà",
        });
      }
    }

    // Mise à jour
    await query(
      `UPDATE clients SET
        first_name = ?,
        last_name = ?,
        email = ?,
        phone = ?,
        date_of_birth = ?,
        gender = ?,
        notes = ?,
        email_marketing_consent = ?,
        sms_marketing_consent = ?
      WHERE id = ? AND tenant_id = ?`,
      [
        first_name,
        last_name,
        email || null,
        phone || null,
        date_of_birth || null,
        gender || null,
        notes || null,
        email_marketing_consent || false,
        sms_marketing_consent || false,
        id,
        req.tenantId,
      ]
    );

    res.json({
      success: true,
      message: "Client modifié avec succès",
    });
  } catch (error) {
    console.error("Erreur modification client:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// DELETE - Supprimer un client
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le client a des RDV futurs
    const [futureAppointments] = await query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE client_id = ? AND tenant_id = ? 
       AND appointment_date >= CURDATE() 
       AND status IN ('pending', 'confirmed')`,
      [id, req.tenantId]
    );

    if (futureAppointments.count > 0) {
      return res.status(409).json({
        success: false,
        error: "Impossible de supprimer",
        message: "Ce client a des rendez-vous futurs. Annulez-les d'abord.",
      });
    }

    // Suppression
    const result = await query(
      "DELETE FROM clients WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Client introuvable",
      });
    }

    res.json({
      success: true,
      message: "Client supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression client:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// GET - Historique RDV d'un client
// ==========================================
router.get("/:id/appointments", async (req, res) => {
  try {
    const { id } = req.params;

    const appointments = await query(
      `SELECT 
        a.*,
        s.name as service_name,
        s.price as service_price,
        u.first_name as staff_first_name,
        u.last_name as staff_last_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users u ON a.staff_id = u.id
      WHERE a.client_id = ? AND a.tenant_id = ?
      ORDER BY a.appointment_date DESC, a.start_time DESC
      LIMIT 50`,
      [id, req.tenantId]
    );

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Erreur historique client:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

module.exports = router;
