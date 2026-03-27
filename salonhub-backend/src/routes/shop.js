const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authMiddleware, featureMiddleware, permissionMiddleware } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');
const notifyService = require('../services/notifyService');

const shopFeatureGate = featureMiddleware('shop');

const auth = [authMiddleware, tenantMiddleware];
const canManageShop = permissionMiddleware('can_manage_shop');
const adminAuth = [...auth, canManageShop];
// --- ADMIN ROUTES (Shop Management) - Requires Login + Pro Plan ---

// Manage Categories
router.post('/admin/categories', adminAuth, shopFeatureGate, async (req, res) => {
    try {
        const result = await query("INSERT INTO categories (tenant_id, name) VALUES (?, ?)", [req.tenantId, req.body.name]);
        res.status(201).json({ id: result.insertId, name: req.body.name, tenant_id: req.tenantId });
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.get('/admin/categories', adminAuth, async (req, res) => {
     try {
        const categories = await query("SELECT * FROM categories WHERE tenant_id = ?", [req.tenantId]);
        res.json(categories);
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.put('/admin/categories/:id', adminAuth, shopFeatureGate, async (req, res) => {
    try {
        await query("UPDATE categories SET name = ? WHERE id = ? AND tenant_id = ?", [req.body.name, req.params.id, req.tenantId]);
        res.json({ id: parseInt(req.params.id), name: req.body.name, tenant_id: req.tenantId });
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.delete('/admin/categories/:id', adminAuth, shopFeatureGate, async (req, res) => {
    try {
        await query("DELETE FROM categories WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({error: err.message}); }
});

// Manage Products
router.post('/admin/products', adminAuth, shopFeatureGate, async (req, res) => {
    try {
        const { name, description, price, stock, categoryId, images } = req.body;
        
        if (categoryId) {
            const catCheck = await query("SELECT id FROM categories WHERE id = ? AND tenant_id = ?", [categoryId, req.tenantId]);
            if (catCheck.length === 0) {
                return res.status(400).json({ error: 'Catégorie invalide pour cet établissement' });
            }
        }
        
        const imgs = images ? JSON.stringify(images) : '[]';
        const result = await query(
            "INSERT INTO products (tenant_id, name, description, price, stock, category_id, images) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [req.tenantId, name, description || null, price, stock || 0, categoryId || null, imgs]
        );

        // Return the full product with category info
        const newProduct = await query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ?
        `, [result.insertId]);

        res.status(201).json(newProduct[0] || { id: result.insertId, name, description, price, stock, category_id: categoryId || null });
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.get('/admin/products', adminAuth, async (req, res) => {
     try {
        const products = await query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.tenant_id = ?
            ORDER BY p.created_at DESC
        `, [req.tenantId]);
        
        // Parse images JSON
        const mappedProducts = products.map(p => ({
            ...p,
            images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []),
        }));
        
        res.json(mappedProducts);
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.put('/admin/products/:id', adminAuth, shopFeatureGate, async (req, res) => {
     try {
        const { name, description, price, stock, categoryId, images, is_active } = req.body;
        
        if (categoryId) {
            const catCheck = await query("SELECT id FROM categories WHERE id = ? AND tenant_id = ?", [categoryId, req.tenantId]);
            if (catCheck.length === 0) {
                return res.status(400).json({ error: 'Catégorie invalide pour cet établissement' });
            }
        }
        
        const imgs = images ? JSON.stringify(images) : null;
        
        let updateSql = "UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category_id = ?";
        const params = [name, description || null, price, stock, categoryId || null];
        
        if (imgs) {
            updateSql += ", images = ?";
            params.push(imgs);
        }
        
        if (typeof is_active !== 'undefined') {
             updateSql += ", is_active = ?";
             params.push(is_active);
        }
        
        updateSql += " WHERE id = ? AND tenant_id = ?";
        params.push(req.params.id, req.tenantId);
        
        await query(updateSql, params);

        // Return the updated product with category info
        const updated = await query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ? AND p.tenant_id = ?
        `, [req.params.id, req.tenantId]);

        res.json(updated[0] || { id: parseInt(req.params.id), name, description, price, stock });
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.delete('/admin/products/:id', adminAuth, shopFeatureGate, async (req, res) => {
    try {
        await query("DELETE FROM products WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({error: err.message}); }
});

// Manage Orders
router.get('/admin/orders', adminAuth, shopFeatureGate, async (req, res) => {
     try {
        const orders = await query("SELECT * FROM orders WHERE tenant_id = ? ORDER BY created_at DESC", [req.tenantId]);
        
        for (let order of orders) {
            const items = await query(`
                SELECT oi.*, p.name as product_name, p.images as product_images 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = ?
            `, [order.id]);
            
            order.items = items.map(i => ({
                product_id: i.product_id,
                product_name: i.product_name,
                product_images: typeof i.product_images === 'string' ? JSON.parse(i.product_images) : (i.product_images || []),
                quantity: i.quantity,
                price_at_purchase: i.price_at_purchase
            }));
        }
        res.json(orders);
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.put('/admin/orders/:id/status', adminAuth, shopFeatureGate, async (req, res) => {
    const { transaction } = require('../config/database');
    try {
        const { status: newStatus } = req.body;
        const orderId = req.params.id;

        await transaction(async (connection) => {
            // Get current order state
            const [orderRows] = await connection.query(
                "SELECT status, total_amount, tenant_id FROM orders WHERE id = ? AND tenant_id = ? FOR UPDATE",
                [orderId, req.tenantId]
            );
            const order = orderRows[0];

            if (!order) {
                throw new Error('ORDER_NOT_FOUND');
            }

            const oldStatus = order.status;

            // Update status
            await connection.query(
                "UPDATE orders SET status = ? WHERE id = ?",
                [newStatus, orderId]
            );

            // Accounting: if status changes to COMPLETED and wasn't before
            if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
                // 1. Update Wallet Balance
                await connection.query(
                    "UPDATE wallets SET balance = balance + ? WHERE tenant_id = ?",
                    [order.total_amount, req.tenantId]
                );

                // 2. Create Transaction record
                await connection.query(
                    `INSERT INTO transactions 
                    (tenant_id, type, amount, reference_model, reference_id, status) 
                    VALUES (?, 'PAYMENT', ?, 'orders', ?, 'SUCCESS')`,
                    [req.tenantId, order.total_amount, orderId]
                );
            }
            
            // Revert point: if status was COMPLETED and changes to something else (e.g. CANCELLED by mistake)
            // We might want to deduct, but usually shop orders in COMPLETED are final.
            // For now, only handle the positive side (crediting).
        });

        res.json({ id: parseInt(orderId), status: newStatus });
    } catch(err) { 
        console.error('Error updating order status:', err);
        res.status(err.message === 'ORDER_NOT_FOUND' ? 404 : 500).json({error: err.message}); 
    }
});

// --- PUBLIC ROUTES (Shop browsing) ---

// Get all active products for a salon
router.get('/:tenantId/products', async (req, res) => {
  try {
    const { categoryId } = req.query;
    const params = [req.params.tenantId];
    let sql = `SELECT p.*, c.name as category_name 
               FROM products p
               LEFT JOIN categories c ON p.category_id = c.id
               WHERE p.tenant_id = ? AND p.is_active = true`;
    
    if (categoryId) {
        sql += ` AND p.category_id = ?`;
        params.push(categoryId);
    }
    
    sql += ` ORDER BY p.created_at DESC`;
    
    const products = await query(sql, params);
    
    // Parse images JSON for public consumption
    const mapped = products.map(p => ({
        ...p,
        images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []),
    }));
    
    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all categories for a salon
router.get('/:tenantId/categories', async (req, res) => {
  try {
    const categories = await query("SELECT * FROM categories WHERE tenant_id = ?", [req.params.tenantId]);
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Place a new order
router.post('/:tenantId/orders', async (req, res) => {
  const { transaction } = require('../config/database');
  console.log(`🛒 New order request for tenant ${req.params.tenantId}`);
  
  try {
    const { items, guestInfo, clientId, paymentMethod } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Le panier est vide' });
    }

    const result = await transaction(async (connection) => {
      let totalAmount = 0;
      const processedItems = [];
      
      for (const item of items) {
        console.log(`  - Checking product ${item.productId}`);
        const [productRows] = await connection.query("SELECT * FROM products WHERE id = ? AND tenant_id = ? FOR UPDATE", [item.productId, req.params.tenantId]);
        const product = productRows[0] || null;

        if (!product || !product.is_active) {
          throw new Error(`PRODUCT_NOT_AVAILABLE:${item.productId}`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        }
        
        const priceAtPurchase = parseFloat(product.price) || 0;
        totalAmount += priceAtPurchase * item.quantity;
        processedItems.push({
          product_id: product.id,
          quantity: item.quantity,
          price_at_purchase: priceAtPurchase,
          name: product.name
        });
        
        // Reduce stock
        console.log(`  - Updating stock for ${product.name}`);
        await connection.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, product.id]);
      }

      const clientName = guestInfo?.name || '';
      const clientPhone = guestInfo?.phone || '';
      const clientAddress = guestInfo?.address || null;

      console.log(`  - Inserting order for ${clientName}`);
      const [orderResult] = await connection.query(
        "INSERT INTO orders (tenant_id, client_name, client_phone, client_address, total_amount, status, payment_method) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)",
        [req.params.tenantId, clientName, clientPhone, clientAddress, totalAmount, paymentMethod || 'EN_ATTENTE']
      );

      const orderId = orderResult.insertId;
      console.log(`  ✅ Order created: ID ${orderId}`);

      for (const pItem of processedItems) {
          console.log(`  - Inserting order item for product ${pItem.product_id}`);
          await connection.query(
              "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)",
              [orderId, pItem.product_id, pItem.quantity, pItem.price_at_purchase]
          );
      }

      return { orderId, totalAmount, clientName, clientPhone, processedItems };
    });

    const { orderId, totalAmount, clientName, clientPhone, processedItems } = result;

    // Notify salon owner of new order via Socket.io + Push (non-blocking)
    const itemCount = processedItems.reduce((sum, i) => sum + i.quantity, 0);
    const formattedTotal = new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(totalAmount);

    console.log(`  - Sending notification for order ${orderId}`);
    notifyService.notifyTenant(
      req.io,
      parseInt(req.params.tenantId),
      'new_shop_order',
      {
        orderId,
        clientName: clientName || 'Client anonyme',
        clientPhone,
        totalAmount,
        itemCount,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      {
        title: '🛍️ Nouvelle commande boutique',
        body: `${clientName || 'Un client'} a passé une commande de ${formattedTotal} FCFA (${itemCount} article${itemCount > 1 ? 's' : ''})`,
        data: { type: 'shop_order', orderId: String(orderId) }
      }
    ).catch(notifErr => {
      console.error('  ⚠️ Notification non envoyée (non bloquant):', notifErr.message);
    });
    
    console.log(`  🎉 Submitting final response for order ${orderId}`);
    res.status(201).json({ id: orderId, totalAmount, status: 'PENDING' });

  } catch (error) {
    if (error.message.startsWith('PRODUCT_NOT_AVAILABLE:')) {
      return res.status(400).json({ error: `Produit non disponible` });
    }
    if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
      return res.status(400).json({ error: `Stock insuffisant pour cette commande` });
    }
    console.error('❌ Erreur création commande:', error.message, error.stack);
    res.status(500).json({ error: 'Erreur serveur lors de la création de la commande' });
  }
});

module.exports = router;
