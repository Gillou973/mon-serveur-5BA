import express from 'express';
import * as discountController from '../controllers/discountController.js';
import { authenticate } from '../middlewares/auth.js';
import { isAdmin } from '../middlewares/roleCheck.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validation.js';

const router = express.Router();

// Validation rules
const createDiscountValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ max: 100 }).withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('type')
    .isIn(['percentage', 'fixed_amount']).withMessage('Type invalide'),
  body('value')
    .isFloat({ min: 0 }).withMessage('La valeur doit être un nombre positif'),
  body('applies_to')
    .isIn(['all', 'category', 'product', 'product_variant']).withMessage('Type d\'application invalide'),
  body('min_quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('La quantité minimum doit être un entier positif'),
  body('priority')
    .optional()
    .isInt({ min: 0 }).withMessage('La priorité doit être un entier positif'),
  validate
];

// ============================================
// ROUTES PUBLIQUES
// ============================================

/**
 * GET /api/discounts/active
 * Obtenir toutes les réductions actives
 * Query params: ?applies_to=product&target_id=uuid
 */
router.get(
  '/active',
  discountController.getActiveDiscounts
);

/**
 * GET /api/products/:productId/discounts
 * Obtenir les réductions applicables à un produit
 */
router.get(
  '/products/:productId',
  discountController.getProductDiscounts
);

// ============================================
// ROUTES ADMIN
// ============================================

/**
 * GET /api/discounts
 * Obtenir toutes les réductions
 * Query params: ?is_active=true&type=percentage&applies_to=product
 */
router.get(
  '/',
  authenticate,
  isAdmin,
  discountController.getAllDiscounts
);

/**
 * GET /api/discounts/:id
 * Obtenir une réduction par ID
 */
router.get(
  '/:id',
  authenticate,
  isAdmin,
  discountController.getDiscountById
);

/**
 * POST /api/discounts
 * Créer une nouvelle réduction
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  createDiscountValidation,
  discountController.createDiscount
);

/**
 * PUT /api/discounts/:id
 * Mettre à jour une réduction
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  discountController.updateDiscount
);

/**
 * PATCH /api/discounts/:id/toggle
 * Activer/Désactiver une réduction
 */
router.patch(
  '/:id/toggle',
  authenticate,
  isAdmin,
  discountController.toggleDiscountStatus
);

/**
 * DELETE /api/discounts/:id
 * Supprimer une réduction
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  discountController.deleteDiscount
);

export default router;
