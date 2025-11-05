import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tailles des images
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  medium: { width: 500, height: 500 },
  large: { width: 1200, height: 1200 }
};

/**
 * Traiter et redimensionner une image en plusieurs tailles
 * @param {string} inputPath - Chemin du fichier original
 * @param {string} productId - ID du produit
 * @param {string} imageName - Nom de l'image
 * @returns {Promise<Object>} - URLs des différentes tailles
 */
export const processProductImage = async (inputPath, productId, imageName) => {
  try {
    // Créer le dossier du produit s'il n'existe pas
    const productDir = path.join(__dirname, '..', 'uploads', 'products', productId);

    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
    }

    // Générer un nom de fichier unique basé sur le timestamp
    const timestamp = Date.now();
    const ext = path.extname(imageName);
    const baseName = path.basename(imageName, ext);
    const uniqueName = `${baseName}-${timestamp}`;

    // URLs de retour
    const urls = {
      thumbnail: `/uploads/products/${productId}/${uniqueName}-thumb.webp`,
      medium: `/uploads/products/${productId}/${uniqueName}-medium.webp`,
      large: `/uploads/products/${productId}/${uniqueName}-large.webp`,
      original: `/uploads/products/${productId}/${uniqueName}-original${ext}`
    };

    // Lire l'image originale
    const imageBuffer = await fs.promises.readFile(inputPath);

    // Créer les différentes tailles en parallèle
    await Promise.all([
      // Thumbnail (150x150)
      sharp(imageBuffer)
        .resize(IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toFile(path.join(productDir, `${uniqueName}-thumb.webp`)),

      // Medium (500x500)
      sharp(imageBuffer)
        .resize(IMAGE_SIZES.medium.width, IMAGE_SIZES.medium.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 85 })
        .toFile(path.join(productDir, `${uniqueName}-medium.webp`)),

      // Large (1200x1200)
      sharp(imageBuffer)
        .resize(IMAGE_SIZES.large.width, IMAGE_SIZES.large.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 90 })
        .toFile(path.join(productDir, `${uniqueName}-large.webp`)),

      // Copier l'original
      fs.promises.copyFile(inputPath, path.join(productDir, `${uniqueName}-original${ext}`))
    ]);

    // Supprimer le fichier temporaire
    await fs.promises.unlink(inputPath);

    return urls;
  } catch (error) {
    // Nettoyer le fichier temporaire en cas d'erreur
    try {
      await fs.promises.unlink(inputPath);
    } catch (unlinkError) {
      // Ignorer l'erreur si le fichier n'existe plus
    }

    throw new Error(`Erreur lors du traitement de l'image: ${error.message}`);
  }
};

/**
 * Supprimer toutes les versions d'une image
 * @param {Object} imageUrls - Objet contenant les URLs de l'image
 */
export const deleteProductImage = async (imageUrls) => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');

    const filesToDelete = [
      imageUrls.thumbnail,
      imageUrls.medium,
      imageUrls.large,
      imageUrls.original
    ];

    // Supprimer tous les fichiers en parallèle
    await Promise.all(
      filesToDelete.map(async (url) => {
        if (url) {
          const filePath = path.join(uploadsDir, url.replace('/uploads/', ''));
          try {
            await fs.promises.unlink(filePath);
          } catch (err) {
            // Ignorer si le fichier n'existe pas
            if (err.code !== 'ENOENT') {
              console.error(`Erreur lors de la suppression de ${filePath}:`, err.message);
            }
          }
        }
      })
    );
  } catch (error) {
    console.error('Erreur lors de la suppression des images:', error.message);
    throw error;
  }
};

/**
 * Supprimer tous les fichiers d'un produit
 * @param {string} productId - ID du produit
 */
export const deleteAllProductImages = async (productId) => {
  try {
    const productDir = path.join(__dirname, '..', 'uploads', 'products', productId);

    if (fs.existsSync(productDir)) {
      await fs.promises.rm(productDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression du dossier du produit ${productId}:`, error.message);
    throw error;
  }
};

export default {
  processProductImage,
  deleteProductImage,
  deleteAllProductImages
};
