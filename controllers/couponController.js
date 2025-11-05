import Coupon from '../models/Coupon.js';
import { AppError } from '../middlewares/errorHandler.js';
import { Op } from 'sequelize';

// Obtenir tous les coupons (Admin)
export const getAllCoupons = async (req, res, next) => {
  try {
    const { is_active, type, search } = req.query;

    const where = {};

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const coupons = await Coupon.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [{
        association: 'creator',
        attributes: ['id', 'username', 'email']
      }]
    });

    res.json({
      success: true,
      data: coupons,
      count: coupons.length
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir un coupon par ID
export const getCouponById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id, {
      include: [{
        association: 'creator',
        attributes: ['id', 'username', 'email']
      }]
    });

    if (!coupon) {
      throw new AppError('Coupon non trouvé', 404);
    }

    res.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

// Valider un coupon par code (Public)
export const validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { subtotal, user_id } = req.body;

    const coupon = await Coupon.findOne({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      throw new AppError('Code promo invalide', 404);
    }

    // Vérifier la validité
    const validation = coupon.isValid(user_id);
    if (!validation.valid) {
      throw new AppError(validation.reason, 400);
    }

    // Calculer la réduction
    const discountResult = coupon.calculateDiscount(subtotal);

    res.json({
      success: true,
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value
        },
        discount: discountResult.discount,
        reason: discountResult.reason
      }
    });
  } catch (error) {
    next(error);
  }
};

// Créer un coupon (Admin)
export const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      min_purchase_amount,
      max_discount_amount,
      usage_limit,
      usage_limit_per_user,
      applies_to,
      product_ids,
      category_ids,
      excluded_product_ids,
      valid_from,
      valid_until,
      is_active
    } = req.body;

    // Vérifier si le code existe déjà
    const existingCoupon = await Coupon.findOne({
      where: { code: code.toUpperCase() }
    });

    if (existingCoupon) {
      throw new AppError('Ce code promo existe déjà', 400);
    }

    // Créer le coupon
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      min_purchase_amount: min_purchase_amount || 0,
      max_discount_amount,
      usage_limit,
      usage_limit_per_user: usage_limit_per_user || 1,
      applies_to: applies_to || 'all',
      product_ids: product_ids || [],
      category_ids: category_ids || [],
      excluded_product_ids: excluded_product_ids || [],
      valid_from,
      valid_until,
      is_active: is_active !== undefined ? is_active : true,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Coupon créé avec succès',
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour un coupon (Admin)
export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      throw new AppError('Coupon non trouvé', 404);
    }

    // Si le code est modifié, vérifier qu'il n'existe pas déjà
    if (updates.code && updates.code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        where: {
          code: updates.code.toUpperCase(),
          id: { [Op.ne]: id }
        }
      });

      if (existingCoupon) {
        throw new AppError('Ce code promo existe déjà', 400);
      }

      updates.code = updates.code.toUpperCase();
    }

    await coupon.update(updates);

    res.json({
      success: true,
      message: 'Coupon mis à jour avec succès',
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer un coupon (Admin)
export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      throw new AppError('Coupon non trouvé', 404);
    }

    await coupon.destroy();

    res.json({
      success: true,
      message: 'Coupon supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir les statistiques d'un coupon (Admin)
export const getCouponStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      throw new AppError('Coupon non trouvé', 404);
    }

    const stats = {
      code: coupon.code,
      name: coupon.name,
      usage_count: coupon.usage_count,
      usage_limit: coupon.usage_limit,
      remaining_uses: coupon.usage_limit ? coupon.usage_limit - coupon.usage_count : 'Illimité',
      is_active: coupon.is_active,
      is_valid: coupon.isValid().valid,
      valid_from: coupon.valid_from,
      valid_until: coupon.valid_until
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// Désactiver/Activer un coupon (Admin)
export const toggleCouponStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      throw new AppError('Coupon non trouvé', 404);
    }

    await coupon.update({ is_active: !coupon.is_active });

    res.json({
      success: true,
      message: `Coupon ${coupon.is_active ? 'activé' : 'désactivé'} avec succès`,
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};
