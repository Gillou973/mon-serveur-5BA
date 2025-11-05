import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const ProductVariant = sequelize.define('ProductVariant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'SKU unique de la variante (ex: TSHIRT-R-S)'
  },
  // Attributs de variation
  size: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Taille: S, M, L, XL, 36, 38, etc.'
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Nom de la couleur: Rouge, Bleu, Noir, etc.'
  },
  color_hex: {
    type: DataTypes.STRING(7),
    allowNull: true,
    comment: 'Code hexadécimal de la couleur: #FF0000, #0000FF'
  },
  // Prix et stock spécifiques
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Prix spécifique à cette variante. Si null, utilise le prix du produit parent'
  },
  compare_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Prix barré pour cette variante'
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    },
    comment: 'Stock disponible pour cette variante'
  },
  // Images spécifiques à la variante
  images: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Images spécifiques à cette variante (optionnel)'
    // Format: [{ thumbnail, medium, large, original }, ...]
  },
  // Métadonnées
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Poids spécifique en kg (peut différer du produit parent)'
  },
  barcode: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Code-barres de la variante'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Variante active et disponible à la vente'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Ordre d\'affichage de la variante'
  }
}, {
  tableName: 'product_variants',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['sku']
    },
    {
      fields: ['product_id']
    },
    {
      fields: ['size']
    },
    {
      fields: ['color']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['quantity']
    },
    {
      // Index composite pour recherche rapide par produit + attributs
      fields: ['product_id', 'size', 'color']
    }
  ]
});

// Méthode pour vérifier la disponibilité
ProductVariant.prototype.isAvailable = function (requestedQuantity = 1) {
  if (!this.is_active) return false;
  return this.quantity >= requestedQuantity;
};

// Méthode pour obtenir le prix effectif (prix variante ou prix produit)
ProductVariant.prototype.getEffectivePrice = async function () {
  if (this.price !== null && this.price !== undefined) {
    return parseFloat(this.price);
  }

  // Si pas de prix spécifique, récupérer le prix du produit parent
  const Product = sequelize.models.Product;
  const product = await Product.findByPk(this.product_id);
  return product ? parseFloat(product.price) : 0;
};

// Méthode pour générer une description complète
ProductVariant.prototype.getDescription = function () {
  const parts = [];
  if (this.color) parts.push(this.color);
  if (this.size) parts.push(`Taille ${this.size}`);
  return parts.join(' - ');
};

export default ProductVariant;
