import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Bundle = sequelize.define('Bundle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nom du bundle (ex: Pack été, Offre 3+1)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description de l\'offre'
  },
  // Type de bundle
  type: {
    type: DataTypes.ENUM('buy_x_get_y', 'bundle_price', 'bundle_percentage'),
    allowNull: false
    // Note: comment removed due to Sequelize bug with ENUM + comment
  },
  // Configuration du bundle
  product_ids: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: false,
    defaultValue: [],
    comment: 'IDs des produits du bundle'
  },
  // Pour buy_x_get_y
  required_quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Quantité requise pour buy_x_get_y (ex: acheter 3)'
  },
  free_quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Quantité offerte pour buy_x_get_y (ex: obtenir 1 gratuit)'
  },
  free_product_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Produit offert (peut être différent ou identique)'
  },
  // Pour bundle_price
  bundle_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Prix fixe du bundle'
  },
  // Pour bundle_percentage
  discount_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Pourcentage de réduction sur le bundle'
  },
  // Conditions
  min_items_required: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Nombre minimum d\'articles requis'
  },
  max_redemptions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Nombre maximum de fois qu\'on peut profiter du bundle'
  },
  max_redemptions_per_user: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Nombre max de fois par utilisateur'
  },
  current_redemptions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Nombre de fois utilisé'
  },
  // Application
  auto_apply: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Appliqué automatiquement si conditions remplies'
  },
  requires_all_products: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Nécessite tous les produits ou juste certains'
  },
  // Priorité
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Priorité d\'application'
  },
  stackable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Peut se cumuler avec d\'autres offres'
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
    comment: 'Bundle actif ou non'
  },
  // Affichage
  badge_text: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Texte du badge (ex: 3+1 GRATUIT, -30% sur le lot)'
  },
  display_on_product_page: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Afficher sur la page produit'
  },
  // Métadonnées
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Créateur du bundle (admin)'
  }
}, {
  tableName: 'bundles',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['is_active']
    },
    {
      fields: ['valid_from', 'valid_until']
    },
    {
      fields: ['type']
    },
    {
      fields: ['priority']
    }
  ]
});

// Méthode pour vérifier si le bundle est valide
Bundle.prototype.isValid = function() {
  const now = new Date();

  // Vérifier si actif
  if (!this.is_active) return false;

  // Vérifier la période de validité
  if (this.valid_from && now < new Date(this.valid_from)) {
    return false;
  }
  if (this.valid_until && now > new Date(this.valid_until)) {
    return false;
  }

  // Vérifier les limites d'utilisation
  if (this.max_redemptions && this.current_redemptions >= this.max_redemptions) {
    return false;
  }

  return true;
};

// Méthode pour vérifier si applicable au panier
Bundle.prototype.isApplicableToCart = function(cartItems) {
  if (!this.isValid()) return false;

  const cartProductIds = cartItems.map(item => item.product_id);

  if (this.requires_all_products) {
    // Tous les produits du bundle doivent être dans le panier
    return this.product_ids.every(productId => cartProductIds.includes(productId));
  } else {
    // Au moins un produit du bundle doit être dans le panier
    return this.product_ids.some(productId => cartProductIds.includes(productId));
  }
};

// Méthode pour calculer la réduction du bundle
Bundle.prototype.calculateBundleDiscount = function(cartItems) {
  if (!this.isApplicableToCart(cartItems)) {
    return { discount: 0, applied: false };
  }

  const bundleItems = cartItems.filter(item =>
    this.product_ids.includes(item.product_id)
  );

  let discount = 0;
  let totalBundlePrice = 0;

  switch (this.type) {
    case 'buy_x_get_y': {
      // Calculer combien de fois on peut appliquer l'offre
      const totalQuantity = bundleItems.reduce((sum, item) => sum + item.quantity, 0);
      const timesApplicable = Math.floor(totalQuantity / this.required_quantity);

      if (timesApplicable > 0) {
        // Trouver le produit le moins cher pour l'offrir
        const sortedItems = bundleItems.sort((a, b) => a.price - b.price);
        const cheapestPrice = sortedItems[0].price;
        discount = cheapestPrice * this.free_quantity * timesApplicable;
      }
      break;
    }

    case 'bundle_price': {
      // Calculer le prix total sans bundle
      totalBundlePrice = bundleItems.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0
      );
      // Réduction = prix normal - prix bundle
      const bundleValue = parseFloat(this.bundle_price);
      discount = Math.max(0, totalBundlePrice - bundleValue);
      break;
    }

    case 'bundle_percentage': {
      // Appliquer un pourcentage de réduction
      totalBundlePrice = bundleItems.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0
      );
      discount = (totalBundlePrice * this.discount_percentage) / 100;
      break;
    }
  }

  return {
    discount: parseFloat(discount.toFixed(2)),
    applied: discount > 0,
    bundleName: this.name,
    bundleType: this.type
  };
};

// Méthode pour incrémenter le compteur d'utilisation
Bundle.prototype.incrementRedemption = async function() {
  this.current_redemptions += 1;
  await this.save();
};

// Méthode pour obtenir les bundles actifs
Bundle.getActiveBundles = async function() {
  const now = new Date();

  return await Bundle.findAll({
    where: {
      is_active: true,
      [sequelize.Sequelize.Op.or]: [
        { valid_from: null },
        { valid_from: { [sequelize.Sequelize.Op.lte]: now } }
      ],
      [sequelize.Sequelize.Op.and]: [
        {
          [sequelize.Sequelize.Op.or]: [
            { valid_until: null },
            { valid_until: { [sequelize.Sequelize.Op.gte]: now } }
          ]
        }
      ]
    },
    order: [['priority', 'DESC'], ['created_at', 'ASC']]
  });
};

export default Bundle;
