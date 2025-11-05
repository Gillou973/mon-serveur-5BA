import express from 'express';
import * as couponController from '../controllers/couponController.js';
import { authenticate } from '../middlewares/auth.js';
import { isAdmin } from '../middlewares/roleCheck.js';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validation.js';

const router = express.Router();

// Validation rules
const createCouponValidation = [
  body('code')
    .trim()
    .notEmpty().withMessage('Le code est requis')
    .isLength({ min: 3, max: 50 }).withMessage('Le code doit contenir entre 3 et 50 caractères')
    .matches(/^[A-Z0-9-_]+$/i).withMessage('Le code ne peut contenir que des lettres, chiffres, tirets et underscores'),
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ max: 100 }).withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('type')
    .isIn(['percentage', 'fixed_amount', 'free_shipping']).withMessage('Type invalide'),
  body('value')
    .isFloat({ min: 0 }).withMessage('La valeur doit être un nombre positif'),
  body('min_purchase_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le montant minimum doit être positif'),
  body('max_discount_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le montant maximum doit être positif'),
  body('usage_limit')
    .optional()
    .isInt({ min: 1 }).withMessage('La limite d\'utilisation doit être un entier positif'),
  body('applies_to')
    .optional()
    .isIn(['all', 'specific_products', 'specific_categories']).withMessage('Type d\'application invalide'),
  validate
];

const validateCouponValidation = [
  param('code')
    .trim()
    .notEmpty().withMessage('Le code est requis'),
  body('subtotal')
    .isFloat({ min: 0 }).withMessage('Le sous-total doit être un nombre positif'),
  validate
];

// ============================================
// ROUTES PUBLIQUES
// ============================================

/**
 * POST /api/coupons/validate/:code
 * Valider un code promo
 */
router.post(
  '/validate/:code',
  authenticate,
  validateCouponValidation,
  couponController.validateCoupon
);

// ============================================
// ROUTES ADMIN
// ============================================

/**
 * GET /api/coupons
 * Obtenir tous les coupons
 * Query params: ?is_active=true&type=percentage&search=summer
 */
router.get(
  '/',
  authenticate,
  isAdmin,
  couponController.getAllCoupons
);

/**
 * GET /api/coupons/:id
 * Obtenir un coupon par ID
 */
router.get(
  '/:id',
  authenticate,
  isAdmin,
  couponController.getCouponById
);

/**
 * GET /api/coupons/:id/stats
 * Obtenir les statistiques d'un coupon
 */
router.get(
  '/:id/stats',
  authenticate,
  isAdmin,
  couponController.getCouponStats
);

/**
 * POST /api/coupons
 * Créer un nouveau coupon
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  createCouponValidation,
  couponController.createCoupon
);

/**
 * PUT /api/coupons/:id
 * Mettre à jour un coupon
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  couponController.updateCoupon
);

/**
 * PATCH /api/coupons/:id/toggle
 * Activer/Désactiver un coupon
 */
router.patch(
  '/:id/toggle',
  authenticate,
  isAdmin,
  couponController.toggleCouponStatus
);

/**
 * DELETE /api/coupons/:id
 * Supprimer un coupon
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  couponController.deleteCoupon
);

export default router;
