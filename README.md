# 🛒 API E-commerce Node.js + Express + PostgreSQL

Une API REST complète pour un système e-commerce avec gestion des utilisateurs, produits, variantes, panier et commandes.

## 🚀 Fonctionnalités

### ✅ Implémenté

- **Authentification & Autorisation**
  - Inscription et connexion (JWT)
  - Gestion des rôles (admin, manager, editor, user)
  - Middleware de protection des routes

- **Gestion des utilisateurs**
  - CRUD complet
  - Rôles et permissions
  - Profils utilisateurs

- **Catégories**
  - Hiérarchie parent/enfant
  - Slug automatique
  - Images et descriptions
  - Tri personnalisé

- **Produits**
  - CRUD complet
  - Support des variantes (tailles, couleurs)
  - Upload d'images multiples avec redimensionnement automatique
  - Gestion du stock
  - SEO (meta title, description)
  - Tags

- **Variantes de produits**
  - Tailles multiples (S, M, L, XL, 36, 38, etc.)
  - Couleurs avec codes hexadécimaux
  - Prix spécifique par variante
  - Stock individuel par variante
  - Images par variante
  - Gestion d'activation/désactivation

- **Panier**
  - Ajout/suppression d'articles
  - Gestion des quantités
  - Support des variantes
  - Calcul automatique du total

- **Commandes**
  - Création depuis le panier
  - Suivi du statut (pending, processing, shipped, delivered)
  - Gestion du paiement
  - Adresses de livraison et facturation
  - Historique des commandes

- **Upload d'images**
  - Redimensionnement automatique (thumbnail, medium, large)
  - Validation (format, taille)
  - Stockage organisé

## 📦 Technologies utilisées

- **Backend** : Node.js v22+ avec Express v5
- **Base de données** : PostgreSQL
- **ORM** : Sequelize v6
- **Authentification** : JWT + bcrypt
- **Upload** : Multer + Sharp
- **Validation** : express-validator
- **Dev tools** : Nodemon, Morgan

## 🛠 Installation

### Prérequis

- Node.js v22 ou supérieur
- PostgreSQL v14 ou supérieur
- npm ou yarn

### Étapes

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd mon-serveur_5B
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**

Créez un fichier `.env` à la racine :
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_cc_db
DB_USER=votre_user
DB_PASSWORD=votre_password

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=votre_secret_jwt_très_sécurisé
JWT_EXPIRES_IN=7d

# Upload
MAX_FILE_SIZE=5242880
```

4. **Créer la base de données PostgreSQL**
```bash
createdb ecommerce_cc_db
```

5. **Démarrer le serveur**
```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## 📝 Scripts disponibles

### Développement

```bash
npm run dev          # Démarre le serveur avec nodemon (rechargement auto)
npm start            # Démarre le serveur en production
```

### Administration

```bash
npm run create-admin  # Créer un nouvel administrateur (interactif)
npm run reset-admin   # Réinitialiser le mot de passe d'un admin (interactif)
npm run clean-db      # Nettoyer la base de données (⚠️ destructif)
```

### Créer un admin rapidement

```bash
npm run create-admin superadmin admin@shop.com AdminPass123 Pierre Dupont
```

### Réinitialiser un mot de passe admin

```bash
npm run reset-admin superadmin NewPassword123
```

## 🗂 Structure du projet

```
mon-serveur_5B/
├── config/
│   ├── database.js         # Configuration PostgreSQL
│   └── sequelize.js        # Instance Sequelize
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── categoryController.js
│   ├── productController.js
│   ├── variantController.js
│   ├── cartController.js
│   └── orderController.js
├── models/
│   ├── User.js
│   ├── Category.js
│   ├── Product.js
│   ├── ProductVariant.js
│   ├── Cart.js
│   ├── CartItem.js
│   ├── Order.js
│   ├── OrderItem.js
│   └── index.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── categoryRoutes.js
│   ├── productRoutes.js
│   ├── variantRoutes.js
│   ├── cartRoutes.js
│   └── orderRoutes.js
├── middlewares/
│   ├── auth.js
│   ├── roleCheck.js
│   ├── validation.js
│   ├── errorHandler.js
│   └── upload.js
├── public/
│   └── test-ecommerce.html  # Interface de test
├── uploads/                  # Images produits
├── scripts/
│   ├── createAdmin.js
│   ├── cleanDatabase.js
│   └── README.md
├── app.js                    # Configuration Express
├── server.js                 # Point d'entrée
├── db.js                     # Pool PostgreSQL
├── logger.js                 # Logger personnalisé
└── package.json
```

## 🔐 API Endpoints

### Authentification

```
POST   /api/auth/register     # Inscription
POST   /api/auth/login        # Connexion
GET    /api/auth/profile      # Profil utilisateur (protégé)
```

### Utilisateurs (Admin)

```
GET    /api/users             # Liste tous les utilisateurs
GET    /api/users/:id         # Détails d'un utilisateur
POST   /api/users             # Créer un utilisateur
PUT    /api/users/:id         # Modifier un utilisateur
DELETE /api/users/:id         # Supprimer un utilisateur
```

### Catégories

```
GET    /api/categories        # Liste toutes les catégories
GET    /api/categories/:id    # Détails d'une catégorie
POST   /api/categories        # Créer (admin)
PUT    /api/categories/:id    # Modifier (admin)
DELETE /api/categories/:id    # Supprimer (admin)
```

### Produits

```
GET    /api/products          # Liste tous les produits
GET    /api/products/:id      # Détails d'un produit
POST   /api/products          # Créer (admin)
PUT    /api/products/:id      # Modifier (admin)
DELETE /api/products/:id      # Supprimer (admin)
POST   /api/products/:id/images       # Upload images (admin)
DELETE /api/products/:id/images/:index # Supprimer image (admin)
```

### Variantes de produits

```
GET    /api/products/:productId/variants              # Liste variantes
GET    /api/products/:productId/variants/combinations # Combinaisons
GET    /api/variants/:variantId                       # Détails
GET    /api/variants/:variantId/availability          # Disponibilité
POST   /api/products/:productId/variants              # Créer (admin)
POST   /api/products/:productId/variants/bulk         # Création masse (admin)
PUT    /api/variants/:variantId                       # Modifier (admin)
DELETE /api/variants/:variantId                       # Supprimer (admin)
PATCH  /api/variants/:variantId/stock                 # Gérer stock (admin/manager)
```

### Panier

```
GET    /api/cart/my-cart              # Mon panier
POST   /api/cart/my-cart/items        # Ajouter article
PUT    /api/cart/my-cart/items/:id    # Modifier quantité
DELETE /api/cart/my-cart/items/:id    # Retirer article
DELETE /api/cart/my-cart              # Vider le panier
```

### Commandes

```
GET    /api/orders                # Mes commandes
GET    /api/orders/:id            # Détails commande
POST   /api/orders                # Créer commande
PUT    /api/orders/:id/status     # Modifier statut (admin)
```

## 🧪 Interface de test

Une interface HTML complète est disponible pour tester toutes les fonctionnalités :

**URL** : `http://localhost:3000/test/test-ecommerce.html`

### Fonctionnalités de l'interface

- Authentification (login/register)
- Gestion des catégories
- Gestion des produits
- Upload d'images
- **Gestion des variantes** (nouveau)
  - Création avec color picker
  - Filtres avancés
  - Gestion du stock
  - Activation/désactivation
- Panier
- Commandes

### Compte admin par défaut

```
Email    : admin@example.com
Password : Admin123
```

Ou créez un nouveau compte admin avec :
```bash
npm run create-admin
```

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt (10 rounds)
- Authentification JWT avec expiration
- Validation des entrées avec express-validator
- Protection CORS configurable
- Middleware de rôles pour les routes protégées
- Validation des uploads (type, taille)

## 📊 Base de données

### Schéma

Le projet utilise 8 tables principales :

1. **users** - Utilisateurs avec rôles
2. **categories** - Catégories hiérarchiques
3. **products** - Produits
4. **product_variants** - Variantes (taille, couleur, stock)
5. **carts** - Paniers
6. **cart_items** - Articles du panier
7. **orders** - Commandes
8. **order_items** - Détails des commandes

### Migrations

Sequelize crée automatiquement les tables au démarrage si elles n'existent pas.

Pour réinitialiser complètement la base de données :
```bash
npm run clean-db
npm run dev  # Recrée les tables
```

## 🐛 Dépannage

### Erreur de connexion à la base de données

Vérifiez :
- PostgreSQL est démarré
- Les credentials dans `.env` sont corrects
- La base de données existe

### Port déjà utilisé

Changez le port dans `.env` :
```env
PORT=3001
```

### Problème d'upload d'images

Vérifiez que le dossier `uploads/` existe et a les bonnes permissions :
```bash
mkdir -p uploads
chmod 755 uploads
```

## 📈 Améliorations futures

- [ ] Système de promotions et codes promo
- [ ] Avis et notations clients
- [ ] Recherche avancée et filtres
- [ ] Wishlist
- [ ] Dashboard admin avec statistiques
- [ ] Notifications email
- [ ] Intégration paiement (Stripe/PayPal)
- [ ] Calcul des frais de port
- [ ] Multi-langues (i18n)
- [ ] Tests unitaires et d'intégration

## 📄 Licence

ISC

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.
