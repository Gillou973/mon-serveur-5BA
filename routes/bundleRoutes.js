import express from 'express';
import * as bundleController from '../controllers/bundleController.js';
import { authenticate } from '../middlewares/auth.js';
import { isAdmin } from '../middlewares/roleCheck.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validation.js';

const router = express.Router();

// Validation rules
const createBundleValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ max: 100 }).withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('type')
    .isIn(['buy_x_get_y', 'bundle_price', 'bundle_percentage']).withMessage('Type invalide'),
  body('product_ids')
    .isArray({ min: 1 }).withMessage('Au moins un produit est requis'),
  body('priority')
    .optional()
    .isInt({ min: 0 }).withMessage('La priorité doit être un entier positif'),
  validate
];

// ============================================
// ROUTES PUBLIQUES
// ============================================

/**
 * GET /api/bundles/active
 * Obtenir tous les bundles actifs
 */
router.get(
  '/active',
  bundleController.getActiveBundles
);

/**
 * GET /api/products/:productId/bundles
 * Obtenir les bundles pour un produit
 */
router.get(
  '/products/:productId',
  bundleController.getProductBundles
);

// ============================================
// ROUTES ADMIN
// ============================================

/**
 * GET /api/bundles
 * Obtenir tous les bundles
 * Query params: ?is_active=true&type=buy_x_get_y
 */
router.get(
  '/',
  authenticate,
  isAdmin,
  bundleController.getAllBundles
);

/**
 * GET /api/bundles/:id
 * Obtenir un bundle par ID
 */
router.get(
  '/:id',
  authenticate,
  isAdmin,
  bundleController.getBundleById
);

/**
 * GET /api/bundles/:id/stats
 * Obtenir les statistiques d'un bundle
 */
router.get(
  '/:id/stats',
  authenticate,
  isAdmin,
  bundleController.getBundleStats
);

/**
 * POST /api/bundles
 * Créer un nouveau bundle
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  createBundleValidation,
  bundleController.createBundle
);

/**
 * PUT /api/bundles/:id
 * Mettre à jour un bundle
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  bundleController.updateBundle
);

/**
 * PATCH /api/bundles/:id/toggle
 * Activer/Désactiver un bundle
 */
router.patch(
  '/:id/toggle',
  authenticate,
  isAdmin,
  bundleController.toggleBundleStatus
);

/**
 * DELETE /api/bundles/:id
 * Supprimer un bundle
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  bundleController.deleteBundle
);

export default router;
