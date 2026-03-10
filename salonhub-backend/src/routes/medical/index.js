/**
 * MEDICAL ROUTES - Cabinets Médicaux
 * Routes principales pour le secteur médical
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
router.use(requireBusinessType('medical'));

// Sous-routes
router.use('/patients', require('./patients'));
router.use('/records', require('./records'));
router.use('/prescriptions', require('./prescriptions'));
router.use('/lab-results', require('./lab-results'));
router.use('/vaccinations', require('./vaccinations'));

// Route de test
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Medical API is running',
    businessType: req.businessType,
    tenantId: req.tenantId
  });
});

module.exports = router;
