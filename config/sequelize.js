import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import databaseConfig from './database.js';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const config = databaseConfig[env];

// Initialisation de Sequelize
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    define: {
      timestamps: true, // Active createdAt et updatedAt par défaut
      underscored: true, // Utilise snake_case pour les noms de colonnes
      freezeTableName: true // Empêche Sequelize de pluraliser les noms de tables
    }
  }
);

// Test de connexion
export const testSequelizeConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion Sequelize à PostgreSQL réussie');
    return true;
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données:', error.message);
    return false;
  }
};

// Fonction pour synchroniser tous les modèles
export const syncDatabase = async (options = {}) => {
  try {
    // Importer tous les modèles pour s'assurer qu'ils sont enregistrés
    await import('../models/User.js');
    await import('../models/Category.js');
    await import('../models/Product.js');
    await import('../models/ProductVariant.js');
    await import('../models/Cart.js');
    await import('../models/CartItem.js');
    await import('../models/Order.js');
    await import('../models/OrderItem.js');
    await import('../models/Coupon.js');
    await import('../models/Discount.js');
    await import('../models/Bundle.js');
    await import('../models/index.js'); // Importer les relations

    await sequelize.sync(options);
    console.log('✅ Synchronisation des modèles réussie 🛜');
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    throw error;
  }
};

export default sequelize;
