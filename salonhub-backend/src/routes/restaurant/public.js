/**
 * RESTAURANT PUBLIC ROUTES
 * Routes publiques pour les clients (sans authentification)
 * - Consultation menu
 * - Réservation de table
 * - Commande takeaway/delivery
 * - QR Code table
 */

const express = require('express');
const router = express.Router();
const { query, transaction } = require('../../config/database');
const { checkPublicSubscription } = require('../../middleware/tenant');

// Debug middleware - log all requests to this router
router.use((req, res, next) => {
  console.log(`[Restaurant Public Router] ${req.method} ${req.originalUrl}`);
  next();
});

// ==========================================
// Helper: Extraire opening_time et closing_time depuis opening_hours JSON
// ==========================================
function extractOpeningTimes(openingHours) {
  // Valeurs par défaut
  let opening_time = "11:00";
  let closing_time = "23:00";

  if (!openingHours) return { opening_time, closing_time };

  // Parser si c'est une string
  let hours = openingHours;
  if (typeof openingHours === 'string') {
    try {
      hours = JSON.parse(openingHours);
    } catch (e) {
      return { opening_time, closing_time };
    }
  }

  // Trouver le jour actuel ou utiliser le premier jour trouvé
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const daySchedule = hours[today] || Object.values(hours)[0];

  if (daySchedule && !daySchedule.closed) {
    opening_time = daySchedule.open || opening_time;
    closing_time = daySchedule.close || closing_time;
  }

  return { opening_time, closing_time };
}

// ==========================================
// Helper: Transformer menu item pour le frontend
// ==========================================
function transformMenuItem(item) {
  // Parse allergens if string
  if (item.allergens && typeof item.allergens === 'string') {
    try {
      item.allergens = JSON.parse(item.allergens);
    } catch (e) {
      item.allergens = [];
    }
  }

  // Ajouter spicy_level (0 par défaut car la colonne is_spicy n'existe pas)
  item.spicy_level = 0;
  item.is_available = true;

  return item;
}

// ==========================================
// GET /api/public/restaurant/:slug - Infos restaurant
// Vérifie que l'abonnement est actif
// ==========================================
router.get('/:slug', checkPublicSubscription('slug'), async (req, res) => {
  try {
    console.log(`[Restaurant Public] Fetching restaurant with slug: ${req.params.slug}`);

    // Requête sans restriction business_type - permet aux tenants restaurant d'être trouvés
    const tenants = await query(
      `SELECT
        t.id, t.name, t.slug, t.business_type, t.logo_url, t.banner_url,
        t.phone, t.email, t.address, t.city, t.postal_code,
        t.description, t.opening_hours, t.currency, t.subscription_status, t.is_active
      FROM tenants t
      WHERE t.slug = ?`,
      [req.params.slug]
    );

    console.log(`[Restaurant Public] Found ${tenants.length} tenants for slug: ${req.params.slug}`);

    if (tenants.length === 0) {
      console.log(`[Restaurant Public] No tenant found with slug: ${req.params.slug}`);
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    const tenant = tenants[0];
    console.log(`[Restaurant Public] Tenant found: ${tenant.name}, business_type: ${tenant.business_type}, is_active: ${tenant.is_active}`);

    // Vérifier que le tenant est actif
    if (!tenant.is_active) {
      console.log(`[Restaurant Public] Tenant ${tenant.name} is not active`);
      return res.status(404).json({
        success: false,
        error: 'Restaurant is not active'
      });
    }

    // Extraire opening_time et closing_time depuis opening_hours
    const { opening_time, closing_time } = extractOpeningTimes(tenant.opening_hours);

    // Parser opening_hours si c'est une string JSON
    let opening_hours = tenant.opening_hours;
    if (opening_hours && typeof opening_hours === 'string') {
      try {
        opening_hours = JSON.parse(opening_hours);
      } catch (e) {
        opening_hours = null;
      }
    }

    // Construire la réponse avec les champs attendus par le frontend
    res.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        business_name: tenant.name, // Alias pour le frontend
        slug: tenant.slug,
        business_type: tenant.business_type,
        logo_url: tenant.logo_url,
        banner_url: tenant.banner_url,
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address,
        city: tenant.city,
        postal_code: tenant.postal_code,
        description: tenant.description,
        currency: tenant.currency || 'EUR',
        opening_hours: opening_hours,
        opening_time: opening_time, // Champ attendu par frontend
        closing_time: closing_time  // Champ attendu par frontend
      }
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch restaurant' });
  }
});

// ==========================================
// GET /api/public/restaurant/:slug/menu - Menu complet
// Vérifie que l'abonnement est actif
// ==========================================
router.get('/:slug/menu', checkPublicSubscription('slug'), async (req, res) => {
  try {
    // Get tenant
    const tenants = await query(
      `SELECT id, currency FROM tenants
       WHERE slug = ? AND is_active = TRUE`,
      [req.params.slug]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    const tenantId = tenants[0].id;
    const currency = tenants[0].currency || 'EUR';

    // Get menu items grouped by category
    const menuItems = await query(
      `SELECT
        id, name, description, price, category,
        image_url, is_vegetarian, is_vegan, is_gluten_free,
        allergens
      FROM restaurant_menus
      WHERE tenant_id = ? AND is_active = 1 AND is_available = 1
      ORDER BY category, display_order, name`,
      [tenantId]
    );

    // Group by category with structured format for frontend
    const menuByCategory = {};
    let categoryIndex = 0;
    menuItems.forEach(item => {
      const cat = item.category || 'Autres';
      if (!menuByCategory[cat]) {
        categoryIndex++;
        menuByCategory[cat] = {
          category_id: categoryIndex,
          category_name: cat,
          items: []
        };
      }

      // Transformer l'item pour le frontend
      menuByCategory[cat].items.push(transformMenuItem(item));
    });

    // Convert to array format for frontend
    const menuArray = Object.values(menuByCategory);

    res.json({
      success: true,
      data: menuArray
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu' });
  }
});

// ==========================================
// GET /api/public/restaurant/:slug/tables/availability
// Disponibilité des tables pour réservation
// Vérifie que l'abonnement est actif
// ==========================================
router.get('/:slug/tables/availability', checkPublicSubscription('slug'), async (req, res) => {
  try {
    const { date, party_size } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required'
      });
    }

    // Get tenant
    const tenants = await query(
      `SELECT id, opening_hours FROM tenants
       WHERE slug = ? AND is_active = TRUE`,
      [req.params.slug]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    const tenantId = tenants[0].id;

    // Get available tables
    let tableQuery = `
      SELECT id, table_number, capacity, section, location_description
      FROM restaurant_tables
      WHERE tenant_id = ? AND is_available = 1 AND is_active = 1
    `;
    const params = [tenantId];

    if (party_size) {
      tableQuery += ' AND capacity >= ?';
      params.push(parseInt(party_size));
    }

    tableQuery += ' ORDER BY capacity ASC';

    const tables = await query(tableQuery, params);

    // Get existing reservations for the date
    const reservations = await query(
      `SELECT table_id, reservation_time, party_size, status
       FROM restaurant_reservations
       WHERE tenant_id = ? AND reservation_date = ? AND status NOT IN ('cancelled', 'no_show')`,
      [tenantId, date]
    );

    // Generate time slots (example: 11:00 to 22:00, every 30 min)
    const timeSlots = [];
    for (let hour = 11; hour <= 21; hour++) {
      timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
      timeSlots.push(`${String(hour).padStart(2, '0')}:30`);
    }

    // Mark unavailable slots
    const availability = tables.map(table => {
      const tableReservations = reservations.filter(r => r.table_id === table.id);
      const availableSlots = timeSlots.filter(slot => {
        // Check if slot overlaps with any reservation (assuming 1.5h per reservation)
        return !tableReservations.some(r => {
          const resTime = r.reservation_time.substring(0, 5);
          const resHour = parseInt(resTime.split(':')[0]);
          const resMin = parseInt(resTime.split(':')[1]);
          const slotHour = parseInt(slot.split(':')[0]);
          const slotMin = parseInt(slot.split(':')[1]);

          const resMinutes = resHour * 60 + resMin;
          const slotMinutes = slotHour * 60 + slotMin;

          // 90 min window
          return Math.abs(slotMinutes - resMinutes) < 90;
        });
      });

      return {
        ...table,
        available_slots: availableSlots
      };
    });

    // Combine all available times from all tables
    const allAvailableTimes = new Set();
    availability.forEach(table => {
      table.available_slots.forEach(slot => allAvailableTimes.add(slot));
    });

    res.json({
      success: true,
      data: {
        date,
        time_slots: timeSlots,
        available_times: Array.from(allAvailableTimes).sort(),
        tables: availability
      }
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ success: false, error: 'Failed to check availability' });
  }
});

// ==========================================
// POST /api/public/restaurant/:slug/reservations
// Créer une réservation
// Vérifie que l'abonnement est actif
// ==========================================
router.post('/:slug/reservations', checkPublicSubscription('slug'), async (req, res) => {
  try {
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

    // Validation
    if (!reservation_date || !reservation_time || !party_size || !customer_name || !customer_phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['reservation_date', 'reservation_time', 'party_size', 'customer_name', 'customer_phone']
      });
    }

    // Get tenant
    const tenants = await query(
      `SELECT id FROM tenants
       WHERE slug = ? AND is_active = TRUE`,
      [req.params.slug]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    const tenantId = tenants[0].id;

    // If no table_id provided, find a suitable one
    let selectedTableId = table_id;
    if (!selectedTableId) {
      const availableTables = await query(
        `SELECT id FROM restaurant_tables
         WHERE tenant_id = ? AND capacity >= ? AND is_available = 1 AND is_active = 1
         ORDER BY capacity ASC LIMIT 1`,
        [tenantId, party_size]
      );

      if (availableTables.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No table available for the requested party size'
        });
      }
      selectedTableId = availableTables[0].id;
    }

    // Check if table is available at that time
    const conflicts = await query(
      `SELECT id FROM restaurant_reservations
       WHERE tenant_id = ? AND table_id = ? AND reservation_date = ?
       AND status NOT IN ('cancelled', 'no_show')
       AND ABS(TIME_TO_SEC(TIMEDIFF(reservation_time, ?))) < 5400`,
      [tenantId, selectedTableId, reservation_date, reservation_time]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Table is not available at the selected time'
      });
    }

    // Generate confirmation code
    const confirmationCode = 'RES-' + Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    // Create reservation
    console.log(`[Restaurant Reservation] Creating reservation for tenant ${tenantId}, table ${selectedTableId}`);
    const result = await query(
      `INSERT INTO restaurant_reservations (
        tenant_id, table_id, reservation_date, reservation_time, party_size,
        customer_name, customer_email, customer_phone, special_requests,
        confirmation_code, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        tenantId, selectedTableId, reservation_date, reservation_time, party_size,
        customer_name, customer_email, customer_phone, special_requests,
        confirmationCode
      ]
    );

    // Get table info
    const tableInfo = await query(
      'SELECT table_number, section FROM restaurant_tables WHERE id = ?',
      [selectedTableId]
    );

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: {
        id: result.insertId,
        confirmation_code: confirmationCode,
        reservation_date,
        reservation_time,
        // Alias pour le frontend
        date: reservation_date,
        time: reservation_time,
        party_size,
        table_number: tableInfo[0]?.table_number,
        section: tableInfo[0]?.section,
        customer_name
      }
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ success: false, error: 'Failed to create reservation' });
  }
});

// ==========================================
// GET /api/public/restaurant/:slug/reservation/:code
// Vérifier une réservation
// Vérifie que l'abonnement est actif
// ==========================================
router.get('/:slug/reservation/:code', checkPublicSubscription('slug'), async (req, res) => {
  try {
    const reservations = await query(
      `SELECT r.*, t.table_number, t.section
       FROM restaurant_reservations r
       LEFT JOIN restaurant_tables t ON r.table_id = t.id
       LEFT JOIN tenants te ON r.tenant_id = te.id
       WHERE r.confirmation_code = ? AND te.slug = ?`,
      [req.params.code, req.params.slug]
    );

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }

    const reservation = reservations[0];

    res.json({
      success: true,
      data: {
        ...reservation,
        // Alias pour le frontend
        date: reservation.reservation_date,
        time: reservation.reservation_time
      }
    });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reservation' });
  }
});

// ==========================================
// POST /api/public/restaurant/:slug/orders
// Créer une commande takeaway/delivery
// Vérifie que l'abonnement est actif
// ==========================================
router.post('/:slug/orders', checkPublicSubscription('slug'), async (req, res) => {
  try {
    const {
      order_type, // 'takeaway' or 'delivery'
      items, // [{menu_item_id, quantity, special_instructions}]
      customer_name,
      customer_email,
      customer_phone,
      delivery_address,
      pickup_time,
      notes
    } = req.body;

    // Validation
    if (!order_type || !items || items.length === 0 || !customer_name || !customer_phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['order_type', 'items', 'customer_name', 'customer_phone']
      });
    }

    if (order_type === 'delivery' && !delivery_address) {
      return res.status(400).json({
        success: false,
        error: 'Delivery address is required for delivery orders'
      });
    }

    // Get tenant
    const tenants = await query(
      `SELECT id, currency FROM tenants
       WHERE slug = ? AND is_active = TRUE`,
      [req.params.slug]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    const tenantId = tenants[0].id;

    // Use transaction
    const result = await transaction(async (connection) => {
      // Calculate totals
      let subtotal = 0;
      const itemsWithPrices = [];

      for (const item of items) {
        // Support both menu_item_id and menu_id
        const menuItemId = item.menu_item_id || item.menu_id;

        const [menuItems] = await connection.query(
          'SELECT id, name, price FROM restaurant_menus WHERE id = ? AND tenant_id = ? AND is_active = 1',
          [menuItemId, tenantId]
        );

        if (!menuItems || menuItems.length === 0) {
          throw new Error(`Menu item ${menuItemId} not found`);
        }

        const menuItem = menuItems[0];
        const itemSubtotal = parseFloat(menuItem.price) * parseInt(item.quantity);
        subtotal += itemSubtotal;

        itemsWithPrices.push({
          menu_item_id: menuItem.id,
          menu_item_name: menuItem.name,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(menuItem.price),
          subtotal: itemSubtotal,
          special_instructions: item.special_instructions || item.notes || null
        });
      }

      // Tax calculation (10%)
      const taxRate = 0.10;
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      // Generate order number
      const orderDate = new Date();
      const orderDateStr = orderDate.toISOString().split('T')[0];
      const orderTimeStr = orderDate.toTimeString().split(' ')[0];

      const [countResult] = await connection.query(
        'SELECT COUNT(*) as count FROM restaurant_orders WHERE tenant_id = ? AND order_date = CURDATE()',
        [tenantId]
      );
      const count = countResult[0].count;
      const orderNumber = `ORD-${orderDateStr.replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

      // Create order
      const [orderResult] = await connection.query(
        `INSERT INTO restaurant_orders (
          tenant_id, order_number, order_type, subtotal, tax_amount, total_amount,
          order_date, order_time, notes, status, payment_status,
          customer_name, customer_email, customer_phone, delivery_address, pickup_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, ?, ?, ?, ?)`,
        [
          tenantId, orderNumber, order_type, subtotal, taxAmount, totalAmount,
          orderDateStr, orderTimeStr, notes,
          customer_name, customer_email, customer_phone, delivery_address, pickup_time
        ]
      );

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of itemsWithPrices) {
        await connection.query(
          `INSERT INTO restaurant_order_items (
            tenant_id, order_id, menu_item_id, menu_item_name,
            quantity, unit_price, subtotal, special_instructions
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tenantId, orderId, item.menu_item_id, item.menu_item_name,
            item.quantity, item.unit_price, item.subtotal, item.special_instructions
          ]
        );
      }

      return {
        orderId,
        orderNumber,
        subtotal,
        taxAmount,
        totalAmount,
        items: itemsWithPrices
      };
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: result.orderId,
        order_number: result.orderNumber,
        order_type,
        subtotal: result.subtotal,
        tax_amount: result.taxAmount,
        total_amount: result.totalAmount,
        total: result.totalAmount, // Alias pour le frontend
        items: result.items,
        status: 'pending',
        customer_name
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create order' });
  }
});

// ==========================================
// GET /api/public/restaurant/:slug/order/:orderNumber
// Suivi de commande
// Vérifie que l'abonnement est actif
// ==========================================
router.get('/:slug/order/:orderNumber', checkPublicSubscription('slug'), async (req, res) => {
  try {
    const orders = await query(
      `SELECT o.*, te.name as restaurant_name
       FROM restaurant_orders o
       LEFT JOIN tenants te ON o.tenant_id = te.id
       WHERE o.order_number = ? AND te.slug = ?`,
      [req.params.orderNumber, req.params.slug]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const order = orders[0];

    // Get order items
    const items = await query(
      'SELECT * FROM restaurant_order_items WHERE order_id = ?',
      [order.id]
    );

    res.json({
      success: true,
      data: {
        ...order,
        total: order.total_amount, // Alias pour le frontend
        items
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// ==========================================
// GET /api/public/restaurant/qr/:tableCode
// QR Code - Récupérer infos table et menu
// ==========================================
router.get('/qr/:tableCode', async (req, res) => {
  try {
    // tableCode format: SLUG-TABLE_NUMBER or a unique code
    const tableCode = req.params.tableCode;
    console.log(`[Restaurant QR] Looking for table with code: ${tableCode}`);

    // Try to find by qr_code field first
    let tables = await query(
      `SELECT t.*, te.slug, te.name as restaurant_name, te.currency
       FROM restaurant_tables t
       LEFT JOIN tenants te ON t.tenant_id = te.id
       WHERE t.qr_code = ? AND t.is_active = 1`,
      [tableCode]
    );

    // If not found, try parsing as SLUG-TABLENUMBER
    if (tables.length === 0) {
      const parts = tableCode.split('-');
      if (parts.length >= 2) {
        const slug = parts.slice(0, -1).join('-');
        const tableNumber = parts[parts.length - 1];

        tables = await query(
          `SELECT t.*, te.slug, te.name as restaurant_name, te.currency
           FROM restaurant_tables t
           LEFT JOIN tenants te ON t.tenant_id = te.id
           WHERE te.slug = ? AND t.table_number = ? AND t.is_active = 1`,
          [slug, tableNumber]
        );
      }
    }

    if (tables.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Table not found'
      });
    }

    const table = tables[0];

    // Get menu
    const menuItems = await query(
      `SELECT
        id, name, description, price, category,
        image_url, is_vegetarian, is_vegan, is_gluten_free,
        allergens
      FROM restaurant_menus
      WHERE tenant_id = ? AND is_active = 1 AND is_available = 1
      ORDER BY category, display_order, name`,
      [table.tenant_id]
    );

    // Group menu by category with structured format
    const menuByCategory = {};
    let categoryIndex = 0;
    menuItems.forEach(item => {
      const cat = item.category || 'Autres';
      if (!menuByCategory[cat]) {
        categoryIndex++;
        menuByCategory[cat] = {
          category_id: categoryIndex,
          category_name: cat,
          items: []
        };
      }

      // Transformer l'item pour le frontend
      menuByCategory[cat].items.push(transformMenuItem(item));
    });

    const menuArray = Object.values(menuByCategory);

    res.json({
      success: true,
      data: {
        table: {
          id: table.id,
          table_number: table.table_number,
          qr_code: table.qr_code,
          section: table.section,
          location_description: table.location_description,
          capacity: table.capacity
        },
        restaurant: {
          slug: table.slug,
          name: table.restaurant_name,
          business_name: table.restaurant_name, // Alias pour le frontend
          currency: table.currency || 'EUR'
        },
        menu: menuArray
      }
    });
  } catch (error) {
    console.error('Error fetching QR table:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch table info' });
  }
});

// ==========================================
// POST /api/public/restaurant/qr/:tableCode/order
// Commander depuis QR Code (dine-in)
// ==========================================
router.post('/qr/:tableCode/order', async (req, res) => {
  try {
    const { items, customer_name, notes } = req.body;
    console.log(`[Restaurant QR Order] Received order for tableCode: ${req.params.tableCode}`);
    console.log(`[Restaurant QR Order] Items:`, items);

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items are required'
      });
    }

    // Find table - also try matching by table ID directly
    const tableCode = req.params.tableCode;
    let tables = await query(
      `SELECT t.*, te.id as tenant_id
       FROM restaurant_tables t
       LEFT JOIN tenants te ON t.tenant_id = te.id
       WHERE (t.qr_code = ? OR CONCAT(te.slug, '-', t.table_number) = ? OR t.id = ?) AND t.is_active = 1`,
      [tableCode, tableCode, tableCode]
    );

    console.log(`[Restaurant QR Order] Found ${tables.length} tables for code: ${tableCode}`);

    if (tables.length === 0) {
      console.log(`[Restaurant QR Order] Table not found for code: ${tableCode}`);
      return res.status(404).json({ success: false, error: 'Table not found' });
    }

    const table = tables[0];
    const tenantId = table.tenant_id;

    // Use transaction
    const result = await transaction(async (connection) => {
      let subtotal = 0;
      const itemsWithPrices = [];

      for (const item of items) {
        // Support both menu_item_id and menu_id
        const menuItemId = item.menu_item_id || item.menu_id;

        const [menuItems] = await connection.query(
          'SELECT id, name, price FROM restaurant_menus WHERE id = ? AND tenant_id = ? AND is_active = 1',
          [menuItemId, tenantId]
        );

        if (!menuItems || menuItems.length === 0) {
          throw new Error(`Menu item ${menuItemId} not found`);
        }

        const menuItem = menuItems[0];
        const itemSubtotal = parseFloat(menuItem.price) * parseInt(item.quantity);
        subtotal += itemSubtotal;

        itemsWithPrices.push({
          menu_item_id: menuItem.id,
          menu_item_name: menuItem.name,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(menuItem.price),
          subtotal: itemSubtotal,
          special_instructions: item.special_instructions || item.notes || null
        });
      }

      const taxRate = 0.10;
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      const orderDate = new Date();
      const orderDateStr = orderDate.toISOString().split('T')[0];
      const orderTimeStr = orderDate.toTimeString().split(' ')[0];

      const [countResult] = await connection.query(
        'SELECT COUNT(*) as count FROM restaurant_orders WHERE tenant_id = ? AND order_date = CURDATE()',
        [tenantId]
      );
      const count = countResult[0].count;
      const orderNumber = `ORD-${orderDateStr.replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

      // Create order with table_id
      const [orderResult] = await connection.query(
        `INSERT INTO restaurant_orders (
          tenant_id, order_number, table_id, order_type, subtotal, tax_amount, total_amount,
          order_date, order_time, notes, status, payment_status, customer_name
        ) VALUES (?, ?, ?, 'dine_in', ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?)`,
        [
          tenantId, orderNumber, table.id, subtotal, taxAmount, totalAmount,
          orderDateStr, orderTimeStr, notes, customer_name
        ]
      );

      const orderId = orderResult.insertId;

      // Update table availability (mark as occupied)
      await connection.query(
        'UPDATE restaurant_tables SET is_available = 0 WHERE id = ?',
        [table.id]
      );

      // Create order items
      for (const item of itemsWithPrices) {
        await connection.query(
          `INSERT INTO restaurant_order_items (
            tenant_id, order_id, menu_item_id, menu_item_name,
            quantity, unit_price, subtotal, special_instructions
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tenantId, orderId, item.menu_item_id, item.menu_item_name,
            item.quantity, item.unit_price, item.subtotal, item.special_instructions
          ]
        );
      }

      return { orderId, orderNumber, subtotal, taxAmount, totalAmount, items: itemsWithPrices };
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        id: result.orderId,
        order_number: result.orderNumber,
        table_number: table.table_number,
        subtotal: result.subtotal,
        tax_amount: result.taxAmount,
        total_amount: result.totalAmount,
        total: result.totalAmount, // Alias pour le frontend
        items: result.items,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error creating QR order:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create order' });
  }
});

module.exports = router;
