import { Op } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Cart from '../models/Cart.js';
import CartItem from '../models/CartItem.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Créer une commande à partir du panier
 */
export const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const {
      items,
      shipping_address,
      billing_address,
      payment_method,
      shipping_cost,
      notes
    } = req.body;

    // Validation de l'adresse de livraison
    if (!shipping_address || !shipping_address.street || !shipping_address.city ||
        !shipping_address.postal_code || !shipping_address.country) {
      throw new AppError('Adresse de livraison incomplète', 400);
    }

    // Vérifier que des articles sont fournis
    if (!items || items.length === 0) {
      throw new AppError('Votre panier est vide', 400);
    }

    // Récupérer les détails de tous les produits
    const productIds = items.map(item => item.product_id);
    const products = await Product.findAll({
      where: {
        id: productIds
      },
      transaction: t
    });

    // Créer un map pour accès rapide aux produits
    const productMap = {};
    products.forEach(p => {
      productMap[p.id] = p;
    });

    // Vérifier la disponibilité de tous les produits et préparer les items
    const orderItems = [];
    for (const item of items) {
      const product = productMap[item.product_id];

      if (!product) {
        throw new AppError(`Produit non trouvé: ${item.product_id}`, 400);
      }

      if (!product.is_active) {
        throw new AppError(`Le produit "${product.name}" n'est plus disponible`, 400);
      }

      if (product.track_inventory && product.quantity < item.quantity) {
        throw new AppError(
          `Stock insuffisant pour "${product.name}". Disponible: ${product.quantity}`,
          400
        );
      }

      orderItems.push({
        product,
        quantity: item.quantity,
        price: parseFloat(product.price)
      });
    }

    // Calculer le sous-total
    const subtotal = orderItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Calculer les frais (à personnaliser selon votre logique)
    const tax = (subtotal * 0.20).toFixed(2); // TVA 20%
    const shipping_cost = subtotal > 50 ? 0 : 5.99; // Livraison gratuite au-dessus de 50€
    const discount = 0; // À implémenter selon votre logique de promotions

    const total = (parseFloat(subtotal) + parseFloat(tax) + parseFloat(shipping_cost) - parseFloat(discount)).toFixed(2);

    // Créer la commande
    const order = await Order.create({
      user_id: userId,
      subtotal,
      tax,
      shipping_cost,
      discount,
      total,
      shipping_address,
      billing_address: billing_address || shipping_address,
      payment_method,
      notes,
      status: 'pending',
      payment_status: 'pending'
    }, { transaction: t });

    // Créer les articles de commande et déduire le stock
    for (const item of cart.items) {
      await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        product_sku: item.product.sku,
        quantity: item.quantity,
        price: item.price
      }, { transaction: t });

      // Déduire le stock si le suivi est activé
      if (item.product.track_inventory) {
        await item.product.update({
          quantity: item.product.quantity - item.quantity
        }, { transaction: t });
      }
    }

    // Marquer le panier comme converti
    await cart.update({ status: 'converted' }, { transaction: t });

    // Supprimer les articles du panier
    await CartItem.destroy({
      where: { cart_id: cart.id },
      transaction: t
    });

    await t.commit();

    // Recharger la commande avec les relations
    await order.reload({
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'slug', 'images']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: order
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Récupérer les commandes de l'utilisateur connecté
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      status,
      payment_status,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { user_id: userId };

    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'slug', 'images']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: orders,
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

/**
 * Récupérer une commande par ID (utilisateur)
 */
export const getMyOrderById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({
      where: {
        id,
        user_id: userId
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'slug', 'images', 'price']
            }
          ]
        }
      ]
    });

    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Récupérer toutes les commandes
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const {
      status,
      payment_status,
      user_id,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (user_id) where.user_id = user_id;

    const allowedSortFields = ['created_at', 'total', 'status', 'order_number'];
    const orderField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const orderDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'first_name', 'last_name']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'slug', 'images']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [[orderField, orderDirection]]
    });

    res.json({
      success: true,
      data: orders,
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

/**
 * Admin: Récupérer une commande par ID
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'phone']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'slug', 'images', 'sku', 'price']
            }
          ]
        }
      ]
    });

    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Mettre à jour le statut d'une commande
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Statut invalide', 400);
    }

    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    const updateData = { status };

    // Mettre à jour les dates automatiquement
    if (status === 'shipped' && !order.shipped_at) {
      updateData.shipped_at = new Date();
      if (tracking_number) {
        updateData.tracking_number = tracking_number;
      }
    }

    if (status === 'delivered' && !order.delivered_at) {
      updateData.delivered_at = new Date();
      if (!order.shipped_at) {
        updateData.shipped_at = new Date();
      }
    }

    await order.update(updateData);

    await order.reload({
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Statut de commande mis à jour',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Mettre à jour le statut de paiement
 */
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(payment_status)) {
      throw new AppError('Statut de paiement invalide', 400);
    }

    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    await order.update({ payment_status });

    res.json({
      success: true,
      message: 'Statut de paiement mis à jour',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Annuler une commande (utilisateur - seulement si pending)
 */
export const cancelMyOrder = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({
      where: {
        id,
        user_id: userId
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        }
      ],
      transaction: t
    });

    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    if (order.status !== 'pending') {
      throw new AppError('Seules les commandes en attente peuvent être annulées', 400);
    }

    // Restaurer le stock
    for (const item of order.items) {
      if (item.product && item.product.track_inventory) {
        await item.product.update({
          quantity: item.product.quantity + item.quantity
        }, { transaction: t });
      }
    }

    // Mettre à jour le statut de la commande
    await order.update({
      status: 'cancelled',
      payment_status: order.payment_status === 'paid' ? 'refunded' : 'failed'
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: 'Commande annulée avec succès',
      data: order
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Obtenir les statistiques des commandes (Admin)
 */
export const getOrderStats = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const where = {};

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const [totalOrders, totalRevenue, ordersByStatus, recentOrders] = await Promise.all([
      Order.count({ where }),
      Order.sum('total', { where: { ...where, payment_status: 'paid' } }),
      Order.findAll({
        where,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      }),
      Order.findAll({
        where,
        limit: 10,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'order_number', 'total', 'status', 'created_at']
      })
    ]);

    res.json({
      success: true,
      data: {
        total_orders: totalOrders,
        total_revenue: totalRevenue || 0,
        orders_by_status: ordersByStatus,
        recent_orders: recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};
