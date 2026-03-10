/**
 * SALONHUB - Routes Restaurant Orders
 * Gestion des commandes pour les restaurants
 * Requires Migration 002 (restaurant_orders tables)
 */

const express = require('express');
const router = express.Router();
const { query, transaction } = require('../../config/database');
const { authMiddleware } = require('../../middleware/auth');
const { tenantMiddleware } = require('../../middleware/tenant');
const { businessTypeMiddleware, requireBusinessType } = require('../../middleware/businessType');

// Apply middlewares to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(businessTypeMiddleware);
router.use(requireBusinessType('restaurant'));

// ==========================================
// GET - Liste toutes les commandes
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { status, order_date, order_type } = req.query;

    let sql = `
      SELECT
        o.id, o.order_number, o.order_type, o.guest_count,
        o.subtotal, o.tax_amount, o.tip_amount, o.discount_amount, o.total_amount,
        o.status, o.payment_status, o.payment_method,
        o.order_date, o.order_time, o.notes,
        o.created_at, o.updated_at, o.completed_at,
        t.table_number, t.section as table_section,
        c.first_name as client_first_name, c.last_name as client_last_name,
        s.first_name as staff_first_name, s.last_name as staff_last_name
      FROM restaurant_orders o
      LEFT JOIN restaurant_tables t ON o.table_id = t.id
      LEFT JOIN clients c ON o.client_id = c.id
      LEFT JOIN users s ON o.staff_id = s.id
      WHERE o.tenant_id = ?
    `;

    const params = [req.tenantId];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    if (order_date) {
      sql += ' AND o.order_date = ?';
      params.push(order_date);
    }

    if (order_type) {
      sql += ' AND o.order_type = ?';
      params.push(order_type);
    }

    sql += ' ORDER BY o.order_date DESC, o.order_time DESC';

    const orders = await query(sql, params);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// GET - Commandes actives (today + active statuses)
// ==========================================
router.get('/active', async (req, res) => {
  try {
    const orders = await query(
      `SELECT
        o.id, o.order_number, o.order_type, o.guest_count,
        o.subtotal, o.total_amount, o.status, o.payment_status,
        o.order_date, o.order_time,
        t.table_number, t.section as table_section,
        COUNT(oi.id) as item_count
      FROM restaurant_orders o
      LEFT JOIN restaurant_tables t ON o.table_id = t.id
      LEFT JOIN restaurant_order_items oi ON o.id = oi.order_id
      WHERE o.tenant_id = ?
        AND o.order_date = CURDATE()
        AND o.status IN ('pending', 'confirmed', 'preparing', 'ready', 'served')
      GROUP BY o.id
      ORDER BY o.order_time DESC`,
      [req.tenantId]
    );

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Erreur récupération commandes actives:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// GET - Détails d'une commande avec items
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get order details
    const [order] = await query(
      `SELECT
        o.*,
        t.table_number, t.table_name, t.section as table_section,
        c.first_name as client_first_name, c.last_name as client_last_name,
        c.email as client_email, c.phone as client_phone,
        s.first_name as staff_first_name, s.last_name as staff_last_name
      FROM restaurant_orders o
      LEFT JOIN restaurant_tables t ON o.table_id = t.id
      LEFT JOIN clients c ON o.client_id = c.id
      LEFT JOIN users s ON o.staff_id = s.id
      WHERE o.id = ? AND o.tenant_id = ?`,
      [id, req.tenantId]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Commande introuvable'
      });
    }

    // Get order items
    const items = await query(
      `SELECT
        oi.id, oi.menu_item_name, oi.quantity, oi.unit_price, oi.subtotal,
        oi.status, oi.special_instructions,
        m.id as menu_item_id, m.category
      FROM restaurant_order_items oi
      LEFT JOIN restaurant_menus m ON oi.menu_item_id = m.id
      WHERE oi.order_id = ? AND oi.tenant_id = ?
      ORDER BY oi.id`,
      [id, req.tenantId]
    );

    res.json({
      success: true,
      data: {
        ...order,
        items
      }
    });
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// POST - Créer une nouvelle commande
// ==========================================
router.post('/', async (req, res) => {
  try {
    const {
      table_id,
      client_id,
      order_type,
      guest_count,
      items, // Array of { menu_item_id, quantity, special_instructions }
      notes
    } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Au moins un item est requis'
      });
    }

    if (!order_type) {
      return res.status(400).json({
        success: false,
        error: 'Type de commande requis'
      });
    }

    // Generate order number
    const orderDate = new Date();
    const orderDateStr = orderDate.toISOString().split('T')[0];
    const orderTimeStr = orderDate.toTimeString().split(' ')[0];

    // Get count of today's orders to generate unique order number
    const [{ count }] = await query(
      'SELECT COUNT(*) as count FROM restaurant_orders WHERE tenant_id = ? AND order_date = CURDATE()',
      [req.tenantId]
    );

    const orderNumber = `ORD-${orderDateStr.replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

    // Use transaction to create order and items
    const result = await transaction(async (connection) => {
      // 1. Calculate totals from menu prices
      let subtotal = 0;
      const itemsWithPrices = [];

      for (const item of items) {
        // Support both menu_item_id and menu_id for backwards compatibility
        const menuItemId = item.menu_item_id || item.menu_id;

        if (!menuItemId) {
          throw new Error('menu_item_id ou menu_id requis pour chaque item');
        }

        const [menuItems] = await connection.query(
          'SELECT id, name, price FROM restaurant_menus WHERE id = ? AND tenant_id = ? AND is_active = TRUE',
          [menuItemId, req.tenantId]
        );

        if (!menuItems || menuItems.length === 0) {
          throw new Error(`Item de menu ${menuItemId} introuvable`);
        }

        const menuItem = menuItems[0];
        const itemSubtotal = parseFloat(menuItem.price) * parseInt(item.quantity);
        subtotal += itemSubtotal;

        itemsWithPrices.push({
          menu_item_id: menuItem.id,
          menu_item_name: menuItem.name,
          quantity: item.quantity,
          unit_price: parseFloat(menuItem.price),
          subtotal: itemSubtotal,
          special_instructions: item.special_instructions || null
        });
      }

      // Calculate tax (example: 10%)
      const taxRate = 0.10;
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      // 2. Create order
      const [orderResult] = await connection.query(
        `INSERT INTO restaurant_orders (
          tenant_id, order_number, table_id, client_id, staff_id,
          order_type, guest_count, subtotal, tax_amount, total_amount,
          order_date, order_time, notes, status, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid')`,
        [
          req.tenantId,
          orderNumber,
          table_id || null,
          client_id || null,
          req.user.id, // staff who created the order
          order_type,
          guest_count || null,
          subtotal,
          taxAmount,
          totalAmount,
          orderDateStr,
          orderTimeStr,
          notes || null
        ]
      );

      const orderId = orderResult.insertId;

      // 3. Create order items
      for (const item of itemsWithPrices) {
        await connection.query(
          `INSERT INTO restaurant_order_items (
            tenant_id, order_id, menu_item_id, menu_item_name,
            quantity, unit_price, subtotal, special_instructions
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.tenantId,
            orderId,
            item.menu_item_id,
            item.menu_item_name,
            item.quantity,
            item.unit_price,
            item.subtotal,
            item.special_instructions
          ]
        );
      }

      return { orderId, orderNumber };
    });

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: {
        id: result.orderId,
        order_number: result.orderNumber
      }
    });
  } catch (error) {
    console.error('Erreur création commande:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur'
    });
  }
});

// ==========================================
// PATCH - Mettre à jour le statut de la commande
// ==========================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide'
      });
    }

    // Verify order exists
    const [order] = await query(
      'SELECT id FROM restaurant_orders WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Commande introuvable'
      });
    }

    // Update status and set completed_at if status is completed
    const updates = ['status = ?', 'updated_at = NOW()'];
    const params = [status];

    if (status === 'completed') {
      updates.push('completed_at = NOW()');
    }

    params.push(id, req.tenantId);

    await query(
      `UPDATE restaurant_orders SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Statut de la commande mis à jour'
    });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// PATCH - Mettre à jour le paiement
// ==========================================
router.patch('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, payment_method, tip_amount, discount_amount } = req.body;

    const validPaymentStatuses = ['unpaid', 'partial', 'paid', 'refunded'];

    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        error: 'Statut de paiement invalide'
      });
    }

    // Verify order exists
    const [order] = await query(
      'SELECT subtotal, tax_amount FROM restaurant_orders WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Commande introuvable'
      });
    }

    // Build dynamic update
    const updates = [];
    const params = [];

    if (payment_status !== undefined) {
      updates.push('payment_status = ?');
      params.push(payment_status);
    }

    if (payment_method !== undefined) {
      updates.push('payment_method = ?');
      params.push(payment_method || null);
    }

    if (tip_amount !== undefined) {
      updates.push('tip_amount = ?');
      params.push(tip_amount);
    }

    if (discount_amount !== undefined) {
      updates.push('discount_amount = ?');
      params.push(discount_amount);
    }

    // Recalculate total if tip or discount changed
    if (tip_amount !== undefined || discount_amount !== undefined) {
      const newTip = tip_amount !== undefined ? tip_amount : 0;
      const newDiscount = discount_amount !== undefined ? discount_amount : 0;
      const newTotal = order.subtotal + order.tax_amount + newTip - newDiscount;

      updates.push('total_amount = ?');
      params.push(newTotal);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée de paiement à mettre à jour'
      });
    }

    updates.push('updated_at = NOW()');
    params.push(id, req.tenantId);

    await query(
      `UPDATE restaurant_orders SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Paiement mis à jour'
    });
  } catch (error) {
    console.error('Erreur mise à jour paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==========================================
// DELETE - Annuler une commande
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify order exists and is cancellable
    const [order] = await query(
      'SELECT id, status FROM restaurant_orders WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Commande introuvable'
      });
    }

    if (['completed', 'cancelled'].includes(order.status)) {
      return res.status(409).json({
        success: false,
        error: 'Impossible d\'annuler une commande déjà terminée ou annulée'
      });
    }

    // Soft delete by changing status to cancelled
    await query(
      'UPDATE restaurant_orders SET status = \'cancelled\', updated_at = NOW() WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );

    res.json({
      success: true,
      message: 'Commande annulée avec succès'
    });
  } catch (error) {
    console.error('Erreur annulation commande:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;
