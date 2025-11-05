import Discount from '../models/Discount.js';
import { AppError } from '../middlewares/errorHandler.js';
import { Op } from 'sequelize';

// Obtenir toutes les réductions (Admin)
export const getAllDiscounts = async (req, res, next) => {
  try {
    const { is_active, type, applies_to } = req.query;

    const where = {};

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    if (type) {
      where.type = type;
    }

    if (applies_to) {
      where.applies_to = applies_to;
    }

    const discounts = await Discount.findAll({
      where,
      order: [['priority', 'DESC'], ['created_at', 'DESC']],
      include: [{
        association: 'creator',
        attributes: ['id', 'username', 'email']
      }]
    });

    res.json({
      success: true,
      data: discounts,
      count: discounts.length
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir les réductions actives (Public)
export const getActiveDiscounts = async (req, res, next) => {
  try {
    const { applies_to, target_id } = req.query;

    const discounts = await Discount.getActiveDiscounts({
      applies_to,
      target_id
    });

    res.json({
      success: true,
      data: discounts,
      count: discounts.length
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir une réduction par ID
export const getDiscountById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discount = await Discount.findByPk(id, {
      include: [{
        association: 'creator',
        attributes: ['id', 'username', 'email']
      }]
    });

    if (!discount) {
      throw new AppError('Réduction non trouvée', 404);
    }

    res.json({
      success: true,
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

// Créer une réduction (Admin)
export const createDiscount = async (req, res, next) => {
  try {
    const {
      name,
      description,
      type,
      value,
      applies_to,
      target_ids,
      excluded_ids,
      min_quantity,
      max_discount_amount,
      priority,
      stackable,
      stackable_with_coupons,
      valid_from,
      valid_until,
      is_active,
      badge_text,
      badge_color
    } = req.body;

    const discount = await Discount.create({
      name,
      description,
      type,
      value,
      applies_to: applies_to || 'all',
      target_ids: target_ids || [],
      excluded_ids: excluded_ids || [],
      min_quantity: min_quantity || 1,
      max_discount_amount,
      priority: priority || 0,
      stackable: stackable || false,
      stackable_with_coupons: stackable_with_coupons !== undefined ? stackable_with_coupons : true,
      valid_from,
      valid_until,
      is_active: is_active !== undefined ? is_active : true,
      badge_text,
      badge_color,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Réduction créée avec succès',
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour une réduction (Admin)
export const updateDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const discount = await Discount.findByPk(id);

    if (!discount) {
      throw new AppError('Réduction non trouvée', 404);
    }

    await discount.update(updates);

    res.json({
      success: true,
      message: 'Réduction mise à jour avec succès',
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer une réduction (Admin)
export const deleteDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discount = await Discount.findByPk(id);

    if (!discount) {
      throw new AppError('Réduction non trouvée', 404);
    }

    await discount.destroy();

    res.json({
      success: true,
      message: 'Réduction supprimée avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// Désactiver/Activer une réduction (Admin)
export const toggleDiscountStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discount = await Discount.findByPk(id);

    if (!discount) {
      throw new AppError('Réduction non trouvée', 404);
    }

    await discount.update({ is_active: !discount.is_active });

    res.json({
      success: true,
      message: `Réduction ${discount.is_active ? 'activée' : 'désactivée'} avec succès`,
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir les réductions applicables à un produit (Public)
export const getProductDiscounts = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const discounts = await Discount.getActiveDiscounts({
      applies_to: 'product',
      target_id: productId
    });

    res.json({
      success: true,
      data: discounts,
      count: discounts.length
    });
  } catch (error) {
    next(error);
  }
};
