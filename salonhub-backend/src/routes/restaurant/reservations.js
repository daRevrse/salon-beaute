/**
 * SALONHUB - Routes Restaurant Reservations
 * Gestion des réservations de tables pour les restaurants
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
// Log business type for debugging and allow restaurant businesses
router.use((req, res, next) => {
  console.log(`[Reservations Middleware] tenantId: ${req.tenantId}, businessType: ${req.businessType}`);
  // Allow restaurant business type (be flexible with case/variations)
  if (req.businessType && req.businessType.toLowerCase().includes('restaurant')) {
    return next();
  }
  // Also allow if businessType is not set (for backwards compatibility)
  if (!req.businessType) {
    console.log(`[Reservations Middleware] No business type set, allowing access`);
    return next();
  }
  // Otherwise, use the standard requireBusinessType check
  return requireBusinessType('restaurant')(req, res, next);
});

// ==========================================
// GET - Liste toutes les réservations
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { status, date, from_date, to_date } = req.query;

    console.log(`[Reservations] Fetching reservations for tenant ${req.tenantId}, status: ${status}, date: ${date}`);

    let sql = `
      SELECT
        r.id, r.table_id, r.reservation_date, r.reservation_time, r.party_size,
        r.customer_name, r.customer_email, r.customer_phone, r.special_requests,
        r.confirmation_code, r.status, r.created_at, r.updated_at,
        t.table_number, t.section
      FROM restaurant_reservations r
      LEFT JOIN restaurant_tables t ON r.table_id = t.id
      WHERE r.tenant_id = ?
    `;
    const params = [req.tenantId];

    // Filter by status (supports comma-separated values like "pending,confirmed,seated")
    if (status && status !== 'all') {
      const statusArray = status.split(',').map(s => s.trim());
      if (statusArray.length === 1) {
        sql += ' AND r.status = ?';
        params.push(statusArray[0]);
      } else {
        sql += ` AND r.status IN (${statusArray.map(() => '?').join(',')})`;
        params.push(...statusArray);
      }
    }

    // Filter by specific date
    if (date) {
      sql += ' AND r.reservation_date = ?';
      params.push(date);
    }

    // Filter by date range
    if (from_date) {
      sql += ' AND r.reservation_date >= ?';
      params.push(from_date);
    }
    if (to_date) {
      sql += ' AND r.reservation_date <= ?';
      params.push(to_date);
    }

    sql += ' ORDER BY r.reservation_date DESC, r.reservation_time ASC';

    console.log(`[Reservations] SQL: ${sql}`);
    console.log(`[Reservations] Params:`, params);

    const reservations = await query(sql, params);
    console.log(`[Reservations] Found ${reservations.length} reservations`);

    // Count by status
    const countSql = `
      SELECT status, COUNT(*) as count
      FROM restaurant_reservations
      WHERE tenant_id = ?
      GROUP BY status
    `;
    const statusCounts = await query(countSql, [req.tenantId]);

    // Today's reservations count
    const todayCountSql = `
      SELECT COUNT(*) as count
      FROM restaurant_reservations
      WHERE tenant_id = ? AND reservation_date = CURDATE() AND status NOT IN ('cancelled', 'no_show')
    `;
    const [todayCount] = await query(todayCountSql, [req.tenantId]);

    res.json({
      success: true,
      data: reservations,
      stats: {
        today: todayCount?.count || 0,
        byStatus: statusCounts.reduce((acc, s) => {
          acc[s.status] = s.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Erreur récupération réservations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// GET - Détails d'une réservation
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [reservation] = await query(
      `SELECT
        r.*, t.table_number, t.section, t.capacity
      FROM restaurant_reservations r
      LEFT JOIN restaurant_tables t ON r.table_id = t.id
      WHERE r.id = ? AND r.tenant_id = ?`,
      [id, req.tenantId]
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Réservation introuvable'
      });
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Erreur récupération réservation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// PATCH - Mettre à jour le statut d'une réservation
// ==========================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}`
      });
    }

    // Verify reservation exists and belongs to tenant
    const [reservation] = await query(
      'SELECT id, table_id FROM restaurant_reservations WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Réservation introuvable'
      });
    }

    await query(
      'UPDATE restaurant_reservations SET status = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?',
      [status, id, req.tenantId]
    );

    // If status is 'seated', mark table as unavailable
    if (status === 'seated' && reservation.table_id) {
      await query(
        'UPDATE restaurant_tables SET is_available = 0, updated_at = NOW() WHERE id = ? AND tenant_id = ?',
        [reservation.table_id, req.tenantId]
      );
    }

    // If status is 'completed' or 'cancelled' or 'no_show', mark table as available
    if (['completed', 'cancelled', 'no_show'].includes(status) && reservation.table_id) {
      await query(
        'UPDATE restaurant_tables SET is_available = 1, updated_at = NOW() WHERE id = ? AND tenant_id = ?',
        [reservation.table_id, req.tenantId]
      );
    }

    const statusLabels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      seated: 'Client installé',
      completed: 'Terminée',
      cancelled: 'Annulée',
      no_show: 'Absent'
    };

    res.json({
      success: true,
      message: `Réservation marquée comme: ${statusLabels[status]}`
    });
  } catch (error) {
    console.error('Erreur mise à jour statut réservation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// PUT - Modifier une réservation
// ==========================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      table_id,
      reservation_date,
      reservation_time,
      party_size,
      customer_name,
      customer_email,
      customer_phone,
      special_requests
    } = req.body;

    // Verify reservation exists and belongs to tenant
    const [reservation] = await query(
      'SELECT id FROM restaurant_reservations WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Réservation introuvable'
      });
    }

    // Build dynamic update query
    const updates = [];
    const params = [];

    if (table_id !== undefined) {
      updates.push('table_id = ?');
      params.push(table_id);
    }
    if (reservation_date) {
      updates.push('reservation_date = ?');
      params.push(reservation_date);
    }
    if (reservation_time) {
      updates.push('reservation_time = ?');
      params.push(reservation_time);
    }
    if (party_size !== undefined) {
      updates.push('party_size = ?');
      params.push(party_size);
    }
    if (customer_name) {
      updates.push('customer_name = ?');
      params.push(customer_name);
    }
    if (customer_email !== undefined) {
      updates.push('customer_email = ?');
      params.push(customer_email);
    }
    if (customer_phone) {
      updates.push('customer_phone = ?');
      params.push(customer_phone);
    }
    if (special_requests !== undefined) {
      updates.push('special_requests = ?');
      params.push(special_requests);
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
      `UPDATE restaurant_reservations SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Réservation modifiée avec succès'
    });
  } catch (error) {
    console.error('Erreur modification réservation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// DELETE - Supprimer une réservation
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify reservation exists and belongs to tenant
    const [reservation] = await query(
      'SELECT id FROM restaurant_reservations WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Réservation introuvable'
      });
    }

    await query(
      'DELETE FROM restaurant_reservations WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    res.json({
      success: true,
      message: 'Réservation supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression réservation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;
