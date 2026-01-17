/**
 * SALONHUB - Restaurant Routes Index
 * Central export for all restaurant-specific routes
 */

const express = require('express');
const router = express.Router();

// Import restaurant sub-routes
const tablesRoutes = require('./tables');
const menusRoutes = require('./menus');
const ordersRoutes = require('./orders');

// Mount sub-routes
router.use('/tables', tablesRoutes);
router.use('/menus', menusRoutes);
router.use('/orders', ordersRoutes);

module.exports = router;
