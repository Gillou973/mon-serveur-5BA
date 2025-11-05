import sequelize from '../config/sequelize.js';

async function dropTables() {
  try {
    console.log('Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connecté');

    console.log('Suppression des tables e-commerce...');

    // Supprimer les tables dans le bon ordre (en respectant les clés étrangères)
    await sequelize.query('DROP TABLE IF EXISTS order_items CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS orders CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS cart_items CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS carts CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS products CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS categories CASCADE;');

    console.log('✅ Tables e-commerce supprimées avec succès');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

dropTables();
