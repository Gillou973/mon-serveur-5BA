import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authenticate } from '../middlewares/auth.js';
import { isAdmin } from '../middlewares/roleCheck.js';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validation.js';

const router = express.Router();

// Validation rules
const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('slug')
    .trim()
    .notEmpty().withMessage('Le slug est requis')
    .matches(/^[a-z0-9-]+$/).withMessage('Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'),
  body('parent_id')
    .optional()
    .isUUID().withMessage('ID de catégorie parente invalide'),
  body('image_url')
    .optional()
    .isURL().withMessage('URL d\'image invalide'),
  body('sort_order')
    .optional()
    .isInt().withMessage('L\'ordre de tri doit être un nombre entier'),
  validate
];

// Routes publiques
router.get('/', categoryController.getAllCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:id', categoryController.getCategoryById);

// Routes admin
router.post(
  '/',
  authenticate,
  isAdmin,
  createCategoryValidation,
  categoryController.createCategory
);

router.put(
  '/:id',
  authenticate,
  isAdmin,
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  isAdmin,
  categoryController.deleteCategory
);

export default router;
