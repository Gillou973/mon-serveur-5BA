import sequelize from '../config/sequelize.js';
import User from './User.js';
import Category from './Category.js';
import Product from './Product.js';
import ProductVariant from './ProductVariant.js';
import Cart from './Cart.js';
import CartItem from './CartItem.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import Coupon from './Coupon.js';
import Discount from './Discount.js';
import Bundle from './Bundle.js';

// Importer tous les modèles
const models = {
  User,
  Category,
  Product,
  ProductVariant,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Coupon,
  Discount,
  Bundle
};

// ============================================
// DÉFINIR LES ASSOCIATIONS ENTRE MODÈLES
// ============================================

// Category - Category (Self-referential for subcategories)
Category.hasMany(Category, {
  as: 'subcategories',
  foreignKey: 'parent_id'
});

Category.belongsTo(Category, {
  as: 'parent',
  foreignKey: 'parent_id'
});

// Product - Category (Many-to-One)
Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

Category.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products'
});

// ProductVariant - Product (Many-to-One)
ProductVariant.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

Product.hasMany(ProductVariant, {
  foreignKey: 'product_id',
  as: 'variants'
});

// Cart - User (One-to-One ou One-to-Many)
Cart.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(Cart, {
  foreignKey: 'user_id',
  as: 'carts'
});

// CartItem - Cart (Many-to-One)
CartItem.belongsTo(Cart, {
  foreignKey: 'cart_id',
  as: 'cart'
});

Cart.hasMany(CartItem, {
  foreignKey: 'cart_id',
  as: 'items'
});

// CartItem - Product (Many-to-One)
CartItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

Product.hasMany(CartItem, {
  foreignKey: 'product_id',
  as: 'cartItems'
});

// CartItem - ProductVariant (Many-to-One, optionnel)
CartItem.belongsTo(ProductVariant, {
  foreignKey: 'variant_id',
  as: 'variant'
});

ProductVariant.hasMany(CartItem, {
  foreignKey: 'variant_id',
  as: 'cartItems'
});

// Order - User (Many-to-One)
Order.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'orders'
});

// OrderItem - Order (Many-to-One)
OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items'
});

// OrderItem - Product (Many-to-One)
OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  as: 'orderItems'
});

// OrderItem - ProductVariant (Many-to-One, optionnel)
OrderItem.belongsTo(ProductVariant, {
  foreignKey: 'variant_id',
  as: 'variant'
});

ProductVariant.hasMany(OrderItem, {
  foreignKey: 'variant_id',
  as: 'orderItems'
});

// Coupon - User (Many-to-One, créateur)
Coupon.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

User.hasMany(Coupon, {
  foreignKey: 'created_by',
  as: 'createdCoupons'
});

// Discount - User (Many-to-One, créateur)
Discount.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

User.hasMany(Discount, {
  foreignKey: 'created_by',
  as: 'createdDiscounts'
});

// Bundle - User (Many-to-One, créateur)
Bundle.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

User.hasMany(Bundle, {
  foreignKey: 'created_by',
  as: 'createdBundles'
});

export { sequelize };
export default models;
