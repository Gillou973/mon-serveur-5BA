import { Op } from 'sequelize';
import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Product from '../models/Product.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Récupérer le panier actif de l'utilisateur
 */
export const getMyCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let cart = await Cart.findOne({
      where: {
        user_id: userId,
        status: 'active'
      },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'slug', 'price', 'images', 'is_active', 'quantity', 'track_inventory']
            }
          ]
        }
      ]
    });

    // Créer un panier s'il n'existe pas
    if (!cart) {
      cart = await Cart.create({
        user_id: userId,
        status: 'active'
      });
      cart.dataValues.items = [];
    }

    // Calculer le total
    const total = await cart.calculateTotal();
    const itemsCount = await cart.getItemsCount();

    res.json({
      success: true,
      data: {
        ...cart.toJSON(),
        total,
        items_count: itemsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ajouter un produit au panier
 */
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1 } = req.body;

    if (quantity < 1) {
      throw new AppError('La quantité doit être au moins 1', 400);
    }

    // Vérifier que le produit existe et est disponible
    const product = await Product.findByPk(product_id);
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    if (!product.is_active) {
      throw new AppError('Ce produit n\'est plus disponible', 400);
    }

    // Vérifier le stock
    if (!product.isAvailable(quantity)) {
      throw new AppError(
        `Stock insuffisant. Disponible: ${product.quantity}`,
        400
      );
    }

    // Trouver ou créer le panier actif
    let cart = await Cart.findOne({
      where: {
        user_id: userId,
        status: 'active'
      }
    });

    if (!cart) {
      cart = await Cart.create({
        user_id: userId,
        status: 'active'
      });
    }

    // Vérifier si le produit est déjà dans le panier
    let cartItem = await CartItem.findOne({
      where: {
        cart_id: cart.id,
        product_id
      }
    });

    if (cartItem) {
      // Mettre à jour la quantité
      const newQuantity = cartItem.quantity + quantity;

      // Vérifier le stock pour la nouvelle quantité
      if (!product.isAvailable(newQuantity)) {
        throw new AppError(
          `Stock insuffisant. Disponible: ${product.quantity}, dans le panier: ${cartItem.quantity}`,
          400
        );
      }

      await cartItem.update({
        quantity: newQuantity,
        price: product.price // Mettre à jour le prix si changé
      });
    } else {
      // Créer un nouvel article
      cartItem = await CartItem.create({
        cart_id: cart.id,
        product_id,
        quantity,
        price: product.price
      });
    }

    // Recharger le panier complet
    await cart.reload({
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'slug', 'price', 'images', 'is_active']
            }
          ]
        }
      ]
    });

    const total = await cart.calculateTotal();
    const itemsCount = await cart.getItemsCount();

    res.json({
      success: true,
      message: 'Produit ajouté au panier',
      data: {
        ...cart.toJSON(),
        total,
        items_count: itemsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour la quantité d'un article du panier
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      throw new AppError('La quantité doit être au moins 1', 400);
    }

    // Trouver l'article du panier
    const cartItem = await CartItem.findByPk(itemId, {
      include: [
        {
          model: Cart,
          as: 'cart',
          where: {
            user_id: userId,
            status: 'active'
          }
        },
        {
          model: Product,
          as: 'product'
        }
      ]
    });

    if (!cartItem) {
      throw new AppError('Article non trouvé dans votre panier', 404);
    }

    // Vérifier le stock
    if (!cartItem.product.isAvailable(quantity)) {
      throw new AppError(
        `Stock insuffisant. Disponible: ${cartItem.product.quantity}`,
        400
      );
    }

    // Mettre à jour la quantité et le prix
    await cartItem.update({
      quantity,
      price: cartItem.product.price // Mettre à jour le prix si changé
    });

    // Recharger le panier complet
    const cart = await Cart.findOne({
      where: {
        user_id: userId,
        status: 'active'
      },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'slug', 'price', 'images', 'is_active']
            }
          ]
        }
      ]
    });

    const total = await cart.calculateTotal();
    const itemsCount = await cart.getItemsCount();

    res.json({
      success: true,
      message: 'Panier mis à jour',
      data: {
        ...cart.toJSON(),
        total,
        items_count: itemsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retirer un article du panier
 */
export const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    // Trouver l'article du panier
    const cartItem = await CartItem.findByPk(itemId, {
      include: [
        {
          model: Cart,
          as: 'cart',
          where: {
            user_id: userId,
            status: 'active'
          }
        }
      ]
    });

    if (!cartItem) {
      throw new AppError('Article non trouvé dans votre panier', 404);
    }

    await cartItem.destroy();

    // Recharger le panier complet
    const cart = await Cart.findOne({
      where: {
        user_id: userId,
        status: 'active'
      },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'slug', 'price', 'images', 'is_active']
            }
          ]
        }
      ]
    });

    const total = await cart.calculateTotal();
    const itemsCount = await cart.getItemsCount();

    res.json({
      success: true,
      message: 'Article retiré du panier',
      data: {
        ...cart.toJSON(),
        total,
        items_count: itemsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vider le panier
 */
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({
      where: {
        user_id: userId,
        status: 'active'
      }
    });

    if (!cart) {
      throw new AppError('Panier non trouvé', 404);
    }

    // Supprimer tous les articles
    await CartItem.destroy({
      where: { cart_id: cart.id }
    });

    // Recharger le panier
    await cart.reload({
      include: [
        {
          model: CartItem,
          as: 'items'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Panier vidé',
      data: {
        ...cart.toJSON(),
        total: 0,
        items_count: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Récupérer tous les paniers (avec filtres)
 */
export const getAllCarts = async (req, res, next) => {
  try {
    const {
      status,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status) where.status = status;

    const { count, rows: carts } = await Cart.findAndCountAll({
      where,
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    // Calculer les totaux pour chaque panier
    const cartsWithTotals = await Promise.all(
      carts.map(async (cart) => {
        const total = await cart.calculateTotal();
        const itemsCount = await cart.getItemsCount();
        return {
          ...cart.toJSON(),
          total,
          items_count: itemsCount
        };
      })
    );

    res.json({
      success: true,
      data: cartsWithTotals,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};
