import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { authenticate } from '../middlewares/auth.js';
import { isAdmin, checkRole } from '../middlewares/roleCheck.js';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validation.js';

const router = express.Router();

// Validation rules
const addToCartValidation = [
  body('product_id')
    .notEmpty().withMessage('L\'ID du produit est requis')
    .isUUID().withMessage('ID de produit invalide'),
  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('La quantité doit être au moins 1'),
  validate
];

const updateCartItemValidation = [
  body('quantity')
    .notEmpty().withMessage('La quantité est requise')
    .isInt({ min: 1 }).withMessage('La quantité doit être au moins 1'),
  validate
];

// Routes utilisateur authentifié
router.get('/my-cart', authenticate, cartController.getMyCart);
router.post('/my-cart/items', authenticate, addToCartValidation, cartController.addToCart);
router.put('/my-cart/items/:itemId', authenticate, updateCartItemValidation, cartController.updateCartItem);
router.delete('/my-cart/items/:itemId', authenticate, cartController.removeFromCart);
router.delete('/my-cart', authenticate, cartController.clearCart);

// Routes admin
router.get(
  '/',
  authenticate,
  checkRole('admin', 'manager'),
  cartController.getAllCarts
);

export default router;
