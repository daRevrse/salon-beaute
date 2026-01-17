/**
 * TRAINING ROUTES - Centre de Formation
 * Routes principales pour le secteur Training
 */

const express = require('express');
const router = express.Router();

// Middleware
const { authMiddleware } = require('../../middleware/auth');
const { tenantMiddleware } = require('../../middleware/tenant');
const { businessTypeMiddleware, requireBusinessType } = require('../../middleware/businessType');

// Appliquer les middlewares globaux
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(businessTypeMiddleware);
router.use(requireBusinessType('training'));

// Sous-routes
router.use('/courses', require('./courses'));
router.use('/sessions', require('./sessions'));
router.use('/enrollments', require('./enrollments'));
router.use('/attendance', require('./attendance'));
router.use('/certificates', require('./certificates'));
router.use('/materials', require('./materials'));

// Route de test
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Training API is running',
    businessType: req.businessType,
    tenantId: req.tenantId
  });
});

module.exports = router;
