import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 50 caractères.')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores.'),

    body('email')
      .trim()
      .isEmail()
      .withMessage('Email invalide.')
      .normalizeEmail(),

    body('password')
      .isLength({ min: 6 })
      .withMessage('Le mot de passe doit contenir au moins 6 caractères.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.'),

    body('role')
      .optional()
      .isIn(['admin', 'manager', 'editor', 'user'])
      .withMessage('Rôle invalide.'),

    body('first_name')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Le prénom ne peut pas dépasser 50 caractères.'),

    body('last_name')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Le nom ne peut pas dépasser 50 caractères.')
  ],
  validate,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Email invalide.')
      .normalizeEmail(),

    body('password')
      .notEmpty()
      .withMessage('Le mot de passe est requis.')
  ],
  validate,
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion (principalement côté client)
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Récupérer l'utilisateur connecté
 * @access  Private
 */
router.get('/me', authenticate, authController.me);

/**
 * @route   PUT /api/auth/update-password
 * @desc    Changer le mot de passe
 * @access  Private
 */
router.put(
  '/update-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Le mot de passe actuel est requis.'),

    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.')
  ],
  validate,
  authController.updatePassword
);

export default router;
