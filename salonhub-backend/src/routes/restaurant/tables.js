/**
 * SALONHUB - Routes Restaurant Tables
 * Gestion des tables pour les restaurants
 * EXEMPLE - Migration 002 required (restaurant_tables table)
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
router.use(requireBusinessType('restaurant')); // Only for restaurant businesses

// ==========================================
// GET - Liste toutes les tables du restaurant
// ==========================================
router.get('/', async (req, res) => {
  try {
    const tables = await query(
      `SELECT
        id, table_number, table_name, capacity, section,
        is_available, is_active, created_at, updated_at
      FROM restaurant_tables
      WHERE tenant_id = ?
      ORDER BY section, table_number`,
      [req.tenantId]
    );

    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    console.error('Erreur récupération tables:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// GET - Détails d'une table
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [table] = await query(
      `SELECT
        id, table_number, table_name, capacity, section,
        is_available, is_active, created_at, updated_at
      FROM restaurant_tables
      WHERE id = ? AND tenant_id = ?`,
      [id, req.tenantId]
    );

    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Table introuvable'
      });
    }

    res.json({
      success: true,
      data: table
    });
  } catch (error) {
    console.error('Erreur récupération table:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// POST - Créer une nouvelle table
// ==========================================
router.post('/', async (req, res) => {
  try {
    // Only owner and admin can create tables
    if (!['owner', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé'
      });
    }

    const { table_number, table_name, capacity, section } = req.body;

    // Validation
    if (!table_number || !capacity) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de table et capacité requis'
      });
    }

    // Check if table number already exists in this section
    const [existing] = await query(
      `SELECT id FROM restaurant_tables
       WHERE tenant_id = ? AND table_number = ? AND section = ?`,
      [req.tenantId, table_number, section || null]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Une table avec ce numéro existe déjà dans cette section'
      });
    }

    // Create table
    const result = await query(
      `INSERT INTO restaurant_tables (
        tenant_id, table_number, table_name, capacity, section
      ) VALUES (?, ?, ?, ?, ?)`,
      [req.tenantId, table_number, table_name || null, capacity, section || null]
    );

    res.status(201).json({
      success: true,
      message: 'Table créée avec succès',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Erreur création table:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// PUT - Modifier une table
// ==========================================
router.put('/:id', async (req, res) => {
  try {
    // Only owner and admin can update tables
    if (!['owner', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé'
      });
    }

    const { id } = req.params;
    const { table_number, table_name, capacity, section, is_active } = req.body;

    // Verify table exists and belongs to tenant
    const [table] = await query(
      'SELECT id FROM restaurant_tables WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Table introuvable'
      });
    }

    // Build dynamic update query
    const updates = [];
    const params = [];

    if (table_number !== undefined) {
      updates.push('table_number = ?');
      params.push(table_number);
    }
    if (table_name !== undefined) {
      updates.push('table_name = ?');
      params.push(table_name || null);
    }
    if (capacity !== undefined) {
      updates.push('capacity = ?');
      params.push(capacity);
    }
    if (section !== undefined) {
      updates.push('section = ?');
      params.push(section || null);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
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
      `UPDATE restaurant_tables SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Table modifiée avec succès'
    });
  } catch (error) {
    console.error('Erreur modification table:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// PATCH - Basculer disponibilité d'une table
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

    // Verify table exists and belongs to tenant
    const [table] = await query(
      'SELECT id FROM restaurant_tables WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Table introuvable'
      });
    }

    await query(
      'UPDATE restaurant_tables SET is_available = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?',
      [is_available ? 1 : 0, id, req.tenantId]
    );

    res.json({
      success: true,
      message: `Table ${is_available ? 'marquée comme disponible' : 'marquée comme indisponible'}`
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
// DELETE - Supprimer une table
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    // Only owner can delete tables
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Seul le propriétaire peut supprimer des tables'
      });
    }

    const { id } = req.params;

    // Verify table exists and belongs to tenant
    const [table] = await query(
      'SELECT id FROM restaurant_tables WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Table introuvable'
      });
    }

    // Check if table has active reservations
    const [activeReservation] = await query(
      `SELECT id FROM appointments
       WHERE tenant_id = ? AND table_id = ? AND status IN ('pending', 'confirmed')
       AND appointment_date >= CURDATE()`,
      [req.tenantId, id]
    );

    if (activeReservation) {
      return res.status(409).json({
        success: false,
        error: 'Impossible de supprimer une table avec des réservations actives'
      });
    }

    await query(
      'DELETE FROM restaurant_tables WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    res.json({
      success: true,
      message: 'Table supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression table:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;
