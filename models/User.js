import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import sequelize from '../config/sequelize.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'editor', 'user'),
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: [['admin', 'manager', 'editor', 'user']]
    }
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  addresses: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
    comment: 'Array of user addresses'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['username']
    },
    {
      fields: ['role']
    }
  ]
});

// Méthodes d'instance
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password; // Ne jamais retourner le mot de passe
  return values;
};

// Méthodes pour vérifier les rôles
User.prototype.isAdmin = function () {
  return this.role === 'admin';
};

User.prototype.isManager = function () {
  return this.role === 'manager';
};

User.prototype.isEditor = function () {
  return this.role === 'editor';
};

User.prototype.hasRole = function (role) {
  return this.role === role;
};

// Méthode pour comparer le mot de passe
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Hook avant création - Hasher le mot de passe
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Hook avant mise à jour - Hasher le mot de passe si modifié
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

export default User;
