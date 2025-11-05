import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { productsDir, categoriesDir, tempDir } from '../config/multer.js';

/**
 * Traite une image uploadée : compression, resize, optimisation
 * @param {string} inputPath - Chemin du fichier original
 * @param {string} outputDir - Dossier de destination
 * @param {string} filename - Nom du fichier de sortie
 * @param {object} options - Options de traitement
 * @returns {Promise<object>} - Informations sur l'image traitée
 */
export const processImage = async (inputPath, outputDir, filename, options = {}) => {
  const {
    width = 1200,
    height = null,
    quality = 85,
    format = 'jpeg',
    generateThumbnail = true,
    thumbnailWidth = 300
  } = options;

  try {
    const outputPath = path.join(outputDir, filename);
    const filenameWithoutExt = path.parse(filename).name;
    const thumbnailPath = path.join(outputDir, `${filenameWithoutExt}-thumb.${format}`);

    // Image principale
    const imageInfo = await sharp(inputPath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat(format, { quality })
      .toFile(outputPath);

    const result = {
      filename: filename,
      path: outputPath,
      url: `/uploads/${path.basename(outputDir)}/${filename}`,
      size: imageInfo.size,
      width: imageInfo.width,
      height: imageInfo.height,
      format: imageInfo.format
    };

    // Générer une miniature si demandé
    if (generateThumbnail) {
      await sharp(inputPath)
        .resize(thumbnailWidth, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat(format, { quality: 80 })
        .toFile(thumbnailPath);

      result.thumbnail = {
        filename: `${filenameWithoutExt}-thumb.${format}`,
        path: thumbnailPath,
        url: `/uploads/${path.basename(outputDir)}/${filenameWithoutExt}-thumb.${format}`
      };
    }

    // Supprimer le fichier temporaire
    await fs.unlink(inputPath);

    return result;
  } catch (error) {
    // En cas d'erreur, supprimer le fichier temporaire
    try {
      await fs.unlink(inputPath);
    } catch (unlinkError) {
      console.error('Erreur lors de la suppression du fichier temporaire:', unlinkError);
    }
    throw error;
  }
};

/**
 * Traite plusieurs images en parallèle
 * @param {Array} files - Tableau de fichiers multer
 * @param {string} type - Type d'entité (products, categories)
 * @param {object} options - Options de traitement
 * @returns {Promise<Array>} - Tableau d'informations sur les images traitées
 */
export const processMultipleImages = async (files, type = 'products', options = {}) => {
  const outputDir = type === 'products' ? productsDir : categoriesDir;

  const promises = files.map((file, index) => {
    const ext = options.format || 'jpeg';
    const filename = `${Date.now()}-${index}.${ext}`;
    return processImage(file.path, outputDir, filename, options);
  });

  return Promise.all(promises);
};

/**
 * Supprime une image et sa miniature
 * @param {string} imagePath - Chemin de l'image
 * @returns {Promise<void>}
 */
export const deleteImage = async (imagePath) => {
  try {
    // Supprimer l'image principale
    await fs.unlink(imagePath);

    // Supprimer la miniature si elle existe
    const parsed = path.parse(imagePath);
    const thumbnailPath = path.join(parsed.dir, `${parsed.name}-thumb${parsed.ext}`);

    try {
      await fs.unlink(thumbnailPath);
    } catch (error) {
      // La miniature n'existe peut-être pas, ignorer l'erreur
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    throw error;
  }
};

/**
 * Supprime plusieurs images
 * @param {Array<string>} imagePaths - Tableau de chemins d'images
 * @returns {Promise<Array>}
 */
export const deleteMultipleImages = async (imagePaths) => {
  const promises = imagePaths.map(imagePath => deleteImage(imagePath));
  return Promise.allSettled(promises);
};

/**
 * Nettoie les fichiers temporaires anciens (plus de 24h)
 * @returns {Promise<number>} - Nombre de fichiers supprimés
 */
export const cleanupTempFiles = async () => {
  try {
    const files = await fs.readdir(tempDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Erreur lors du nettoyage des fichiers temporaires:', error);
    return 0;
  }
};

export default {
  processImage,
  processMultipleImages,
  deleteImage,
  deleteMultipleImages,
  cleanupTempFiles
};
