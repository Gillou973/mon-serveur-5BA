import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200]
    }
  },
  slug: {
    type: DataTypes.STRING(220),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      is: /^[a-z0-9-]+$/
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  short_description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  compare_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  barcode: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  track_inventory: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  has_variants: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si true, le produit a des variantes (taille, couleur) et le stock/prix sont dans les variantes'
  },
  images: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
    // Format: [{ url: "...", alt: "...", position: 1 }, ...]
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Weight in kg'
  },
  dimensions: {
    type: DataTypes.JSONB,
    allowNull: true
    // Format: { length: 10, width: 5, height: 3, unit: "cm" }
  },
  meta_title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['slug']
    },
    {
      unique: true,
      fields: ['sku'],
      where: {
        sku: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      fields: ['category_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['price']
    }
  ]
});

// Méthodes d'instance
Product.prototype.toJSON = function () {
  const values = { ...this.get() };
  return values;
};

// Méthode pour vérifier la disponibilité
Product.prototype.isAvailable = function (requestedQuantity = 1) {
  if (!this.is_active) return false;
  if (!this.track_inventory) return true;
  return this.quantity >= requestedQuantity;
};

// Méthode pour calculer le prix avec réduction
Product.prototype.getDiscountPercentage = function () {
  if (!this.compare_price || this.compare_price <= this.price) return 0;
  return Math.round(((this.compare_price - this.price) / this.compare_price) * 100);
};

export default Product;
