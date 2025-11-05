import User from '../models/User.js';
import { logger } from '../logger.js';

/**
 * GET /api/users
 * Récupérer tous les utilisateurs avec pagination et filtres
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, is_active, limit = 50, offset = 0 } = req.query;

    // Construction des filtres
    const where = {};
    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const users = await User.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    const total = await User.count({ where });

    res.json({
      success: true,
      message: 'Utilisateurs récupérés avec succès',
      data: {
        users,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Récupérer un utilisateur par ID
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Utilisateur récupéré avec succès',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 * Créer un nouvel utilisateur (admin only)
 */
export const createUser = async (req, res, next) => {
  try {
    const { username, email, password, role, first_name, last_name } = req.body;

    // Validation basique
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Les champs username, email et password sont requis'
      });
    }

    const user = await User.create({
      username,
      email,
      password, // Sera hashé automatiquement par le hook beforeCreate
      role: role || 'user',
      first_name,
      last_name
    });

    logger.info(`Utilisateur créé par admin: ${user.username} (${user.email})`);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user
    });
  } catch (error) {
    // Gestion des erreurs de validation Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    // Gestion des contraintes uniques (email/username déjà existants)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Cet email ou username existe déjà'
      });
    }

    next(error);
  }
};

/**
 * PUT /api/users/:id
 * Mettre à jour un utilisateur
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, role, first_name, last_name, is_active } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mise à jour des champs
    await user.update({
      username: username || user.username,
      email: email || user.email,
      role: role || user.role,
      first_name: first_name !== undefined ? first_name : user.first_name,
      last_name: last_name !== undefined ? last_name : user.last_name,
      is_active: is_active !== undefined ? is_active : user.is_active
    });

    logger.info(`Utilisateur mis à jour: ${user.username} (ID: ${user.id})`);

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Cet email ou username existe déjà'
      });
    }

    next(error);
  }
};

/**
 * PATCH /api/users/:id/role
 * Mise à jour partielle - Changer le rôle d'un utilisateur
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'manager', 'editor', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide. Valeurs autorisées: admin, manager, editor, user'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    await user.update({ role });

    logger.info(`Rôle modifié pour ${user.username}: ${role}`);

    res.json({
      success: true,
      message: 'Rôle mis à jour avec succès',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 * Supprimer un utilisateur (soft delete par défaut)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query; // ?permanent=true pour suppression définitive

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (permanent === 'true') {
      // Suppression définitive
      const username = user.username;
      await user.destroy();

      logger.info(`Utilisateur supprimé définitivement: ${username} (ID: ${id})`);

      res.json({
        success: true,
        message: 'Utilisateur supprimé définitivement'
      });
    } else {
      // Soft delete (désactivation)
      await user.update({ is_active: false });

      logger.info(`Utilisateur désactivé: ${user.username} (ID: ${id})`);

      res.json({
        success: true,
        message: 'Utilisateur désactivé avec succès',
        user
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/me/addresses
 * Récupérer les adresses de l'utilisateur connecté
 */
export const getUserAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['addresses']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Adresses récupérées avec succès',
      addresses: user.addresses || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/me/addresses
 * Ajouter une adresse à l'utilisateur connecté
 */
export const addUserAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, address_line, zip_code, city, country, phone, is_default } = req.body;

    // Validation
    if (!name || !address_line || !zip_code || !city || !country) {
      return res.status(400).json({
        success: false,
        message: 'Les champs name, address_line, zip_code, city et country sont requis'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const addresses = user.addresses || [];

    // Si is_default est true, mettre toutes les autres adresses à false
    if (is_default) {
      addresses.forEach(addr => addr.is_default = false);
    }

    // Ajouter la nouvelle adresse
    const newAddress = {
      id: `addr_${Date.now()}`, // ID unique simple
      name,
      address_line,
      zip_code,
      city,
      country,
      phone: phone || '',
      is_default: is_default || false,
      created_at: new Date().toISOString()
    };

    addresses.push(newAddress);

    await user.update({ addresses });

    logger.info(`Adresse ajoutée pour utilisateur ${user.username} (ID: ${userId})`);

    res.status(201).json({
      success: true,
      message: 'Adresse ajoutée avec succès',
      address: newAddress,
      addresses: addresses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/me/addresses/:addressId
 * Modifier une adresse de l'utilisateur connecté
 */
export const updateUserAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const { name, address_line, zip_code, city, country, phone, is_default } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const addresses = user.addresses || [];
    const addressIndex = addresses.findIndex(addr => addr.id === addressId);

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Adresse non trouvée'
      });
    }

    // Si is_default est true, mettre toutes les autres adresses à false
    if (is_default) {
      addresses.forEach(addr => addr.is_default = false);
    }

    // Mettre à jour l'adresse
    addresses[addressIndex] = {
      ...addresses[addressIndex],
      name: name || addresses[addressIndex].name,
      address_line: address_line || addresses[addressIndex].address_line,
      zip_code: zip_code || addresses[addressIndex].zip_code,
      city: city || addresses[addressIndex].city,
      country: country || addresses[addressIndex].country,
      phone: phone !== undefined ? phone : addresses[addressIndex].phone,
      is_default: is_default !== undefined ? is_default : addresses[addressIndex].is_default,
      updated_at: new Date().toISOString()
    };

    await user.update({ addresses });

    logger.info(`Adresse modifiée pour utilisateur ${user.username} (ID: ${userId})`);

    res.json({
      success: true,
      message: 'Adresse modifiée avec succès',
      address: addresses[addressIndex],
      addresses: addresses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/me/addresses/:addressId
 * Supprimer une adresse de l'utilisateur connecté
 */
export const deleteUserAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const addresses = user.addresses || [];
    const addressIndex = addresses.findIndex(addr => addr.id === addressId);

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Adresse non trouvée'
      });
    }

    // Supprimer l'adresse
    addresses.splice(addressIndex, 1);

    await user.update({ addresses });

    logger.info(`Adresse supprimée pour utilisateur ${user.username} (ID: ${userId})`);

    res.json({
      success: true,
      message: 'Adresse supprimée avec succès',
      addresses: addresses
    });
  } catch (error) {
    next(error);
  }
};
