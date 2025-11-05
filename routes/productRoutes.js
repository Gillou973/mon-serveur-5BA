import express from 'express';
import * as productController from '../controllers/productController.js';
import { authenticate } from '../middlewares/auth.js';
import { isAdmin, checkRole } from '../middlewares/roleCheck.js';
import { body, param, query } from 'express-validator';
import { validate } from '../middlewares/validation.js';
import { uploadMultiple, handleMulterError } from '../middlewares/upload.js';

const router = express.Router();

// Validation rules
const createProductValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 200 }).withMessage('Le nom doit contenir entre 2 et 200 caractères'),
  body('slug')
    .trim()
    .notEmpty().withMessage('Le slug est requis')
    .matches(/^[a-z0-9-]+$/).withMessage('Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'),
  body('price')
    .notEmpty().withMessage('Le prix est requis')
    .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('category_id')
    .optional()
    .isUUID().withMessage('ID de catégorie invalide'),
  body('quantity')
    .optional()
    .isInt({ min: 0 }).withMessage('La quantité doit être un nombre entier positif'),
  body('sku')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Le SKU ne peut pas dépasser 100 caractères'),
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

// Routes publiques
router.get('/', productController.getAllProducts);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getProductById);
router.get('/:id/availability', productController.checkAvailability);

// Routes admin/manager
router.post(
  '/',
  authenticate,
  isAdmin,
  createProductValidation,
  productController.createProduct
);

router.put(
  '/:id',
  authenticate,
  isAdmin,
  productController.updateProduct
);

router.patch(
  '/:id/stock',
  authenticate,
  checkRole('admin', 'manager'),
  updateStockValidation,
  productController.updateStock
);

router.delete(
  '/:id',
  authenticate,
  isAdmin,
  productController.deleteProduct
);

// Routes de gestion des images
router.post(
  '/:id/images',
  authenticate,
  isAdmin,
  uploadMultiple,
  handleMulterError,
  productController.uploadProductImages
);

router.delete(
  '/:id/images/:imageIndex',
  authenticate,
  isAdmin,
  productController.deleteProductImage
);

router.put(
  '/:id/images/reorder',
  authenticate,
  isAdmin,
  body('imageOrder')
    .isArray().withMessage('imageOrder doit être un tableau')
    .notEmpty().withMessage('imageOrder ne peut pas être vide'),
  validate,
  productController.reorderProductImages
);

export default router;
