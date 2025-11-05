import { logger } from '../logger.js';
import * as authService from '../services/authService.js';

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password, role, first_name, last_name } = req.body;

    const { user, token } = await authService.registerUser({
      username,
      email,
      password,
      role,
      first_name,
      last_name
    });

    logger.info(`Nouvel utilisateur inscrit: ${user.username} (${user.email})`);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie.',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    logger.error(`Erreur lors de l'inscription: ${error.message}`);
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { user, token } = await authService.loginUser(email, password);

    logger.info(`Utilisateur connecté: ${user.username} (${user.email})`);

    res.json({
      success: true,
      message: 'Connexion réussie.',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    logger.error(`Erreur lors de la connexion: ${error.message}`);
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Déconnexion (côté client principalement)
 */
export const logout = async (req, res, next) => {
  try {
    // Note: Avec JWT, la déconnexion est gérée côté client en supprimant le token
    // Cette route est principalement pour la cohérence de l'API

    if (req.user) {
      logger.info(`Utilisateur déconnecté: ${req.user.username}`);
    }

    res.json({
      success: true,
      message: 'Déconnexion réussie. Supprimez le token côté client.'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Récupérer les informations de l'utilisateur connecté
 */
export const me = async (req, res, next) => {
  try {
    // req.user est défini par le middleware authenticate
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié.'
      });
    }

    res.json({
      success: true,
      message: 'Utilisateur récupéré avec succès.',
      data: {
        user: req.user
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/update-password
 * Changer le mot de passe de l'utilisateur connecté
 */
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await authService.updatePassword(req.user.id, currentPassword, newPassword);

    logger.info(`Mot de passe modifié pour: ${user.username}`);

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès.'
    });

  } catch (error) {
    logger.error(`Erreur lors du changement de mot de passe: ${error.message}`);
    next(error);
  }
};
