import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  variant_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'product_variants',
      key: 'id'
    },
    comment: 'Si la commande concerne une variante spécifique'
  },
  variant_details: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Snapshot des détails de la variante au moment de la commande (size, color, etc.)'
    // Format: { size: "M", color: "Rouge", color_hex: "#FF0000", sku: "TSHIRT-R-M" }
  },
  product_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Nom du produit au moment de la commande'
  },
  product_sku: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Prix unitaire au moment de la commande'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Prix total (price * quantity)'
  }
}, {
  tableName: 'order_items',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['product_id']
    },
    {
      fields: ['variant_id']
    }
  ]
});

// Hook pour calculer le total avant validation (s'exécute avant la validation allowNull)
OrderItem.beforeValidate((orderItem) => {
  if (orderItem.price && orderItem.quantity) {
    orderItem.total = (parseFloat(orderItem.price) * orderItem.quantity).toFixed(2);
  }
});

// Hook pour recalculer le total si price ou quantity changent
OrderItem.beforeUpdate((orderItem) => {
  if (orderItem.changed('price') || orderItem.changed('quantity')) {
    orderItem.total = (parseFloat(orderItem.price) * orderItem.quantity).toFixed(2);
  }
});

export default OrderItem;
