const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

// Basic isPro middleware
const isPro = async (req, res, next) => {
    const { query } = require("../config/database");
    try {
        const [tenant] = await query("SELECT subscription_plan FROM tenants WHERE id = ?", [req.user?.tenant_id || req.tenantId]);
        if (tenant && !['pro', 'professional', 'custom', 'enterprise', 'PRO', 'CUSTOM'].includes(tenant.subscription_plan)) {
            return res.status(403).json({ error: 'Upgrade to PRO required' });
        }
    } catch (e) {
        // tolerate missing column
    }
    next();
};

const auth = [authMiddleware, tenantMiddleware];
// --- ADMIN ROUTES (Shop Management) - Requires Login + Pro Plan ---

// Manage Categories
router.post('/admin/categories', auth, isPro, async (req, res) => {
    try {
        const result = await query("INSERT INTO categories (tenant_id, name) VALUES (?, ?)", [req.tenantId, req.body.name]);
        res.status(201).json({ id: result.insertId, name: req.body.name, tenant_id: req.tenantId });
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.get('/admin/categories', auth, async (req, res) => {
     try {
        const categories = await query("SELECT * FROM categories WHERE tenant_id = ?", [req.tenantId]);
        res.json(categories);
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.put('/admin/categories/:id', auth, isPro, async (req, res) => {
    try {
        await query("UPDATE categories SET name = ? WHERE id = ? AND tenant_id = ?", [req.body.name, req.params.id, req.tenantId]);
        res.json({ id: req.params.id, name: req.body.name, tenant_id: req.tenantId });
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.delete('/admin/categories/:id', auth, isPro, async (req, res) => {
    try {
        await query("DELETE FROM categories WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId]);
        res.json({ success: true });
    } catch(err) { res.status(500).json({error: err.message}); }
});

// Manage Products
router.post('/admin/products', auth, isPro, async (req, res) => {
    try {
        const { name, description, price, stock, categoryId, images } = req.body;
        const imgs = images ? JSON.stringify(images) : '[]';
        const result = await query(
            "INSERT INTO products (tenant_id, name, description, price, stock, category_id, images) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [req.tenantId, name, description, price, stock, categoryId || null, imgs]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.get('/admin/products', auth, async (req, res) => {
     try {
        const products = await query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.tenant_id = ?
        `, [req.tenantId]);
        
        // Map to format UI expects
        const mappedProducts = products.map(p => ({
            ...p,
            _id: p.id,
            images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
            categoryId: p.category_id ? { _id: p.category_id, name: p.category_name } : null
        }));
        
        res.json(mappedProducts);
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.put('/admin/products/:id', auth, isPro, async (req, res) => {
     try {
        const { name, description, price, stock, categoryId, images, is_active } = req.body;
        const imgs = images ? JSON.stringify(images) : null;
        
        let updateSql = "UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category_id = ?";
        const params = [name, description, price, stock, categoryId || null];
        
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
        res.json({ _id: req.params.id, ...req.body });
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.delete('/admin/products/:id', auth, isPro, async (req, res) => {
    try {
        await query("DELETE FROM products WHERE id = ? AND tenant_id = ?", [req.params.id, req.tenantId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({error: err.message}); }
});

// Manage Orders
router.get('/admin/orders', auth, isPro, async (req, res) => {
     try {
        const orders = await query("SELECT * FROM orders WHERE tenant_id = ? ORDER BY created_at DESC", [req.tenantId]);
        
        for (let order of orders) {
            const items = await query(`
                SELECT oi.*, p.name, p.images 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = ?
            `, [order.id]);
            
            order._id = order.id;
            order.createdAt = order.created_at;
            order.totalAmount = order.total_amount;
            order.client = { name: order.client_name, phone: order.client_phone };
            order.items = items.map(i => ({
                productId: { name: i.name, images: typeof i.images === 'string' ? JSON.parse(i.images) : i.images },
                quantity: i.quantity,
                priceAtPurchase: i.price_at_purchase
            }));
        }
        res.json(orders);
    } catch(err) { res.status(500).json({error: err.message}); }
});

router.put('/admin/orders/:id/status', auth, isPro, async (req, res) => {
    try {
        const { status } = req.body;
        await query("UPDATE orders SET status = ? WHERE id = ? AND tenant_id = ?", [status, req.params.id, req.tenantId]);
        res.json({ _id: req.params.id, status });
    } catch(err) { res.status(500).json({error: err.message}); }
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
    
    const products = await query(sql, params);
    res.json(products);
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
  try {
    const { items, guestInfo, clientId, paymentMethod } = req.body;
    
    // Calculate total amount
    let totalAmount = 0;
    const processedItems = [];
    
    for (const item of items) {
      const [products] = await query("SELECT * FROM products WHERE id = ?", [item.productId]);
      const product = products ? products[0] : null;

      if (!product || !product.is_active) {
        return res.status(400).json({ error: `Product ${item.productId} unavailable` });
      }
      if (product.stock < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
      
      const priceAtPurchase = product.price;
      totalAmount += priceAtPurchase * item.quantity;
      processedItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price_at_purchase: priceAtPurchase
      });
      
      // Reduce stock
      await query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, product.id]);
    }

    const status = paymentMethod === 'PAYGATE' ? 'PENDING' : 'PENDING';
    const clientName = guestInfo?.name || '';
    const clientPhone = guestInfo?.phone || '';

    const orderResult = await query(
      "INSERT INTO orders (tenant_id, client_name, client_phone, total_amount, status, payment_method) VALUES (?, ?, ?, ?, ?, ?)",
      [req.params.tenantId, clientName, clientPhone, totalAmount, status, paymentMethod]
    );

    const orderId = orderResult.insertId;

    for (const pItem of processedItems) {
        await query(
            "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)",
            [orderId, pItem.product_id, pItem.quantity, pItem.price_at_purchase]
        );
    }
    
    res.status(201).json({ id: orderId, totalAmount, status });
  } catch (error) {
     console.error(error);
    res.status(500).json({ error: 'Server error creating order' });
  }
});

module.exports = router;
