/**
 * SALONHUB - Routes Restaurant Menus
 * Gestion des menus/plats pour les restaurants
 * Requires Migration 002 (restaurant_menus table)
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const { authMiddleware } = require('../../middleware/auth');
const { tenantMiddleware } = require('../../middleware/tenant');
const { businessTypeMiddleware, requireBusinessType } = require('../../middleware/businessType');

// Apply middlewares to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(businessTypeMiddleware);
router.use(requireBusinessType('restaurant'));

// ==========================================
// GET - Liste tous les items du menu
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { category, available_only } = req.query;

    let sql = `
      SELECT
        id, name, description, category, price,
        allergens, is_vegetarian, is_vegan, is_gluten_free,
        is_available, is_active, image_url, display_order,
        created_at, updated_at
      FROM restaurant_menus
      WHERE tenant_id = ?
    `;

    const params = [req.tenantId];

    // Filter by category
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    // Filter by availability
    if (available_only === 'true') {
      sql += ' AND is_available = TRUE AND is_active = TRUE';
    }

    sql += ' ORDER BY category, display_order, name';

    const menus = await query(sql, params);

    // Parse allergens JSON if present
    const menusWithParsedData = menus.map(menu => ({
      ...menu,
      allergens: menu.allergens ? JSON.parse(menu.allergens) : [],
      is_vegetarian: Boolean(menu.is_vegetarian),
      is_vegan: Boolean(menu.is_vegan),
      is_gluten_free: Boolean(menu.is_gluten_free),
      is_available: Boolean(menu.is_available),
      is_active: Boolean(menu.is_active)
    }));

    res.json({
      success: true,
      data: menusWithParsedData
    });
  } catch (error) {
    console.error('Erreur récupération menus:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// GET - Catégories disponibles
// ==========================================
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await query(
      `SELECT DISTINCT category
       FROM restaurant_menus
       WHERE tenant_id = ? AND category IS NOT NULL AND is_active = TRUE
       ORDER BY category`,
      [req.tenantId]
    );

    res.json({
      success: true,
      data: categories.map(c => c.category)
    });
  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// GET - Détails d'un item du menu
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [menu] = await query(
      `SELECT
        id, name, description, category, price,
        allergens, is_vegetarian, is_vegan, is_gluten_free,
        is_available, is_active, image_url, display_order,
        created_at, updated_at
      FROM restaurant_menus
      WHERE id = ? AND tenant_id = ?`,
      [id, req.tenantId]
    );

    if (!menu) {
      return res.status(404).json({
        success: false,
        error: 'Item du menu introuvable'
      });
    }

    // Parse allergens JSON
    menu.allergens = menu.allergens ? JSON.parse(menu.allergens) : [];
    menu.is_vegetarian = Boolean(menu.is_vegetarian);
    menu.is_vegan = Boolean(menu.is_vegan);
    menu.is_gluten_free = Boolean(menu.is_gluten_free);
    menu.is_available = Boolean(menu.is_available);
    menu.is_active = Boolean(menu.is_active);

    res.json({
      success: true,
      data: menu
    });
  } catch (error) {
    console.error('Erreur récupération menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// POST - Créer un item du menu
// ==========================================
router.post('/', async (req, res) => {
  try {
    // Only owner and admin can create menu items
    if (!['owner', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé'
      });
    }

    const {
      name,
      description,
      category,
      price,
      allergens,
      is_vegetarian,
      is_vegan,
      is_gluten_free,
      image_url,
      display_order
    } = req.body;

    // Validation
    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Nom et prix requis'
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Le prix doit être positif'
      });
    }

    // Convert allergens array to JSON string
    const allergensJson = allergens ? JSON.stringify(allergens) : null;

    const result = await query(
      `INSERT INTO restaurant_menus (
        tenant_id, name, description, category, price,
        allergens, is_vegetarian, is_vegan, is_gluten_free,
        image_url, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.tenantId,
        name,
        description || null,
        category || null,
        price,
        allergensJson,
        is_vegetarian ? 1 : 0,
        is_vegan ? 1 : 0,
        is_gluten_free ? 1 : 0,
        image_url || null,
        display_order || 0
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Item du menu créé avec succès',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Erreur création menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// PUT - Modifier un item du menu
// ==========================================
router.put('/:id', async (req, res) => {
  try {
    // Only owner and admin can update menu items
    if (!['owner', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé'
      });
    }

    const { id } = req.params;
    const {
      name,
      description,
      category,
      price,
      allergens,
      is_vegetarian,
      is_vegan,
      is_gluten_free,
      is_active,
      image_url,
      display_order
    } = req.body;

    // Verify menu item exists
    const [existing] = await query(
      'SELECT id FROM restaurant_menus WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Item du menu introuvable'
      });
    }

    // Build dynamic update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description || null);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category || null);
    }
    if (price !== undefined) {
      if (price < 0) {
        return res.status(400).json({
          success: false,
          error: 'Le prix doit être positif'
        });
      }
      updates.push('price = ?');
      params.push(price);
    }
    if (allergens !== undefined) {
      updates.push('allergens = ?');
      params.push(allergens ? JSON.stringify(allergens) : null);
    }
    if (is_vegetarian !== undefined) {
      updates.push('is_vegetarian = ?');
      params.push(is_vegetarian ? 1 : 0);
    }
    if (is_vegan !== undefined) {
      updates.push('is_vegan = ?');
      params.push(is_vegan ? 1 : 0);
    }
    if (is_gluten_free !== undefined) {
      updates.push('is_gluten_free = ?');
      params.push(is_gluten_free ? 1 : 0);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(image_url || null);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      params.push(display_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée à mettre à jour'
      });
    }

    updates.push('updated_at = NOW()');
    params.push(id, req.tenantId);

    await query(
      `UPDATE restaurant_menus SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Item du menu modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur modification menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// PATCH - Basculer disponibilité d'un item
// ==========================================
router.patch('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    if (is_available === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Le statut de disponibilité est requis'
      });
    }

    // Verify menu item exists
    const [menu] = await query(
      'SELECT id FROM restaurant_menus WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!menu) {
      return res.status(404).json({
        success: false,
        error: 'Item du menu introuvable'
      });
    }

    await query(
      'UPDATE restaurant_menus SET is_available = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?',
      [is_available ? 1 : 0, id, req.tenantId]
    );

    res.json({
      success: true,
      message: `Item ${is_available ? 'marqué comme disponible' : 'marqué comme indisponible'}`
    });
  } catch (error) {
    console.error('Erreur mise à jour disponibilité:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// DELETE - Supprimer un item du menu
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    // Only owner can delete menu items
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Seul le propriétaire peut supprimer des items du menu'
      });
    }

    const { id } = req.params;

    // Verify menu item exists
    const [menu] = await query(
      'SELECT id FROM restaurant_menus WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!menu) {
      return res.status(404).json({
        success: false,
        error: 'Item du menu introuvable'
      });
    }

    // Soft delete by setting is_active to false (preserve historical orders)
    await query(
      'UPDATE restaurant_menus SET is_active = FALSE, updated_at = NOW() WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    res.json({
      success: true,
      message: 'Item du menu supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;
