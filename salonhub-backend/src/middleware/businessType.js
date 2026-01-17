const { query } = require('../config/database');

/**
 * Middleware to detect and inject business type into request
 * Must be used AFTER authMiddleware and tenantMiddleware
 */
const businessTypeMiddleware = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(500).json({
        success: false,
        error: 'Server Error',
        message: 'tenantId not found. Ensure tenantMiddleware is applied first.'
      });
    }

    // Fetch business_type from tenants table
    const [tenant] = await query(
      'SELECT business_type FROM tenants WHERE id = ?',
      [req.tenantId]
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    // Inject business type into request
    req.businessType = tenant.business_type;

    next();
  } catch (error) {
    console.error('Business type middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to determine business type'
    });
  }
};

/**
 * Middleware factory to restrict routes to specific business types
 * @param {string|string[]} allowedTypes - Single type or array of allowed business types
 * @returns {Function} Express middleware
 *
 * @example
 * router.use(requireBusinessType('restaurant'));
 * router.use(requireBusinessType(['restaurant', 'beauty']));
 */
const requireBusinessType = (allowedTypes) => {
  // Normalize to array
  const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];

  return (req, res, next) => {
    if (!req.businessType) {
      return res.status(500).json({
        success: false,
        error: 'Server Error',
        message: 'Business type not detected. Ensure businessTypeMiddleware is applied first.'
      });
    }

    if (!types.includes(req.businessType)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied',
        message: `This feature is only available for ${types.join(', ')} businesses`
      });
    }

    next();
  };
};

/**
 * Helper function to check if a tenant has a specific business type
 * Useful for conditional logic in route handlers
 * @param {string} businessType - The business type from req.businessType
 * @param {string|string[]} types - Type(s) to check against
 * @returns {boolean}
 *
 * @example
 * if (isBusinessType(req.businessType, 'restaurant')) {
 *   // Restaurant-specific logic
 * }
 */
const isBusinessType = (businessType, types) => {
  const typeArray = Array.isArray(types) ? types : [types];
  return typeArray.includes(businessType);
};

module.exports = {
  businessTypeMiddleware,
  requireBusinessType,
  isBusinessType
};
