const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Product validation rules
 */
const productValidation = {
  create: [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('name_mm').optional().trim(),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('category_id').optional().isUUID().withMessage('Invalid category ID'),
    validate
  ],
  update: [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    validate
  ]
};

/**
 * Customer validation rules
 */
const customerValidation = {
  create: [
    body('name').trim().notEmpty().withMessage('Customer name is required'),
    body('phone').optional().trim().isMobilePhone().withMessage('Invalid phone number'),
    body('email').optional().trim().isEmail().withMessage('Invalid email address'),
    validate
  ],
  update: [
    param('id').isUUID().withMessage('Invalid customer ID'),
    body('name').optional().trim().notEmpty().withMessage('Customer name cannot be empty'),
    body('phone').optional().trim().isMobilePhone().withMessage('Invalid phone number'),
    body('email').optional().trim().isEmail().withMessage('Invalid email address'),
    validate
  ]
};

/**
 * Order validation rules
 */
const orderValidation = {
  create: [
    body('customer_id').isUUID().withMessage('Invalid customer ID'),
    body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
    body('items.*.product_id').isUUID().withMessage('Invalid product ID'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('payment_method').isIn(['cash', 'kpay', 'wavepay', 'card']).withMessage('Invalid payment method'),
    validate
  ],
  updateStatus: [
    param('id').isUUID().withMessage('Invalid order ID'),
    body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status'),
    validate
  ]
};

/**
 * Chat validation rules
 */
const chatValidation = {
  send: [
    body('customerId').isUUID().withMessage('Invalid customer ID'),
    body('message').trim().notEmpty().withMessage('Message cannot be empty'),
    body('message').isLength({ max: 4000 }).withMessage('Message too long (max 4000 characters)'),
    body('channel').optional().isIn(['telegram', 'viber', 'messenger']).withMessage('Invalid channel'),
    validate
  ],
  markRead: [
    param('customerId').isUUID().withMessage('Invalid customer ID'),
    validate
  ]
};

/**
 * UOM validation rules
 */
const uomValidation = {
  create: [
    body('code').trim().notEmpty().withMessage('UOM code is required'),
    body('name').trim().notEmpty().withMessage('UOM name is required'),
    body('name_mm').optional().trim(),
    validate
  ],
  addToProduct: [
    body('product_id').isUUID().withMessage('Invalid product ID'),
    body('uom_id').isUUID().withMessage('Invalid UOM ID'),
    body('conversion_factor').isFloat({ min: 0.001 }).withMessage('Conversion factor must be positive'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    validate
  ]
};

module.exports = {
  validate,
  productValidation,
  customerValidation,
  orderValidation,
  chatValidation,
  uomValidation
};
