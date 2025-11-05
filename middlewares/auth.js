import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware d'authentification JWT
 * Vérifie le token dans le header Authorization
 */
export const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Token manquant ou invalide.'
      });
    }

    // Extraire le token
    const token = authHeader.split(' ')[1];

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }

    // Vérifier si l'utilisateur est actif
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé.'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'authentification.',
      error: error.message
    });
  }
};

/**
 * Middleware optionnel - Authentifie si un token est présent
 * Utile pour les routes accessibles avec ou sans authentification
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Pas de token, on continue sans authentifier
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (user && user.is_active) {
      req.user = user;
    }

    next();
  } catch (error) {
    // En cas d'erreur, on continue sans authentifier
    next();
  }
};
