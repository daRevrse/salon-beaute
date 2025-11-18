/**
 * SALONHUB - Routes Promotions
 * Gestion des codes promo, réductions et campagnes marketing
 */

const express = require("express");
const router = express.Router();
const { query } = require("../config/database");
const { authMiddleware } = require("../middleware/auth");
const { tenantMiddleware } = require("../middleware/tenant");

// Appliquer middlewares sur toutes les routes
router.use(authMiddleware);
router.use(tenantMiddleware);

// ==========================================
// GET - Liste des promotions
// ==========================================
router.get("/", async (req, res) => {
  try {
    const { active_only, public_only } = req.query;

    let sql = `
      SELECT
        p.*,
        u.first_name as created_by_name,
        u.last_name as created_by_lastname,
        (SELECT COUNT(*) FROM promotion_usages WHERE promotion_id = p.id) as total_usages
      FROM promotions p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.tenant_id = ?
    `;

    const params = [req.tenantId];

    if (active_only === 'true') {
      sql += ` AND p.is_active = TRUE AND p.valid_until >= NOW()`;
    }

    if (public_only === 'true') {
      sql += ` AND p.is_public = TRUE`;
    }

    sql += ` ORDER BY p.created_at DESC`;

    const promotions = await query(sql, params);

    res.json({
      success: true,
      data: promotions
    });
  } catch (error) {
    console.error("Erreur récupération promotions:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

// ==========================================
// GET - Détails d'une promotion
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [promotion] = await query(
      `SELECT
        p.*,
        u.first_name as created_by_name,
        u.last_name as created_by_lastname
      FROM promotions p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ? AND p.tenant_id = ?`,
      [id, req.tenantId]
    );

    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: "Promotion introuvable"
      });
    }

    // Récupérer les utilisations
    const usages = await query(
      `SELECT
        pu.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name
      FROM promotion_usages pu
      JOIN clients c ON pu.client_id = c.id
      WHERE pu.promotion_id = ?
      ORDER BY pu.used_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...promotion,
        usages
      }
    });
  } catch (error) {
    console.error("Erreur récupération promotion:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

// ==========================================
// POST - Créer une promotion
// ==========================================
router.post("/", async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      discount_type,
      discount_value,
      applies_to,
      service_ids,
      min_purchase_amount,
      max_discount_amount,
      usage_limit,
      usage_per_client,
      valid_from,
      valid_until,
      is_active,
      is_public
    } = req.body;

    // Validation
    if (!code || !title || !discount_type || !discount_value || !valid_from || !valid_until) {
      return res.status(400).json({
        success: false,
        error: "Champs obligatoires manquants"
      });
    }

    // Vérifier que le code n'existe pas déjà
    const [existing] = await query(
      "SELECT id FROM promotions WHERE tenant_id = ? AND code = ?",
      [req.tenantId, code]
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Ce code promo existe déjà"
      });
    }

    // Créer la promotion
    const result = await query(
      `INSERT INTO promotions (
        tenant_id, code, title, description,
        discount_type, discount_value,
        applies_to, service_ids,
        min_purchase_amount, max_discount_amount,
        usage_limit, usage_per_client,
        valid_from, valid_until,
        is_active, is_public,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        code.toUpperCase(),
        title,
        description || null,
        discount_type,
        discount_value,
        applies_to || 'all_services',
        service_ids ? JSON.stringify(service_ids) : null,
        min_purchase_amount || null,
        max_discount_amount || null,
        usage_limit || null,
        usage_per_client || 1,
        valid_from,
        valid_until,
        is_active !== false,
        is_public !== false,
        req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      message: "Promotion créée avec succès",
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error("Erreur création promotion:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

// ==========================================
// PUT - Modifier une promotion
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Vérifier que la promotion existe
    const [promotion] = await query(
      "SELECT id FROM promotions WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: "Promotion introuvable"
      });
    }

    // Si modification du code, vérifier unicité
    if (updates.code) {
      const [existing] = await query(
        "SELECT id FROM promotions WHERE tenant_id = ? AND code = ? AND id != ?",
        [req.tenantId, updates.code, id]
      );

      if (existing) {
        return res.status(400).json({
          success: false,
          error: "Ce code promo existe déjà"
        });
      }
    }

    // Construire la requête UPDATE
    const allowedFields = [
      'code', 'title', 'description',
      'discount_type', 'discount_value',
      'applies_to', 'service_ids',
      'min_purchase_amount', 'max_discount_amount',
      'usage_limit', 'usage_per_client',
      'valid_from', 'valid_until',
      'is_active', 'is_public'
    ];

    const updateFields = [];
    const values = [];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Aucun champ à mettre à jour"
      });
    }

    values.push(id, req.tenantId);

    await query(
      `UPDATE promotions SET ${updateFields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );

    res.json({
      success: true,
      message: "Promotion modifiée avec succès"
    });
  } catch (error) {
    console.error("Erreur modification promotion:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

// ==========================================
// DELETE - Supprimer une promotion
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      "DELETE FROM promotions WHERE id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Promotion introuvable"
      });
    }

    res.json({
      success: true,
      message: "Promotion supprimée avec succès"
    });
  } catch (error) {
    console.error("Erreur suppression promotion:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

// ==========================================
// POST - Valider un code promo
// ==========================================
router.post("/validate", async (req, res) => {
  try {
    const { code, client_id, order_amount, service_ids } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Code promo requis"
      });
    }

    // Récupérer la promotion
    const [promotion] = await query(
      `SELECT * FROM promotions
       WHERE tenant_id = ? AND code = ? AND is_active = TRUE
       AND valid_from <= NOW() AND valid_until >= NOW()`,
      [req.tenantId, code.toUpperCase()]
    );

    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: "Code promo invalide ou expiré"
      });
    }

    // Vérifier montant minimum
    if (promotion.min_purchase_amount && order_amount < promotion.min_purchase_amount) {
      return res.status(400).json({
        success: false,
        error: `Montant minimum de ${promotion.min_purchase_amount}€ requis`
      });
    }

    // Vérifier nombre d'utilisations total
    if (promotion.usage_limit) {
      const [usageCount] = await query(
        "SELECT COUNT(*) as count FROM promotion_usages WHERE promotion_id = ?",
        [promotion.id]
      );

      if (usageCount.count >= promotion.usage_limit) {
        return res.status(400).json({
          success: false,
          error: "Ce code promo a atteint sa limite d'utilisation"
        });
      }
    }

    // Vérifier nombre d'utilisations par client
    if (client_id) {
      const [clientUsageCount] = await query(
        "SELECT COUNT(*) as count FROM promotion_usages WHERE promotion_id = ? AND client_id = ?",
        [promotion.id, client_id]
      );

      if (clientUsageCount.count >= promotion.usage_per_client) {
        return res.status(400).json({
          success: false,
          error: "Vous avez déjà utilisé ce code promo"
        });
      }
    }

    // Calculer la réduction
    let discountAmount = 0;

    if (promotion.discount_type === 'percentage') {
      discountAmount = (order_amount * promotion.discount_value) / 100;
    } else if (promotion.discount_type === 'fixed_amount') {
      discountAmount = promotion.discount_value;
    }

    // Appliquer le montant maximum de réduction
    if (promotion.max_discount_amount && discountAmount > promotion.max_discount_amount) {
      discountAmount = promotion.max_discount_amount;
    }

    // Ne pas dépasser le montant total
    if (discountAmount > order_amount) {
      discountAmount = order_amount;
    }

    res.json({
      success: true,
      data: {
        promotion_id: promotion.id,
        code: promotion.code,
        title: promotion.title,
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value,
        discount_amount: parseFloat(discountAmount.toFixed(2)),
        final_amount: parseFloat((order_amount - discountAmount).toFixed(2))
      }
    });
  } catch (error) {
    console.error("Erreur validation code promo:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

// ==========================================
// POST - Enregistrer l'utilisation d'un code promo
// ==========================================
router.post("/use", async (req, res) => {
  try {
    const { promotion_id, client_id, appointment_id, discount_amount, order_amount } = req.body;

    if (!promotion_id || !client_id || !discount_amount || !order_amount) {
      return res.status(400).json({
        success: false,
        error: "Champs obligatoires manquants"
      });
    }

    await query(
      `INSERT INTO promotion_usages (
        tenant_id, promotion_id, client_id, appointment_id,
        discount_amount, order_amount
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        promotion_id,
        client_id,
        appointment_id || null,
        discount_amount,
        order_amount
      ]
    );

    res.json({
      success: true,
      message: "Utilisation du code promo enregistrée"
    });
  } catch (error) {
    console.error("Erreur enregistrement utilisation promo:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

// ==========================================
// GET - Statistiques des promotions
// ==========================================
router.get("/stats/summary", async (req, res) => {
  try {
    const stats = await query(
      `SELECT
        COUNT(*) as total_promotions,
        SUM(CASE WHEN is_active = TRUE AND valid_until >= NOW() THEN 1 ELSE 0 END) as active_promotions,
        (SELECT COUNT(*) FROM promotion_usages WHERE tenant_id = ?) as total_usages,
        (SELECT SUM(discount_amount) FROM promotion_usages WHERE tenant_id = ?) as total_discounts_given
      FROM promotions
      WHERE tenant_id = ?`,
      [req.tenantId, req.tenantId, req.tenantId]
    );

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error("Erreur statistiques promotions:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

module.exports = router;
