import { config } from 'dotenv';
config();

import sequelize from '../config/sequelize.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import bcrypt from 'bcrypt';

async function seedData() {
  try {
    console.log('Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connecté\n');

    // Vérifier si un admin existe
    console.log('Vérification de l\'utilisateur admin...');
    let admin = await User.findOne({ where: { email: 'admin@example.com' } });

    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        is_active: true
      });
      console.log(`✅ Admin créé: ${admin.email}\n`);
    } else {
      console.log(`ℹ️  Admin existe déjà: ${admin.email}\n`);
    }

    // Créer des catégories
    console.log('Création des catégories...');
    const categories = await Category.bulkCreate([
      {
        name: 'Électronique',
        slug: 'electronique',
        description: 'Produits électroniques et high-tech',
        is_active: true,
        sort_order: 1
      },
      {
        name: 'Vêtements',
        slug: 'vetements',
        description: 'Mode et accessoires',
        is_active: true,
        sort_order: 2
      },
      {
        name: 'Maison',
        slug: 'maison',
        description: 'Articles pour la maison',
        is_active: true,
        sort_order: 3
      }
    ]);
    console.log(`✅ ${categories.length} catégories créées\n`);

    // Créer des produits
    console.log('Création des produits...');
    const products = await Product.bulkCreate([
      {
        name: 'Smartphone XYZ',
        slug: 'smartphone-xyz',
        description: 'Un excellent smartphone avec toutes les dernières fonctionnalités',
        short_description: 'Smartphone dernière génération',
        price: 599.99,
        compare_price: 799.99,
        sku: 'SMART-001',
        quantity: 50,
        category_id: categories[0].id,
        is_active: true,
        is_featured: true,
        images: []
      },
      {
        name: 'Ordinateur Portable ABC',
        slug: 'ordinateur-portable-abc',
        description: 'Ordinateur portable performant pour le travail et les loisirs',
        short_description: 'PC portable haute performance',
        price: 1299.99,
        compare_price: 1499.99,
        sku: 'LAPTOP-001',
        quantity: 25,
        category_id: categories[0].id,
        is_active: true,
        is_featured: true,
        images: []
      },
      {
        name: 'T-Shirt Premium',
        slug: 't-shirt-premium',
        description: 'T-shirt en coton de qualité supérieure',
        short_description: 'T-shirt confortable et stylé',
        price: 29.99,
        sku: 'TSHIRT-001',
        quantity: 100,
        category_id: categories[1].id,
        is_active: true,
        images: []
      },
      {
        name: 'Jean Slim Fit',
        slug: 'jean-slim-fit',
        description: 'Jean moderne avec coupe slim',
        short_description: 'Jean tendance',
        price: 79.99,
        sku: 'JEAN-001',
        quantity: 75,
        category_id: categories[1].id,
        is_active: true,
        images: []
      },
      {
        name: 'Lampe de Bureau LED',
        slug: 'lampe-bureau-led',
        description: 'Lampe LED ajustable pour votre bureau',
        short_description: 'Éclairage de bureau moderne',
        price: 49.99,
        sku: 'LAMP-001',
        quantity: 40,
        category_id: categories[2].id,
        is_active: true,
        images: []
      }
    ]);
    console.log(`✅ ${products.length} produits créés\n`);

    console.log('✅ Données de test créées avec succès!\n');
    console.log('Informations de connexion admin:');
    console.log('Email: admin@example.com');
    console.log('Mot de passe: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

seedData();
