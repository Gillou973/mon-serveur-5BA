import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middlewares/auth.js';
import { checkRole, isAdmin, isSelfOrAdmin } from '../middlewares/roleCheck.js';

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Récupérer tous les utilisateurs avec pagination et filtres
 * @access  Private (Admin, Manager)
 * @query   role, is_active, limit, offset
 */
router.get('/', authenticate, checkRole('admin', 'manager'), userController.getAllUsers);

/**
 * @route   POST /api/users
 * @desc    Créer un nouvel utilisateur (usage admin uniquement, utiliser /api/auth/register pour inscription publique)
 * @access  Private (Admin only)
 */
router.post('/', authenticate, isAdmin, userController.createUser);

// Routes /me/addresses DOIVENT être avant /:id sinon "me" sera traité comme un ID
/**
 * @route   GET /api/users/me/addresses
 * @desc    Récupérer les adresses de l'utilisateur connecté
 * @access  Private
 */
router.get('/me/addresses', authenticate, userController.getUserAddresses);

/**
 * @route   POST /api/users/me/addresses
 * @desc    Ajouter une adresse à l'utilisateur connecté
 * @access  Private
 */
router.post('/me/addresses', authenticate, userController.addUserAddress);

/**
 * @route   PUT /api/users/me/addresses/:addressId
 * @desc    Modifier une adresse de l'utilisateur connecté
 * @access  Private
 */
router.put('/me/addresses/:addressId', authenticate, userController.updateUserAddress);

/**
 * @route   DELETE /api/users/me/addresses/:addressId
 * @desc    Supprimer une adresse de l'utilisateur connecté
 * @access  Private
 */
router.delete('/me/addresses/:addressId', authenticate, userController.deleteUserAddress);

/**
 * @route   GET /api/users/:id
 * @desc    Récupérer un utilisateur par ID
 * @access  Private (Self or Admin)
 */
router.get('/:id', authenticate, isSelfOrAdmin, userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Private (Self or Admin)
 */
router.put('/:id', authenticate, isSelfOrAdmin, userController.updateUser);

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Changer le rôle d'un utilisateur
 * @access  Private (Admin only)
 */
router.patch('/:id/role', authenticate, isAdmin, userController.updateUserRole);

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer ou désactiver un utilisateur
 * @access  Private (Admin only)
 * @query   permanent=true pour suppression définitive
 */
router.delete('/:id', authenticate, isAdmin, userController.deleteUser);

export default router;
