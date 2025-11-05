import { processMultipleImages, deleteImage } from '../services/imageService.js';
import { AppError } from '../middlewares/errorHandler.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Upload d'images pour un produit
 * POST /api/upload/products/:productId
 */
export const uploadProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!req.files || req.files.length === 0) {
      throw new AppError('Aucun fichier uploadé', 400);
    }

    // Vérifier que le produit existe
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    // Traiter les images
    const processedImages = await processMultipleImages(req.files, 'products', {
      width: 1200,
      quality: 85,
      format: 'jpeg',
      generateThumbnail: true
    });

    // Ajouter les URLs des images au produit
    const currentImages = product.images || [];
    const newImages = processedImages.map(img => ({
      url: img.url,
      thumbnail: img.thumbnail?.url,
      alt: product.name,
      isPrimary: currentImages.length === 0 // La première image est principale
    }));

    await product.update({
      images: [...currentImages, ...newImages]
    });

    res.status(200).json({
      success: true,
      message: `${processedImages.length} image(s) uploadée(s) avec succès`,
      data: {
        images: newImages,
        product: product
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload d'images génériques (sans association immédiate)
 * POST /api/upload/images
 */
export const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError('Aucun fichier uploadé', 400);
    }

    const type = req.query.type || 'products';

    // Traiter les images
    const processedImages = await processMultipleImages(req.files, type, {
      width: 1200,
      quality: 85,
      format: 'jpeg',
      generateThumbnail: true
    });

    res.status(200).json({
      success: true,
      message: `${processedImages.length} image(s) uploadée(s) avec succès`,
      data: processedImages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload d'une image pour une catégorie
 * POST /api/upload/categories/:categoryId
 */
export const uploadCategoryImage = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    if (!req.file) {
      throw new AppError('Aucun fichier uploadé', 400);
    }

    // Vérifier que la catégorie existe
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new AppError('Catégorie non trouvée', 404);
    }

    // Traiter l'image
    const processedImages = await processMultipleImages([req.file], 'categories', {
      width: 800,
      quality: 85,
      format: 'jpeg',
      generateThumbnail: true
    });

    const imageUrl = processedImages[0].url;

    // Supprimer l'ancienne image si elle existe
    if (category.image_url) {
      try {
        const oldImagePath = path.join(process.cwd(), 'uploads', category.image_url.replace('/uploads/', ''));
        await deleteImage(oldImagePath);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'ancienne image:', error);
      }
    }

    // Mettre à jour la catégorie
    await category.update({ image_url: imageUrl });

    res.status(200).json({
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        imageUrl,
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer une image d'un produit
 * DELETE /api/upload/products/:productId/images
 */
export const deleteProductImage = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      throw new AppError('URL de l\'image requise', 400);
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    const images = product.images || [];
    const imageIndex = images.findIndex(img => img.url === imageUrl);

    if (imageIndex === -1) {
      throw new AppError('Image non trouvée dans ce produit', 404);
    }

    // Supprimer le fichier physique
    try {
      const imagePath = path.join(process.cwd(), 'uploads', imageUrl.replace('/uploads/', ''));
      await deleteImage(imagePath);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
    }

    // Retirer l'image du tableau
    images.splice(imageIndex, 1);

    // Si c'était l'image principale et qu'il reste des images, définir la première comme principale
    if (images.length > 0 && !images.some(img => img.isPrimary)) {
      images[0].isPrimary = true;
    }

    await product.update({ images });

    res.json({
      success: true,
      message: 'Image supprimée avec succès',
      data: { images }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Définir une image comme image principale
 * PATCH /api/upload/products/:productId/images/primary
 */
export const setPrimaryImage = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      throw new AppError('URL de l\'image requise', 400);
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    const images = product.images || [];
    const imageExists = images.some(img => img.url === imageUrl);

    if (!imageExists) {
      throw new AppError('Image non trouvée dans ce produit', 404);
    }

    // Retirer le flag isPrimary de toutes les images
    images.forEach(img => {
      img.isPrimary = img.url === imageUrl;
    });

    await product.update({ images });

    res.json({
      success: true,
      message: 'Image principale mise à jour',
      data: { images }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Réorganiser l'ordre des images
 * PUT /api/upload/products/:productId/images/reorder
 */
export const reorderImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { imageUrls } = req.body;

    if (!Array.isArray(imageUrls)) {
      throw new AppError('Le tableau d\'URLs est requis', 400);
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    const images = product.images || [];

    // Réorganiser les images selon l'ordre fourni
    const reorderedImages = imageUrls.map(url => {
      const image = images.find(img => img.url === url);
      if (!image) {
        throw new AppError(`Image non trouvée: ${url}`, 404);
      }
      return image;
    });

    await product.update({ images: reorderedImages });

    res.json({
      success: true,
      message: 'Ordre des images mis à jour',
      data: { images: reorderedImages }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadProductImages,
  uploadImages,
  uploadCategoryImage,
  deleteProductImage,
  setPrimaryImage,
  reorderImages
};
