import { Op } from 'sequelize';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Récupérer toutes les catégories avec hiérarchie optionnelle
 */
export const getAllCategories = async (req, res, next) => {
  try {
    const {
      include_subcategories = 'true',
      include_products = 'false',
      is_active,
      parent_id
    } = req.query;

    const where = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (parent_id !== undefined) {
      where.parent_id = parent_id === 'null' ? null : parent_id;
    }

    const include = [];

    // Inclure les sous-catégories
    if (include_subcategories === 'true') {
      include.push({
        model: Category,
        as: 'subcategories',
        attributes: ['id', 'name', 'slug', 'description', 'image_url', 'is_active', 'sort_order']
      });
    }

    // Inclure les produits
    if (include_products === 'true') {
      include.push({
        model: Product,
        as: 'products',
        attributes: ['id', 'name', 'slug', 'price', 'images', 'is_active']
      });
    }

    const categories = await Category.findAll({
      where,
      include,
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer une catégorie par ID
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'subcategories',
          attributes: ['id', 'name', 'slug', 'description', 'image_url', 'is_active']
        },
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    if (!category) {
      throw new AppError('Catégorie non trouvée', 404);
    }

    // Compter les produits dans cette catégorie
    const productsCount = await Product.count({
      where: { category_id: category.id }
    });

    res.json({
      success: true,
      data: {
        ...category.toJSON(),
        products_count: productsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer une catégorie par slug
 */
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({
      where: { slug },
      include: [
        {
          model: Category,
          as: 'subcategories',
          attributes: ['id', 'name', 'slug', 'description', 'image_url', 'is_active']
        },
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    if (!category) {
      throw new AppError('Catégorie non trouvée', 404);
    }

    // Compter les produits dans cette catégorie
    const productsCount = await Product.count({
      where: { category_id: category.id }
    });

    res.json({
      success: true,
      data: {
        ...category.toJSON(),
        products_count: productsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer une nouvelle catégorie (Admin)
 */
export const createCategory = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      image_url,
      parent_id,
      is_active,
      sort_order
    } = req.body;

    // Vérifier que la catégorie parente existe si fournie
    if (parent_id) {
      const parentCategory = await Category.findByPk(parent_id);
      if (!parentCategory) {
        throw new AppError('Catégorie parente non trouvée', 404);
      }
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image_url,
      parent_id,
      is_active,
      sort_order
    });

    // Recharger avec les relations
    await category.reload({
      include: [
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour une catégorie (Admin)
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      throw new AppError('Catégorie non trouvée', 404);
    }

    // Empêcher qu'une catégorie devienne sa propre parente
    if (updateData.parent_id === id) {
      throw new AppError('Une catégorie ne peut pas être sa propre parente', 400);
    }

    // Vérifier que la catégorie parente existe si fournie
    if (updateData.parent_id) {
      const parentCategory = await Category.findByPk(updateData.parent_id);
      if (!parentCategory) {
        throw new AppError('Catégorie parente non trouvée', 404);
      }

      // Empêcher les boucles (vérifier que la nouvelle parente n'est pas une sous-catégorie)
      const subcategories = await Category.findAll({
        where: { parent_id: id }
      });

      if (subcategories.some(sub => sub.id === updateData.parent_id)) {
        throw new AppError('Impossible de créer une relation circulaire', 400);
      }
    }

    await category.update(updateData);

    // Recharger avec les relations
    await category.reload({
      include: [
        {
          model: Category,
          as: 'subcategories',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Catégorie mise à jour avec succès',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer une catégorie (Admin)
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      throw new AppError('Catégorie non trouvée', 404);
    }

    // Vérifier s'il y a des sous-catégories
    const subcategoriesCount = await Category.count({
      where: { parent_id: id }
    });

    if (subcategoriesCount > 0) {
      throw new AppError(
        `Impossible de supprimer cette catégorie car elle contient ${subcategoriesCount} sous-catégorie(s)`,
        400
      );
    }

    // Vérifier s'il y a des produits
    const productsCount = await Product.count({
      where: { category_id: id }
    });

    if (productsCount > 0) {
      throw new AppError(
        `Impossible de supprimer cette catégorie car elle contient ${productsCount} produit(s)`,
        400
      );
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Catégorie supprimée avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir l'arbre hiérarchique complet des catégories
 */
export const getCategoryTree = async (req, res, next) => {
  try {
    const { is_active } = req.query;
    const where = { parent_id: null };

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    // Fonction récursive pour charger les sous-catégories
    const loadSubcategories = async (parentId, activeFilter) => {
      const subcatWhere = { parent_id: parentId };
      if (activeFilter !== undefined) {
        subcatWhere.is_active = activeFilter;
      }

      const subcats = await Category.findAll({
        where: subcatWhere,
        attributes: ['id', 'name', 'slug', 'description', 'image_url', 'is_active', 'sort_order'],
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      });

      // Charger récursivement les sous-catégories de chaque sous-catégorie
      for (const subcat of subcats) {
        subcat.dataValues.subcategories = await loadSubcategories(
          subcat.id,
          activeFilter !== undefined ? activeFilter : undefined
        );
      }

      return subcats;
    };

    // Charger les catégories racines
    const rootCategories = await Category.findAll({
      where,
      attributes: ['id', 'name', 'slug', 'description', 'image_url', 'is_active', 'sort_order'],
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    // Charger les sous-catégories pour chaque catégorie racine
    for (const category of rootCategories) {
      category.dataValues.subcategories = await loadSubcategories(
        category.id,
        is_active !== undefined ? is_active === 'true' : undefined
      );
    }

    res.json({
      success: true,
      data: rootCategories
    });
  } catch (error) {
    next(error);
  }
};
