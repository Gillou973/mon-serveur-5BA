import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Configuration du pool de connexions PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Nombre maximum de clients dans le pool
  idleTimeoutMillis: 30000, // Temps d'inactivité avant fermeture
  connectionTimeoutMillis: 2000, // Temps d'attente max pour obtenir une connexion
});

// Gestion des erreurs du pool
pool.on('error', (err, client) => {
  console.error('Erreur inattendue du client PostgreSQL:', err);
});

// Fonction pour tester la connexion
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Connexion à PostgreSQL réussie:', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('❌ Erreur de connexion à PostgreSQL:', err.message);
    return false;
  }
};

// Fonction helper pour exécuter des requêtes
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Requête exécutée:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Erreur lors de la requête:', error);
    throw error;
  }
};

// Export du pool pour usage avancé
export default pool;
