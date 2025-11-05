/**
 * Middleware de vérification des rôles
 * À utiliser après le middleware authenticate
 */

/**
 * Vérifie si l'utilisateur a l'un des rôles autorisés
 * @param {...string} allowedRoles - Rôles autorisés (admin, manager, editor, user)
 */
export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise.'
      });
    }

    // Vérifier si l'utilisateur a un des rôles autorisés
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}`,
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Vérifie si l'utilisateur est admin
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs.'
    });
  }

  next();
};

/**
 * Vérifie si l'utilisateur est admin ou manager
 */
export const isAdminOrManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise.'
    });
  }

  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs et managers.'
    });
  }

  next();
};

/**
 * Vérifie si l'utilisateur accède à ses propres ressources ou est admin
 * Utile pour les routes /users/:id
 */
export const isSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise.'
    });
  }

  const requestedUserId = req.params.id;
  const currentUserId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  // Autoriser si c'est l'utilisateur lui-même ou un admin
  if (requestedUserId === currentUserId || isAdmin) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Vous ne pouvez accéder qu\'à vos propres ressources.'
  });
};
