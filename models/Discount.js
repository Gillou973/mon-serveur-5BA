import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Discount = sequelize.define('Discount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nom de la réduction (ex: Soldes d\'été 2024)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description de la réduction'
  },
  // Type de réduction
  type: {
    type: DataTypes.ENUM('percentage', 'fixed_amount'),
    allowNull: false,
    defaultValue: 'percentage'
    // Note: comment removed due to Sequelize bug with ENUM + comment
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Valeur de la réduction (pourcentage ou montant)'
  },
  // Application
  applies_to: {
    type: DataTypes.ENUM('all', 'category', 'product', 'product_variant'),
    allowNull: false,
    defaultValue: 'all'
    // Note: comment removed due to Sequelize bug with ENUM + comment
  },
  target_ids: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    comment: 'IDs des cibles (produits, catégories, variantes)'
  },
  excluded_ids: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    comment: 'IDs exclus de la réduction'
  },
  // Conditions
  min_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Quantité minimum requise'
  },
  max_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Montant maximum de réduction'
  },
  // Priorité et cumul
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Priorité d\'application (plus élevé = prioritaire)'
  },
  stackable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Peut se cumuler avec d\'autres réductions'
  },
  stackable_with_coupons: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Peut se cumuler avec des coupons'
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
    comment: 'Réduction active ou non'
  },
  // Affichage
  badge_text: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Texte du badge à afficher (ex: -20%, SOLDES)'
  },
  badge_color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    comment: 'Couleur du badge (hex)'
  },
  // Métadonnées
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Créateur de la réduction (admin)'
  }
}, {
  tableName: 'discounts',
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
      fields: ['applies_to']
    },
    {
      fields: ['priority']
    }
  ]
});

// Méthode pour vérifier si la réduction est valide
Discount.prototype.isValid = function() {
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

  return true;
};

// Méthode pour vérifier si applicable à un produit/variante
Discount.prototype.isApplicableTo = function(itemId, itemType = 'product') {
  // Si s'applique à tout
  if (this.applies_to === 'all') return true;

  // Vérifier si l'item est exclu
  if (this.excluded_ids.includes(itemId)) return false;

  // Vérifier si l'item est dans les cibles
  if (this.applies_to === itemType) {
    return this.target_ids.includes(itemId);
  }

  return false;
};

// Méthode pour calculer la réduction sur un prix
Discount.prototype.calculateDiscount = function(price, quantity = 1) {
  // Vérifier la quantité minimum
  if (quantity < this.min_quantity) {
    return 0;
  }

  let discount = 0;
  const totalPrice = price * quantity;

  switch (this.type) {
    case 'percentage':
      discount = (totalPrice * this.value) / 100;
      // Appliquer la limite de réduction si définie
      if (this.max_discount_amount && discount > this.max_discount_amount) {
        discount = parseFloat(this.max_discount_amount);
      }
      break;

    case 'fixed_amount':
      discount = Math.min(parseFloat(this.value), totalPrice);
      break;
  }

  return parseFloat(discount.toFixed(2));
};

// Méthode pour obtenir les réductions actives
Discount.getActiveDiscounts = async function(options = {}) {
  const { applies_to, target_id } = options;

  const where = {
    is_active: true
  };

  // Vérifier la période de validité
  const now = new Date();
  where[sequelize.Sequelize.Op.or] = [
    { valid_from: null },
    { valid_from: { [sequelize.Sequelize.Op.lte]: now } }
  ];
  where[sequelize.Sequelize.Op.and] = [
    {
      [sequelize.Sequelize.Op.or]: [
        { valid_until: null },
        { valid_until: { [sequelize.Sequelize.Op.gte]: now } }
      ]
    }
  ];

  if (applies_to) {
    where[sequelize.Sequelize.Op.or] = [
      { applies_to: 'all' },
      { applies_to }
    ];
  }

  const discounts = await Discount.findAll({
    where,
    order: [['priority', 'DESC'], ['created_at', 'ASC']]
  });

  // Filtrer par target_id si fourni
  if (target_id) {
    return discounts.filter(discount => {
      return discount.applies_to === 'all' ||
             discount.target_ids.includes(target_id) &&
             !discount.excluded_ids.includes(target_id);
    });
  }

  return discounts;
};

export default Discount;
