import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    defaultValue: () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `ORD-${timestamp}-${random}`;
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ),
    defaultValue: 'pending'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  shipping_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Montant total des réductions appliquées'
  },
  coupon_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Code du coupon appliqué'
  },
  applied_promotions: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Détails de toutes les promotions appliquées'
    // Format: { coupons: [...], discounts: [...], bundles: [...] }
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shipping_address: {
    type: DataTypes.JSONB,
    allowNull: false
    // Format: { street, city, state, postal_code, country, phone }
  },
  billing_address: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['order_number']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_status']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Les numéros de commande sont générés automatiquement via defaultValue

// Méthode pour calculer le total
Order.prototype.calculateTotal = function () {
  const subtotal = parseFloat(this.subtotal);
  const tax = parseFloat(this.tax || 0);
  const shipping = parseFloat(this.shipping_cost || 0);
  const discount = parseFloat(this.discount || 0);

  return (subtotal + tax + shipping - discount).toFixed(2);
};

export default Order;
