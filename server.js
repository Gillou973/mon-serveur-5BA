import dotenv from 'dotenv';
import app from "./app.js";
import { testSequelizeConnection, syncDatabase } from "./config/sequelize.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 3005;

// Démarrage du serveur avec test de connexion Sequelize
app.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);

  // Test de connexion à la base de données avec Sequelize
  const isConnected = await testSequelizeConnection();

  if (isConnected) {
    // Synchroniser les modèles avec la base de données
    // ATTENTION: { alter: true } modifie la structure existante
    // En production, utiliser des migrations plutôt que sync
    await syncDatabase({ alter: true });
  }
});
