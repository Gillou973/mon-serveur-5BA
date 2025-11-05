import Bundle from '../models/Bundle.js';
import { AppError } from '../middlewares/errorHandler.js';
import { Op } from 'sequelize';

// Obtenir tous les bundles (Admin)
export const getAllBundles = async (req, res, next) => {
  try {
    const { is_active, type } = req.query;

    const where = {};

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    if (type) {
      where.type = type;
    }

    const bundles = await Bundle.findAll({
      where,
      order: [['priority', 'DESC'], ['created_at', 'DESC']],
      include: [{
        association: 'creator',
        attributes: ['id', 'username', 'email']
      }]
    });

    res.json({
      success: true,
      data: bundles,
      count: bundles.length
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir les bundles actifs (Public)
export const getActiveBundles = async (req, res, next) => {
  try {
    const bundles = await Bundle.getActiveBundles();

    res.json({
      success: true,
      data: bundles,
      count: bundles.length
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir un bundle par ID
export const getBundleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bundle = await Bundle.findByPk(id, {
      include: [{
        association: 'creator',
        attributes: ['id', 'username', 'email']
      }]
    });

    if (!bundle) {
      throw new AppError('Bundle non trouvé', 404);
    }

    res.json({
      success: true,
      data: bundle
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir les bundles pour un produit (Public)
export const getProductBundles = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const bundles = await Bundle.getActiveBundles();

    // Filtrer les bundles contenant ce produit
    const productBundles = bundles.filter(bundle =>
      bundle.product_ids.includes(productId)
    );

    res.json({
      success: true,
      data: productBundles,
      count: productBundles.length
    });
  } catch (error) {
    next(error);
  }
};

// Créer un bundle (Admin)
export const createBundle = async (req, res, next) => {
  try {
    const {
      name,
      description,
      type,
      product_ids,
      required_quantity,
      free_quantity,
      free_product_id,
      bundle_price,
      discount_percentage,
      min_items_required,
      max_redemptions,
      max_redemptions_per_user,
      auto_apply,
      requires_all_products,
      priority,
      stackable,
      valid_from,
      valid_until,
      is_active,
      badge_text,
      display_on_product_page
    } = req.body;

    // Validation selon le type
    if (type === 'buy_x_get_y') {
      if (!required_quantity || !free_quantity) {
        throw new AppError('required_quantity et free_quantity sont requis pour ce type de bundle', 400);
      }
    } else if (type === 'bundle_price') {
      if (!bundle_price) {
        throw new AppError('bundle_price est requis pour ce type de bundle', 400);
      }
    } else if (type === 'bundle_percentage') {
      if (!discount_percentage) {
        throw new AppError('discount_percentage est requis pour ce type de bundle', 400);
      }
    }

    const bundle = await Bundle.create({
      name,
      description,
      type,
      product_ids: product_ids || [],
      required_quantity,
      free_quantity,
      free_product_id,
      bundle_price,
      discount_percentage,
      min_items_required: min_items_required || 1,
      max_redemptions,
      max_redemptions_per_user: max_redemptions_per_user || 1,
      auto_apply: auto_apply !== undefined ? auto_apply : true,
      requires_all_products: requires_all_products || false,
      priority: priority || 0,
      stackable: stackable || false,
      valid_from,
      valid_until,
      is_active: is_active !== undefined ? is_active : true,
      badge_text,
      display_on_product_page: display_on_product_page !== undefined ? display_on_product_page : true,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Bundle créé avec succès',
      data: bundle
    });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour un bundle (Admin)
export const updateBundle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const bundle = await Bundle.findByPk(id);

    if (!bundle) {
      throw new AppError('Bundle non trouvé', 404);
    }

    // Validation selon le type si le type est modifié
    if (updates.type) {
      if (updates.type === 'buy_x_get_y') {
        if (!updates.required_quantity && !bundle.required_quantity) {
          throw new AppError('required_quantity est requis', 400);
        }
        if (!updates.free_quantity && !bundle.free_quantity) {
          throw new AppError('free_quantity est requis', 400);
        }
      } else if (updates.type === 'bundle_price') {
        if (!updates.bundle_price && !bundle.bundle_price) {
          throw new AppError('bundle_price est requis', 400);
        }
      } else if (updates.type === 'bundle_percentage') {
        if (!updates.discount_percentage && !bundle.discount_percentage) {
          throw new AppError('discount_percentage est requis', 400);
        }
      }
    }

    await bundle.update(updates);

    res.json({
      success: true,
      message: 'Bundle mis à jour avec succès',
      data: bundle
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer un bundle (Admin)
export const deleteBundle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bundle = await Bundle.findByPk(id);

    if (!bundle) {
      throw new AppError('Bundle non trouvé', 404);
    }

    await bundle.destroy();

    res.json({
      success: true,
      message: 'Bundle supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// Désactiver/Activer un bundle (Admin)
export const toggleBundleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bundle = await Bundle.findByPk(id);

    if (!bundle) {
      throw new AppError('Bundle non trouvé', 404);
    }

    await bundle.update({ is_active: !bundle.is_active });

    res.json({
      success: true,
      message: `Bundle ${bundle.is_active ? 'activé' : 'désactivé'} avec succès`,
      data: bundle
    });
  } catch (error) {
    next(error);
  }
};

// Obtenir les statistiques d'un bundle (Admin)
export const getBundleStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bundle = await Bundle.findByPk(id);

    if (!bundle) {
      throw new AppError('Bundle non trouvé', 404);
    }

    const stats = {
      name: bundle.name,
      type: bundle.type,
      current_redemptions: bundle.current_redemptions,
      max_redemptions: bundle.max_redemptions,
      remaining_redemptions: bundle.max_redemptions ? bundle.max_redemptions - bundle.current_redemptions : 'Illimité',
      is_active: bundle.is_active,
      is_valid: bundle.isValid(),
      valid_from: bundle.valid_from,
      valid_until: bundle.valid_until
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
