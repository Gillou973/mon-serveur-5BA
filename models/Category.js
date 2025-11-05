import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  slug: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      is: /^[a-z0-9-]+$/ // Slug format: lowercase, numbers, hyphens
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['slug']
    },
    {
      fields: ['parent_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['sort_order']
    }
  ]
});

// Les associations sont définies dans models/index.js

export default Category;
