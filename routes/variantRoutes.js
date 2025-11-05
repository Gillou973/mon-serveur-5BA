import express from 'express';
import * as variantController from '../controllers/variantController.js';
import { authenticate } from '../middlewares/auth.js';
import { isAdmin, checkRole } from '../middlewares/roleCheck.js';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validation.js';

const router = express.Router();

// Validation rules
const createVariantValidation = [
  body('sku')
    .trim()
    .notEmpty().withMessage('Le SKU est requis')
    .isLength({ max: 100 }).withMessage('Le SKU ne peut pas dépasser 100 caractères'),
  body('size')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('La taille ne peut pas dépasser 50 caractères'),
  body('color')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('La couleur ne peut pas dépasser 50 caractères'),
  body('color_hex')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Le code hexadécimal doit être au format #RRGGBB'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('quantity')
    .optional()
    .isInt({ min: 0 }).withMessage('La quantité doit être un nombre entier positif'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active doit être un booléen'),
  validate
];

const createMultipleVariantsValidation = [
  body('variants')
    .isArray({ min: 1 }).withMessage('variants doit être un tableau non vide'),
  body('variants.*.sku')
    .trim()
    .notEmpty().withMessage('Le SKU est requis pour chaque variante'),
  body('variants.*.price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('variants.*.quantity')
    .optional()
    .isInt({ min: 0 }).withMessage('La quantité doit être un nombre entier positif'),
  validate
];

const updateStockValidation = [
  body('quantity')
    .notEmpty().withMessage('La quantité est requise')
    .isInt({ min: 0 }).withMessage('La quantité doit être un nombre entier positif'),
  body('operation')
    .notEmpty().withMessage('L\'opération est requise')
    .isIn(['set', 'add', 'subtract']).withMessage('Opération invalide'),
  validate
];

// ============================================
// ROUTES PUBLIQUES
// ============================================

/**
 * GET /api/products/:productId/variants
 * Récupérer toutes les variantes d'un produit
 */
router.get(
  '/products/:productId/variants',
  variantController.getProductVariants
);

/**
 * GET /api/products/:productId/variants/combinations
 * Obtenir les combinaisons possibles (tailles/couleurs)
 */
router.get(
  '/products/:productId/variants/combinations',
  variantController.getVariantCombinations
);

/**
 * GET /api/variants/:variantId
 * Récupérer une variante par ID
 */
router.get(
  '/variants/:variantId',
  variantController.getVariantById
);

/**
 * GET /api/variants/:variantId/availability
 * Vérifier la disponibilité d'une variante
 */
router.get(
  '/variants/:variantId/availability',
  variantController.checkVariantAvailability
);

// ============================================
// ROUTES ADMIN (Création, mise à jour, suppression)
// ============================================

/**
 * POST /api/products/:productId/variants
 * Créer une nouvelle variante pour un produit
 */
router.post(
  '/products/:productId/variants',
  authenticate,
  isAdmin,
  createVariantValidation,
  variantController.createVariant
);

/**
 * POST /api/products/:productId/variants/bulk
 * Créer plusieurs variantes en une seule fois
 */
router.post(
  '/products/:productId/variants/bulk',
  authenticate,
  isAdmin,
  createMultipleVariantsValidation,
  variantController.createMultipleVariants
);

/**
 * PUT /api/variants/:variantId
 * Mettre à jour une variante
 */
router.put(
  '/variants/:variantId',
  authenticate,
  isAdmin,
  variantController.updateVariant
);

/**
 * DELETE /api/variants/:variantId
 * Supprimer une variante
 */
router.delete(
  '/variants/:variantId',
  authenticate,
  isAdmin,
  variantController.deleteVariant
);

// ============================================
// ROUTES GESTION DU STOCK (Admin/Manager)
// ============================================

/**
 * PATCH /api/variants/:variantId/stock
 * Mettre à jour le stock d'une variante
 */
router.patch(
  '/variants/:variantId/stock',
  authenticate,
  checkRole('admin', 'manager'),
  updateStockValidation,
  variantController.updateVariantStock
);

export default router;
