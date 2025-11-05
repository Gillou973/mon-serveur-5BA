import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { authenticate } from '../middlewares/auth.js';
import { isAdmin, checkRole } from '../middlewares/roleCheck.js';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validation.js';

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body('shipping_address').notEmpty().withMessage('L\'adresse de livraison est requise'),
  body('shipping_address.street').notEmpty().withMessage('La rue est requise'),
  body('shipping_address.city').notEmpty().withMessage('La ville est requise'),
  body('shipping_address.postal_code').notEmpty().withMessage('Le code postal est requis'),
  body('shipping_address.country').notEmpty().withMessage('Le pays est requis'),
  body('payment_method').optional().trim(),
  validate
];

const updateOrderStatusValidation = [
  body('status')
    .notEmpty().withMessage('Le statut est requis')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Statut invalide'),
  body('tracking_number').optional().trim(),
  validate
];

const updatePaymentStatusValidation = [
  body('payment_status')
    .notEmpty().withMessage('Le statut de paiement est requis')
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Statut de paiement invalide'),
  validate
];

// Routes utilisateur authentifié
router.post('/', authenticate, orderController.createOrder); // Création de commande (sans validation stricte pour le moment)
router.post('/create', authenticate, createOrderValidation, orderController.createOrder); // Alias avec validation
router.get('/my-orders', authenticate, orderController.getMyOrders);
router.get('/my-orders/:id', authenticate, orderController.getMyOrderById);
router.post('/my-orders/:id/cancel', authenticate, orderController.cancelMyOrder);

// Routes admin/manager
router.get(
  '/',
  authenticate,
  checkRole('admin', 'manager'),
  orderController.getAllOrders
);

router.get(
  '/stats',
  authenticate,
  checkRole('admin', 'manager'),
  orderController.getOrderStats
);

router.get(
  '/:id',
  authenticate,
  checkRole('admin', 'manager'),
  orderController.getOrderById
);

router.patch(
  '/:id/status',
  authenticate,
  checkRole('admin', 'manager'),
  updateOrderStatusValidation,
  orderController.updateOrderStatus
);

router.patch(
  '/:id/payment-status',
  authenticate,
  checkRole('admin', 'manager'),
  updatePaymentStatusValidation,
  orderController.updatePaymentStatus
);

export default router;
