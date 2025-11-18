/**
 * SALONHUB - Routes Services
 * Gestion des prestations offertes par le salon
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
// GET - Liste des services
// ==========================================
router.get("/", async (req, res) => {
  try {
    const { category, is_active, search } = req.query;

    let sql = "SELECT * FROM services WHERE tenant_id = ?";
    const params = [req.tenantId];

    // Filtres optionnels
    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    if (is_active !== undefined) {
      sql += " AND is_active = ?";
      params.push(is_active === "true" ? 1 : 0);
    }

    if (search) {
      sql += " AND (name LIKE ? OR description LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += " ORDER BY category, name";

    const services = await query(sql, params);

    // Grouper par catégorie
    const grouped = services.reduce((acc, service) => {
      const cat = service.category || "Autres";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    }, {});

    res.json({
      success: true,
      data: services,
      grouped: grouped,
    });
  } catch (error) {
    console.error("Erreur récupération services:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// GET - Un service par ID
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [service] = await query(
      "SELECT * FROM services WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Service introuvable",
      });
    }

    // Stats du service
    const [stats] = await query(
      `SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        AVG(CASE WHEN status = 'completed' THEN s.price END) as avg_price
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.service_id = ? AND a.tenant_id = ?`,
      [id, req.tenantId]
    );

    res.json({
      success: true,
      data: {
        ...service,
        stats: stats || {},
      },
    });
  } catch (error) {
    console.error("Erreur récupération service:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// POST - Créer un service
// ==========================================
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      duration,
      price,
      category,
      is_active,
      requires_deposit,
      deposit_amount,
      available_for_online_booking,
      image_url,
    } = req.body;

    // Validation
    if (!name || !duration || price === undefined) {
      return res.status(400).json({
        success: false,
        error: "Nom, durée et prix obligatoires",
      });
    }

    if (duration <= 0 || price < 0) {
      return res.status(400).json({
        success: false,
        error: "Durée et prix doivent être positifs",
      });
    }

    // Insertion
    const result = await query(
      `INSERT INTO services (
        tenant_id, name, description, duration, price, category,
        is_active, requires_deposit, deposit_amount,
        available_for_online_booking, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        name,
        description || null,
        duration,
        price,
        category || null,
        is_active !== undefined ? is_active : true,
        requires_deposit || false,
        deposit_amount || 0,
        available_for_online_booking !== undefined
          ? available_for_online_booking
          : true,
        image_url || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Service créé avec succès",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    console.error("Erreur création service:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// PUT - Modifier un service
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      duration,
      price,
      category,
      is_active,
      requires_deposit,
      deposit_amount,
      available_for_online_booking,
      image_url,
    } = req.body;

    // Vérifier existence
    const [existing] = await query(
      "SELECT id FROM services WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Service introuvable",
      });
    }

    // Validation
    if (duration !== undefined && duration <= 0) {
      return res.status(400).json({
        success: false,
        error: "La durée doit être positive",
      });
    }

    if (price !== undefined && price < 0) {
      return res.status(400).json({
        success: false,
        error: "Le prix ne peut pas être négatif",
      });
    }

    // Mise à jour
    await query(
      `UPDATE services SET
        name = ?,
        description = ?,
        duration = ?,
        price = ?,
        category = ?,
        is_active = ?,
        requires_deposit = ?,
        deposit_amount = ?,
        available_for_online_booking = ?,
        image_url = COALESCE(?, image_url)
      WHERE id = ? AND tenant_id = ?`,
      [
        name,
        description || null,
        duration,
        price,
        category || null,
        is_active !== undefined ? is_active : true,
        requires_deposit || false,
        deposit_amount || 0,
        available_for_online_booking !== undefined
          ? available_for_online_booking
          : true,
        image_url || null,
        id,
        req.tenantId,
      ]
    );

    res.json({
      success: true,
      message: "Service modifié avec succès",
    });
  } catch (error) {
    console.error("Erreur modification service:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// DELETE - Supprimer un service
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier RDV futurs
    const [futureAppointments] = await query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE service_id = ? AND tenant_id = ? 
       AND appointment_date >= CURDATE()
       AND status IN ('pending', 'confirmed')`,
      [id, req.tenantId]
    );

    if (futureAppointments.count > 0) {
      return res.status(409).json({
        success: false,
        error: "Impossible de supprimer",
        message: "Ce service a des rendez-vous futurs. Désactivez-le plutôt.",
      });
    }

    // Suppression
    const result = await query(
      "DELETE FROM services WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Service introuvable",
      });
    }

    res.json({
      success: true,
      message: "Service supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression service:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// PATCH - Toggle actif/inactif
// ==========================================
router.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;

    const [service] = await query(
      "SELECT is_active FROM services WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Service introuvable",
      });
    }

    await query(
      "UPDATE services SET is_active = ? WHERE id = ? AND tenant_id = ?",
      [!service.is_active, id, req.tenantId]
    );

    res.json({
      success: true,
      message: service.is_active ? "Service désactivé" : "Service activé",
      data: {
        is_active: !service.is_active,
      },
    });
  } catch (error) {
    console.error("Erreur toggle service:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// ==========================================
// GET - Catégories disponibles
// ==========================================
router.get("/meta/categories", async (req, res) => {
  try {
    const categories = await query(
      `SELECT DISTINCT category, COUNT(*) as count 
       FROM services 
       WHERE tenant_id = ? AND category IS NOT NULL
       GROUP BY category
       ORDER BY category`,
      [req.tenantId]
    );

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Erreur récupération catégories:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

module.exports = router;
