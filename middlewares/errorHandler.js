import { logger } from '../logger.js';

/**
 * Middleware de gestion centralisée des erreurs
 * À placer après toutes les routes dans app.js
 */
export const errorHandler = (err, req, res, next) => {
  // Log de l'erreur
  logger.error(`[${req.method}] ${req.path} - ${err.message}`);

  // Erreurs de validation Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    });
  }

  // Erreurs de contrainte unique Sequelize (email/username déjà existant)
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Cette ressource existe déjà',
      errors: err.errors.map(e => ({
        field: e.path,
        message: `${e.path} déjà utilisé`
      }))
    });
  }

  // Erreurs de clé étrangère Sequelize
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Référence invalide à une ressource inexistante'
    });
  }

  // Erreurs de connexion à la base de données
  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
    return res.status(503).json({
      success: false,
      message: 'Erreur de connexion à la base de données. Veuillez réessayer plus tard.'
    });
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expiré'
    });
  }

  // Erreurs personnalisées avec status code
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.data && { data: err.data })
    });
  }

  // Erreur 404 - Ressource non trouvée
  if (err.message && err.message.includes('not found')) {
    return res.status(404).json({
      success: false,
      message: 'Ressource non trouvée'
    });
  }

  // Erreur par défaut (500 - Internal Server Error)
  // En production, ne pas exposer les détails de l'erreur
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    message: 'Une erreur interne est survenue',
    ...(isDevelopment && {
      error: err.message,
      stack: err.stack
    })
  });
};

/**
 * Middleware pour gérer les routes non trouvées (404)
 * À placer avant le errorHandler dans app.js
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.path,
    method: req.method
  });
};

/**
 * Classe pour créer des erreurs personnalisées avec status code
 * Usage: throw new AppError('Message d\'erreur', 400)
 */
export class AppError extends Error {
  constructor(message, statusCode, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
