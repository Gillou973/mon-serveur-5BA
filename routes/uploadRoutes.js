import express from 'express';
import * as uploadController from '../controllers/uploadController.js';
import { authenticate } from '../middlewares/auth.js';
import { isAdmin } from '../middlewares/roleCheck.js';
import upload from '../config/multer.js';

const router = express.Router();

// Toutes les routes d'upload nécessitent une authentification admin
router.use(authenticate);
router.use(isAdmin);

/**
 * POST /api/upload/products/:productId
 * Upload d'images pour un produit spécifique
 * Accepte jusqu'à 10 images
 */
router.post(
  '/products/:productId',
  upload.array('images', 10),
  uploadController.uploadProductImages
);

/**
 * POST /api/upload/images
 * Upload d'images génériques (sans association immédiate)
 * Query param: ?type=products|categories
 */
router.post(
  '/images',
  upload.array('images', 10),
  uploadController.uploadImages
);

/**
 * POST /api/upload/categories/:categoryId
 * Upload d'une image pour une catégorie
 */
router.post(
  '/categories/:categoryId',
  upload.single('image'),
  uploadController.uploadCategoryImage
);

/**
 * DELETE /api/upload/products/:productId/images
 * Supprimer une image d'un produit
 * Body: { imageUrl: string }
 */
router.delete(
  '/products/:productId/images',
  uploadController.deleteProductImage
);

/**
 * PATCH /api/upload/products/:productId/images/primary
 * Définir une image comme image principale
 * Body: { imageUrl: string }
 */
router.patch(
  '/products/:productId/images/primary',
  uploadController.setPrimaryImage
);

/**
 * PUT /api/upload/products/:productId/images/reorder
 * Réorganiser l'ordre des images
 * Body: { imageUrls: string[] }
 */
router.put(
  '/products/:productId/images/reorder',
  uploadController.reorderImages
);

export default router;
