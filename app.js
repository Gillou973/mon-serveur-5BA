// app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { query } from "./db.js";
import { logger } from "./logger.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import variantRoutes from "./routes/variantRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import discountRoutes from "./routes/discountRoutes.js";
import bundleRoutes from "./routes/bundleRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";


const app = express();

// Configuration CORS
app.use(cors({
  origin: '*', // Autorise toutes les origines (modifiez selon vos besoins)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static('public')); // Racine pour le frontend client
app.use('/test', express.static('public')); // Préfixe /test pour compatibilité admin
app.use('/uploads', express.static('uploads'));

// Middleware de logging HTTP avec Morgan
// Format 'dev': :method :url :status :response-time ms - :res[content-length]
app.use(morgan('dev'));

// Middleware de logging personnalisé (console + fichier)
app.use(logger.request);

// ============================================
// ROUTES API
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', variantRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/upload', uploadRoutes);

// Route principale (commentée pour servir index.html à la racine)
// app.get('/', (req, res) => {
//   res.json({
//     message: 'Bienvenue sur le serveur Express! Routes get, post, en test !✨',
//     status: 'OK'
//   });
// });

// Route de test
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World! ✨✨✨' });
});

// Route avec paramètre
app.get('/api/hello/:name', (req, res) => {
  const { name } = req.params;
  res.json({ message: `Bonjour ${name}!` });
});

// Route POST exemple
app.post('/api/data', (req, res) => {
  const data = req.body;
  res.json({
    message: 'Données reçues',
    received: data
  });
});

// Route de test de connexion DB
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    res.json({
      success: true,
      message: 'Connexion à PostgreSQL réussie',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur de connexion à la base de données',
      error: error.message
    });
  }
});

// Route pour récupérer toutes les tables de la DB
app.get('/api/db-tables', async (req, res) => {
  try {
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    res.json({
      success: true,
      message: 'Liste des tables récupérée',
      tables: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tables',
      error: error.message
    });
  }
});

// ============================================
// GESTION DES ERREURS
// ============================================
// Route 404 - À placer avant le errorHandler
app.use(notFoundHandler);

// Middleware de gestion centralisée des erreurs
app.use(errorHandler);

export default app;
