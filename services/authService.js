import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Service d'authentification
 * Contient toute la logique métier liée à l'authentification
 */

/**
 * Génère un token JWT pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {string} Token JWT
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '3d' }
  );
};

/**
 * Vérifie et décode un token JWT
 * @param {string} token - Token JWT à vérifier
 * @returns {object} Payload décodé
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expiré', 401);
    }
    throw new AppError('Token invalide', 401);
  }
};

/**
 * Inscrit un nouvel utilisateur
 * @param {object} userData - Données de l'utilisateur
 * @returns {object} { user, token }
 */
export const registerUser = async (userData) => {
  const { username, email, password, role, first_name, last_name } = userData;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }]
    }
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'username';
    throw new AppError(
      field === 'email'
        ? 'Cet email est déjà utilisé.'
        : 'Ce nom d\'utilisateur est déjà pris.',
      409
    );
  }

  // Créer l'utilisateur (le mot de passe sera hashé automatiquement par le hook)
  const user = await User.create({
    username,
    email,
    password,
    role: role || 'user',
    first_name,
    last_name
  });

  // Générer le token
  const token = generateToken(user.id);

  return { user, token };
};

/**
 * Connecte un utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {object} { user, token }
 */
export const loginUser = async (email, password) => {
  // Validation simple
  if (!email || !password) {
    throw new AppError('Email et mot de passe requis.', 400);
  }

  // Trouver l'utilisateur par email
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new AppError('Email ou mot de passe incorrect.', 401);
  }

  // Vérifier si le compte est actif
  if (!user.is_active) {
    throw new AppError('Votre compte est désactivé. Contactez l\'administrateur.', 403);
  }

  // Vérifier le mot de passe
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError('Email ou mot de passe incorrect.', 401);
  }

  // Mettre à jour la date de dernière connexion
  await user.update({ last_login: new Date() });

  // Générer le token
  const token = generateToken(user.id);

  return { user, token };
};

/**
 * Change le mot de passe d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} currentPassword - Mot de passe actuel
 * @param {string} newPassword - Nouveau mot de passe
 */
export const updatePassword = async (userId, currentPassword, newPassword) => {
  // Validation
  if (!currentPassword || !newPassword) {
    throw new AppError('Mot de passe actuel et nouveau mot de passe requis.', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('Le nouveau mot de passe doit contenir au moins 6 caractères.', 400);
  }

  // Récupérer l'utilisateur complet
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError('Utilisateur non trouvé.', 404);
  }

  // Vérifier le mot de passe actuel
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new AppError('Mot de passe actuel incorrect.', 401);
  }

  // Mettre à jour le mot de passe (sera hashé par le hook)
  await user.update({ password: newPassword });

  return user;
};

/**
 * Récupère un utilisateur par ID
 * @param {string} userId - ID de l'utilisateur
 * @returns {object} Utilisateur
 */
export const getUserById = async (userId) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError('Utilisateur non trouvé.', 404);
  }

  return user;
};
