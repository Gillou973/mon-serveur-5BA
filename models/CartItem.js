import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cart_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'carts',
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
    comment: 'Si le produit a des variantes, référence la variante choisie'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Prix au moment de l\'ajout au panier'
  }
}, {
  tableName: 'cart_items',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['cart_id']
    },
    {
      fields: ['product_id']
    },
    {
      fields: ['variant_id']
    },
    {
      // Un produit (ou variante) ne peut être qu'une seule fois dans un panier
      unique: true,
      fields: ['cart_id', 'product_id', 'variant_id']
    }
  ]
});

// Méthode pour calculer le sous-total
CartItem.prototype.getSubtotal = function () {
  return parseFloat(this.price) * this.quantity;
};

export default CartItem;
