import { validationResult } from 'express-validator';

/**
 * Middleware de validation
 * Vérifie les résultats de express-validator et retourne les erreurs
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données.',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }

  next();
};
