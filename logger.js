import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logFile = path.join(logsDir, 'server.log');

// Fonction de logging personnalisée
export const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [INFO] ${message}\n`;

    // Console
    console.log(`ℹ️  ${message}`);

    // Fichier
    fs.appendFileSync(logFile, logMessage);
  },

  error: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [ERROR] ${message}\n`;

    // Console
    console.error(`❌ ${message}`);

    // Fichier
    fs.appendFileSync(logFile, logMessage);
  },

  request: (req, res, next) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [REQUEST] ${req.method} ${req.url} - IP: ${req.ip}\n`;

    // Console
    console.log(`📥 ${req.method} ${req.url}`);

    // Fichier
    fs.appendFileSync(logFile, logMessage);

    next();
  }
};

export default logger;
