import { Op } from 'sequelize';
import ProductVariant from '../models/ProductVariant.js';
import Product from '../models/Product.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Récupérer toutes les variantes d'un produit
 */
export const getProductVariants = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const {
      is_active,
      size,
      color,
      in_stock,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // Vérifier que le produit existe
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    const where = { product_id: productId };

    // Filtres
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (size) where.size = size;
    if (color) where.color = { [Op.iLike]: `%${color}%` };
    if (in_stock === 'true') where.quantity = { [Op.gt]: 0 };

    // Validation du tri
    const allowedSortFields = ['size', 'color', 'price', 'quantity', 'created_at'];
    const orderField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const orderDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const variants = await ProductVariant.findAll({
      where,
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'price', 'has_variants']
      }],
      order: [[orderField, orderDirection]]
    });

    res.json({
      success: true,
      data: variants,
      count: variants.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer une variante par ID
 */
export const getVariantById = async (req, res, next) => {
  try {
    const { variantId } = req.params;

    const variant = await ProductVariant.findByPk(variantId, {
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'price', 'has_variants', 'description', 'images']
      }]
    });

    if (!variant) {
      throw new AppError('Variante non trouvée', 404);
    }

    res.json({
      success: true,
      data: variant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer une nouvelle variante (Admin)
 */
export const createVariant = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const {
      sku,
      size,
      color,
      color_hex,
      price,
      quantity,
      images,
      is_active
    } = req.body;

    // Vérifier que le produit existe
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    // Vérifier les champs requis
    if (!sku) {
      throw new AppError('Le SKU est obligatoire', 400);
    }

    // Vérifier l'unicité du SKU
    const existingVariant = await ProductVariant.findOne({ where: { sku } });
    if (existingVariant) {
      throw new AppError('Ce SKU existe déjà', 400);
    }

    // Créer la variante
    const variant = await ProductVariant.create({
      product_id: productId,
      sku,
      size,
      color,
      color_hex,
      price,
      quantity: quantity || 0,
      images: images || [],
      is_active: is_active !== undefined ? is_active : true
    });

    // Si c'est la première variante, mettre à jour le produit
    if (!product.has_variants) {
      await product.update({ has_variants: true });
    }

    // Recharger avec le produit
    await variant.reload({
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'price']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Variante créée avec succès',
      data: variant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer plusieurs variantes en une seule fois (Admin)
 */
export const createMultipleVariants = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { variants } = req.body;

    if (!Array.isArray(variants) || variants.length === 0) {
      throw new AppError('Le champ variants doit être un tableau non vide', 400);
    }

    // Vérifier que le produit existe
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    // Vérifier l'unicité des SKU
    const skus = variants.map(v => v.sku);
    const existingVariants = await ProductVariant.findAll({
      where: { sku: { [Op.in]: skus } }
    });

    if (existingVariants.length > 0) {
      const existingSkus = existingVariants.map(v => v.sku);
      throw new AppError(`SKU déjà existants: ${existingSkus.join(', ')}`, 400);
    }

    // Créer toutes les variantes
    const createdVariants = await Promise.all(
      variants.map(variantData =>
        ProductVariant.create({
          product_id: productId,
          sku: variantData.sku,
          size: variantData.size,
          color: variantData.color,
          color_hex: variantData.color_hex,
          price: variantData.price,
          quantity: variantData.quantity || 0,
          images: variantData.images || [],
          is_active: variantData.is_active !== undefined ? variantData.is_active : true
        })
      )
    );

    // Mettre à jour le produit
    if (!product.has_variants) {
      await product.update({ has_variants: true });
    }

    res.status(201).json({
      success: true,
      message: `${createdVariants.length} variante(s) créée(s) avec succès`,
      data: createdVariants
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour une variante (Admin)
 */
export const updateVariant = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const updateData = req.body;

    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) {
      throw new AppError('Variante non trouvée', 404);
    }

    // Si le SKU est modifié, vérifier l'unicité
    if (updateData.sku && updateData.sku !== variant.sku) {
      const existingVariant = await ProductVariant.findOne({
        where: {
          sku: updateData.sku,
          id: { [Op.ne]: variantId }
        }
      });
      if (existingVariant) {
        throw new AppError('Ce SKU existe déjà', 400);
      }
    }

    await variant.update(updateData);

    // Recharger avec le produit
    await variant.reload({
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'price']
      }]
    });

    res.json({
      success: true,
      message: 'Variante mise à jour avec succès',
      data: variant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour le stock d'une variante (Admin/Manager)
 */
export const updateVariantStock = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const { quantity, operation } = req.body;

    if (!['set', 'add', 'subtract'].includes(operation)) {
      throw new AppError('Opération invalide. Utilisez: set, add, ou subtract', 400);
    }

    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) {
      throw new AppError('Variante non trouvée', 404);
    }

    let newQuantity;
    const oldQuantity = variant.quantity;

    switch (operation) {
      case 'set':
        newQuantity = parseInt(quantity);
        break;
      case 'add':
        newQuantity = variant.quantity + parseInt(quantity);
        break;
      case 'subtract':
        newQuantity = variant.quantity - parseInt(quantity);
        break;
    }

    if (newQuantity < 0) {
      throw new AppError('La quantité ne peut pas être négative', 400);
    }

    await variant.update({ quantity: newQuantity });

    res.json({
      success: true,
      message: 'Stock de la variante mis à jour avec succès',
      data: {
        variant_id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        old_quantity: oldQuantity,
        new_quantity: newQuantity,
        operation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer une variante (Admin)
 */
export const deleteVariant = async (req, res, next) => {
  try {
    const { variantId } = req.params;

    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) {
      throw new AppError('Variante non trouvée', 404);
    }

    const productId = variant.product_id;

    await variant.destroy();

    // Vérifier s'il reste des variantes pour ce produit
    const remainingVariants = await ProductVariant.count({
      where: { product_id: productId }
    });

    // Si plus aucune variante, mettre à jour le produit
    if (remainingVariants === 0) {
      await Product.update(
        { has_variants: false },
        { where: { id: productId } }
      );
    }

    res.json({
      success: true,
      message: 'Variante supprimée avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vérifier la disponibilité d'une variante
 */
export const checkVariantAvailability = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const { quantity = 1 } = req.query;

    const variant = await ProductVariant.findByPk(variantId, {
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name']
      }]
    });

    if (!variant) {
      throw new AppError('Variante non trouvée', 404);
    }

    const requestedQuantity = parseInt(quantity);
    const available = variant.isAvailable(requestedQuantity);

    res.json({
      success: true,
      data: {
        variant_id: variant.id,
        product_name: variant.product.name,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        requested_quantity: requestedQuantity,
        available,
        current_stock: variant.quantity,
        is_active: variant.is_active
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir toutes les combinaisons possibles (tailles/couleurs) pour un produit
 */
export const getVariantCombinations = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Vérifier que le produit existe
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    const variants = await ProductVariant.findAll({
      where: { product_id: productId },
      attributes: ['size', 'color', 'color_hex']
    });

    // Extraire les tailles et couleurs uniques
    const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
    const colors = [...new Set(
      variants
        .filter(v => v.color)
        .map(v => JSON.stringify({
          name: v.color,
          hex: v.color_hex
        }))
    )].map(str => JSON.parse(str));

    res.json({
      success: true,
      data: {
        product_id: productId,
        sizes,
        colors,
        total_variants: variants.length
      }
    });
  } catch (error) {
    next(error);
  }
};
