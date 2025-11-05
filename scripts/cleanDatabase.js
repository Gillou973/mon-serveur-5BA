import sequelize from '../config/sequelize.js';

async function cleanDatabase() {
  try {
    console.log('Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connecté');

    console.log('Suppression complète des tables et types...');

    // Supprimer toutes les tables e-commerce (respecter l'ordre des clés étrangères)
    await sequelize.query('DROP TABLE IF EXISTS order_items CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS orders CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS cart_items CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS carts CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS bundles CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS discounts CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS coupons CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS product_variants CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS products CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS categories CASCADE;');

    // Supprimer les types ENUM qui pourraient avoir été créés
    await sequelize.query('DROP TYPE IF EXISTS enum_orders_status CASCADE;');
    await sequelize.query('DROP TYPE IF EXISTS enum_orders_payment_status CASCADE;');
    await sequelize.query('DROP TYPE IF EXISTS enum_carts_status CASCADE;');

    // Supprimer les types qui pourraient avoir été mal créés
    await sequelize.query('DROP TYPE IF EXISTS categories CASCADE;');
    await sequelize.query('DROP TYPE IF EXISTS products CASCADE;');

    console.log('✅ Base de données nettoyée avec succès');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

cleanDatabase();
