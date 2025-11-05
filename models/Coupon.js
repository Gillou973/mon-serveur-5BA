import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Code promo unique (ex: SUMMER20, WELCOME10)'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nom descriptif du coupon'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description de l\'offre'
  },
  // Type de réduction
  type: {
    type: DataTypes.ENUM('percentage', 'fixed_amount', 'free_shipping'),
    allowNull: false,
    defaultValue: 'percentage'
    // Note: comment removed due to Sequelize bug with ENUM + comment
  },
  // Valeur de la réduction
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Valeur de la réduction (pourcentage ou montant)'
  },
  // Conditions d'application
  min_purchase_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Montant minimum d\'achat requis'
  },
  max_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Montant maximum de réduction (pour les pourcentages)'
  },
  // Limites d'utilisation
  usage_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Nombre maximum d\'utilisations (null = illimité)'
  },
  usage_limit_per_user: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Nombre max d\'utilisations par utilisateur'
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Nombre d\'utilisations actuelles'
  },
  // Restrictions
  applies_to: {
    type: DataTypes.ENUM('all', 'specific_products', 'specific_categories'),
    defaultValue: 'all'
    // Note: comment removed due to Sequelize bug with ENUM + comment
  },
  product_ids: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    comment: 'IDs des produits concernés (si applies_to = specific_products)'
  },
  category_ids: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    comment: 'IDs des catégories concernées (si applies_to = specific_categories)'
  },
  excluded_product_ids: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    comment: 'IDs des produits exclus'
  },
  // Période de validité
  valid_from: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de début de validité'
  },
  valid_until: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de fin de validité'
  },
  // Statut
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Coupon actif ou non'
  },
  // Métadonnées
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Créateur du coupon (admin)'
  }
}, {
  tableName: 'coupons',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['code']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['valid_from', 'valid_until']
    },
    {
      fields: ['type']
    }
  ]
});

// Méthode pour vérifier si le coupon est valide
Coupon.prototype.isValid = function(userId = null) {
  const now = new Date();

  // Vérifier si actif
  if (!this.is_active) return { valid: false, reason: 'Coupon inactif' };

  // Vérifier la période de validité
  if (this.valid_from && now < new Date(this.valid_from)) {
    return { valid: false, reason: 'Coupon pas encore valide' };
  }
  if (this.valid_until && now > new Date(this.valid_until)) {
    return { valid: false, reason: 'Coupon expiré' };
  }

  // Vérifier la limite d'utilisation globale
  if (this.usage_limit !== null && this.usage_count >= this.usage_limit) {
    return { valid: false, reason: 'Limite d\'utilisation atteinte' };
  }

  return { valid: true };
};

// Méthode pour calculer la réduction
Coupon.prototype.calculateDiscount = function(subtotal, items = []) {
  // Vérifier le montant minimum
  if (subtotal < this.min_purchase_amount) {
    return {
      discount: 0,
      reason: `Montant minimum requis: ${this.min_purchase_amount}€`
    };
  }

  let discount = 0;

  switch (this.type) {
    case 'percentage':
      discount = (subtotal * this.value) / 100;
      // Appliquer la limite de réduction si définie
      if (this.max_discount_amount && discount > this.max_discount_amount) {
        discount = parseFloat(this.max_discount_amount);
      }
      break;

    case 'fixed_amount':
      discount = Math.min(parseFloat(this.value), subtotal);
      break;

    case 'free_shipping':
      // La réduction sera appliquée sur les frais de port
      discount = 0; // Sera géré dans le calcul de la commande
      break;
  }

  return {
    discount: parseFloat(discount.toFixed(2)),
    type: this.type,
    code: this.code
  };
};

// Méthode pour incrémenter le compteur d'utilisation
Coupon.prototype.incrementUsage = async function() {
  this.usage_count += 1;
  await this.save();
};

// Méthode pour vérifier si applicable aux produits du panier
Coupon.prototype.isApplicableToCart = function(cartItems) {
  if (this.applies_to === 'all') return true;

  // Vérifier si au moins un produit est concerné
  const applicableItems = cartItems.filter(item => {
    // Exclure les produits exclus
    if (this.excluded_product_ids.includes(item.product_id)) {
      return false;
    }

    // Vérifier les produits spécifiques
    if (this.applies_to === 'specific_products') {
      return this.product_ids.includes(item.product_id);
    }

    // Vérifier les catégories (nécessite que l'item ait category_id)
    if (this.applies_to === 'specific_categories' && item.product) {
      return this.category_ids.includes(item.product.category_id);
    }

    return false;
  });

  return applicableItems.length > 0;
};

export default Coupon;
