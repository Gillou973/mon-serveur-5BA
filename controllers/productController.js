import { Op } from 'sequelize';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { AppError } from '../middlewares/errorHandler.js';
import { processProductImage, deleteProductImage as deleteImageFiles } from '../utils/imageProcessor.js';

/**
 * Récupérer tous les produits avec filtres, recherche et pagination
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category_id,
      is_active,
      is_featured,
      min_price,
      max_price,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      in_stock
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Filtres
    if (category_id) where.category_id = category_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (is_featured !== undefined) where.is_featured = is_featured === 'true';

    // Filtres de prix
    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = parseFloat(min_price);
      if (max_price) where.price[Op.lte] = parseFloat(max_price);
    }

    // Filtre stock
    if (in_stock === 'true') {
      where.quantity = { [Op.gt]: 0 };
    }

    // Recherche
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Validation du tri
    const allowedSortFields = ['name', 'price', 'created_at', 'quantity'];
    const orderField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const orderDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      }],
      limit: parseInt(limit),
      offset,
      order: [[orderField, orderDirection]],
      distinct: true
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer un produit par ID
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug', 'description']
      }]
    });

    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer un produit par slug
 */
export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      where: { slug },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug', 'description']
      }]
    });

    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer un nouveau produit (Admin)
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      short_description,
      price,
      compare_price,
      cost_price,
      sku,
      barcode,
      quantity,
      track_inventory,
      images,
      category_id,
      is_active,
      is_featured,
      weight,
      dimensions,
      meta_title,
      meta_description,
      tags
    } = req.body;

    // Vérifier que la catégorie existe si fournie
    if (category_id) {
      const category = await Category.findByPk(category_id);
      if (!category) {
        throw new AppError('Catégorie non trouvée', 404);
      }
    }

    const product = await Product.create({
      name,
      slug,
      description,
      short_description,
      price,
      compare_price,
      cost_price,
      sku,
      barcode,
      quantity,
      track_inventory,
      images,
      category_id,
      is_active,
      is_featured,
      weight,
      dimensions,
      meta_title,
      meta_description,
      tags
    });

    // Recharger avec la catégorie
    await product.reload({
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour un produit (Admin)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    // Vérifier que la catégorie existe si fournie
    if (updateData.category_id) {
      const category = await Category.findByPk(updateData.category_id);
      if (!category) {
        throw new AppError('Catégorie non trouvée', 404);
      }
    }

    await product.update(updateData);

    // Recharger avec la catégorie
    await product.reload({
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      }]
    });

    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour le stock d'un produit (Admin/Manager)
 */
export const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body;

    if (!['set', 'add', 'subtract'].includes(operation)) {
      throw new AppError('Opération invalide. Utilisez: set, add, ou subtract', 400);
    }

    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    let newQuantity;
    switch (operation) {
      case 'set':
        newQuantity = parseInt(quantity);
        break;
      case 'add':
        newQuantity = product.quantity + parseInt(quantity);
        break;
      case 'subtract':
        newQuantity = product.quantity - parseInt(quantity);
        break;
    }

    if (newQuantity < 0) {
      throw new AppError('La quantité ne peut pas être négative', 400);
    }

    await product.update({ quantity: newQuantity });

    res.json({
      success: true,
      message: 'Stock mis à jour avec succès',
      data: {
        id: product.id,
        name: product.name,
        old_quantity: product.quantity,
        new_quantity: newQuantity
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer un produit (Admin)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Produit supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vérifier la disponibilité d'un produit
 */
export const checkAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity = 1 } = req.query;

    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    const available = product.isAvailable(parseInt(quantity));

    res.json({
      success: true,
      data: {
        product_id: product.id,
        product_name: product.name,
        requested_quantity: parseInt(quantity),
        available,
        current_stock: product.track_inventory ? product.quantity : 'Illimité',
        is_active: product.is_active
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload d'images pour un produit (Admin)
 */
export const uploadProductImages = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que le produit existe
    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    // Vérifier qu'il y a des fichiers
    if (!req.files || req.files.length === 0) {
      throw new AppError('Aucune image fournie', 400);
    }

    // Traiter chaque image
    const imagePromises = req.files.map(async (file) => {
      const imageUrls = await processProductImage(file.path, id, file.originalname);
      return imageUrls;
    });

    const processedImages = await Promise.all(imagePromises);

    // Récupérer les images existantes
    const existingImages = product.images || [];

    // Ajouter les nouvelles images (créer un nouveau tableau pour que Sequelize détecte le changement)
    const updatedImages = [...existingImages, ...processedImages];

    // Mettre à jour le produit
    product.images = updatedImages;
    product.changed('images', true); // Marquer explicitement le champ comme modifié
    await product.save();

    res.json({
      success: true,
      message: `${processedImages.length} image(s) uploadée(s) avec succès`,
      data: {
        product_id: product.id,
        images: updatedImages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer une image d'un produit (Admin)
 */
export const deleteProductImage = async (req, res, next) => {
  try {
    const { id, imageIndex } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    const images = product.images || [];
    const index = parseInt(imageIndex);

    if (index < 0 || index >= images.length) {
      throw new AppError('Index d\'image invalide', 400);
    }

    // Récupérer l'image à supprimer
    const imageToDelete = images[index];

    // Supprimer les fichiers physiques
    await deleteImageFiles(imageToDelete);

    // Créer un nouveau tableau sans l'image supprimée (pour que Sequelize détecte le changement)
    const updatedImages = images.filter((_, i) => i !== index);

    // Mettre à jour le produit avec le nouveau tableau
    product.images = updatedImages;
    product.changed('images', true); // Marquer explicitement le champ comme modifié
    await product.save();

    res.json({
      success: true,
      message: 'Image supprimée avec succès',
      data: {
        product_id: product.id,
        images: updatedImages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Réorganiser les images d'un produit (Admin)
 */
export const reorderProductImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageOrder } = req.body;

    if (!Array.isArray(imageOrder)) {
      throw new AppError('imageOrder doit être un tableau d\'indices', 400);
    }

    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    const images = product.images || [];

    // Vérifier que les indices sont valides
    if (imageOrder.length !== images.length) {
      throw new AppError('Le nombre d\'indices ne correspond pas au nombre d\'images', 400);
    }

    const uniqueIndices = new Set(imageOrder);
    if (uniqueIndices.size !== imageOrder.length) {
      throw new AppError('Les indices doivent être uniques', 400);
    }

    for (const index of imageOrder) {
      if (index < 0 || index >= images.length) {
        throw new AppError(`Index invalide: ${index}`, 400);
      }
    }

    // Réorganiser les images (créer un nouveau tableau)
    const reorderedImages = imageOrder.map(index => images[index]);

    // Mettre à jour le produit
    product.images = reorderedImages;
    product.changed('images', true); // Marquer explicitement le champ comme modifié
    await product.save();

    res.json({
      success: true,
      message: 'Images réorganisées avec succès',
      data: {
        product_id: product.id,
        images: reorderedImages
      }
    });
  } catch (error) {
    next(error);
  }
};
