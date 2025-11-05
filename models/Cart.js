import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
    type: DataTypes.ENUM('active', 'abandoned', 'converted'),
    defaultValue: 'active'
  },
  coupon_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Code du coupon appliqué au panier'
  },
  applied_promotions: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Promotions appliquées au panier'
    // Format: { coupon: {...}, discounts: [...], bundles: [...] }
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'carts',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    }
  ]
});

// Méthode pour calculer le total du panier
Cart.prototype.calculateTotal = async function () {
  const CartItem = sequelize.models.CartItem;
  const items = await CartItem.findAll({ where: { cart_id: this.id } });

  return items.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.quantity);
  }, 0);
};

// Méthode pour obtenir le nombre d'articles
Cart.prototype.getItemsCount = async function () {
  const CartItem = sequelize.models.CartItem;
  const items = await CartItem.findAll({ where: { cart_id: this.id } });

  return items.reduce((count, item) => count + item.quantity, 0);
};

export default Cart;
