# Structure du Projet - Serveur E-commerce

## Vue d'ensemble

Ce projet est une **API REST E-commerce complète** construite avec Node.js, Express.js et PostgreSQL. Il propose une plateforme e-commerce complète avec authentification, gestion de produits, paniers d'achat, commandes et fonctionnalités promotionnelles avancées (coupons, réductions, bundles).

---

## Technologies Principales

### Stack Technique
- **Runtime** : Node.js v22+ (ES Modules)
- **Framework** : Express.js v5.1.0
- **Base de données** : PostgreSQL v14+
- **ORM** : Sequelize v6.37.7
- **Authentification** : JWT (jsonwebtoken v9.0.2) + bcrypt v6.0.0
- **Upload de fichiers** : Multer v2.0.2
- **Traitement d'images** : Sharp v0.34.4
- **Validation** : express-validator v7.3.0
- **Logging** : Morgan v1.10.1

### Outils de développement
- **Serveur de dev** : Nodemon v3.1.10 (rechargement automatique)
- **Gestionnaire de paquets** : npm

---

## Structure des Répertoires

```
mon-serveur-5BA/
├── config/                      # Configuration
│   ├── database.js             # Configuration Sequelize (dev, test, prod)
│   ├── sequelize.js            # Instance Sequelize + test de connexion
│   └── multer.js               # Configuration upload fichiers
│
├── models/                      # Modèles de données (12 modèles)
│   ├── User.js                 # Utilisateurs (admin, manager, editor, user)
│   ├── Category.js             # Catégories hiérarchiques
│   ├── Product.js              # Produits
│   ├── ProductVariant.js       # Variantes de produits (taille, couleur)
│   ├── Cart.js                 # Paniers d'achat
│   ├── CartItem.js             # Articles du panier
│   ├── Order.js                # Commandes
│   ├── OrderItem.js            # Articles de commande
│   ├── Coupon.js               # Coupons de réduction
│   ├── Discount.js             # Réductions automatiques
│   ├── Bundle.js               # Offres groupées (3+1, etc.)
│   └── index.js                # Associations entre modèles
│
├── controllers/                 # Logique métier (11 contrôleurs)
│   ├── authController.js       # Inscription, connexion, mot de passe
│   ├── productController.js    # CRUD produits, stock, images
│   ├── variantController.js    # CRUD variantes, stock
│   ├── categoryController.js   # CRUD catégories
│   ├── cartController.js       # Gestion du panier
│   ├── orderController.js      # Création et gestion commandes
│   ├── userController.js       # Gestion utilisateurs (admin)
│   ├── couponController.js     # Gestion coupons
│   ├── discountController.js   # Gestion réductions
│   ├── bundleController.js     # Gestion bundles
│   └── uploadController.js     # Upload d'images
│
├── routes/                      # Définition des endpoints API
│   ├── authRoutes.js           # /api/auth/*
│   ├── productRoutes.js        # /api/products/*
│   ├── variantRoutes.js        # /api/variants/*
│   ├── categoryRoutes.js       # /api/categories/*
│   ├── cartRoutes.js           # /api/cart/*
│   ├── orderRoutes.js          # /api/orders/*
│   ├── userRoutes.js           # /api/users/*
│   ├── couponRoutes.js         # /api/coupons/*
│   ├── discountRoutes.js       # /api/discounts/*
│   ├── bundleRoutes.js         # /api/bundles/*
│   └── uploadRoutes.js         # Upload endpoints
│
├── middlewares/                 # Middlewares de traitement
│   ├── auth.js                 # Authentification JWT
│   ├── roleCheck.js            # Vérification des rôles
│   ├── validation.js           # Gestion erreurs de validation
│   ├── errorHandler.js         # Gestionnaire d'erreurs centralisé
│   └── upload.js               # Middleware upload Multer
│
├── services/                    # Couche logique métier
│   ├── authService.js          # Services d'authentification
│   └── imageService.js         # Services de gestion d'images
│
├── utils/                       # Utilitaires
│   └── imageProcessor.js       # Traitement images (4 résolutions)
│
├── scripts/                     # Scripts de gestion
│   ├── createAdmin.js          # Création admin interactif
│   ├── resetAdmin.js           # Réinitialisation mot de passe admin
│   ├── cleanDatabase.js        # Nettoyage complet BDD
│   ├── seedData.js             # Données de démonstration
│   └── dropEcommerceTables.js  # Suppression tables
│
├── public/                      # Interfaces de test HTML
│   ├── admin-dashboard.html    # Tableau de bord admin
│   ├── admin-login.html        # Connexion admin
│   ├── admin-promotions.html   # Gestion promotions
│   ├── index.html              # Page d'accueil
│   ├── products.html           # Liste produits
│   ├── product.html            # Détail produit
│   ├── cart.html               # Panier
│   ├── checkout.html           # Commande
│   ├── account.html            # Profil utilisateur
│   └── orders.html             # Historique commandes
│
├── uploads/                     # Stockage fichiers
│   ├── products/               # Images produits (par ID produit)
│   ├── categories/             # Images catégories
│   └── temp/                   # Zone temporaire
│
├── server.js                    # Point d'entrée application
├── app.js                       # Configuration Express
├── db.js                        # Connexion PostgreSQL (legacy)
├── logger.js                    # Système de logging
└── package.json                 # Dépendances et scripts
```

---

## Architecture du Projet

### Pattern : MVC (Model-View-Controller) + Couche Service

```
Flux de requête :

routes/productRoutes.js
    ↓
middlewares/ [auth, validation, roleCheck]
    ↓
controllers/productController.js
    ↓
services/authService.js (si nécessaire)
    ↓
models/ [Product, Category, ProductVariant, etc.]
    ↓
config/sequelize.js
    ↓
Base de données PostgreSQL
    ↓
Réponse (JSON)
```

### Décisions architecturales clés

1. **Séparation des responsabilités**
   - Routes : définissent uniquement les endpoints
   - Controllers : orchestrent la logique métier
   - Services : gèrent les préoccupations transversales
   - Models : définissent les structures de données

2. **Couches de sécurité**
   - Authentification (JWT dans header Authorization)
   - Autorisation (basée sur les rôles via middleware)
   - Validation des entrées (express-validator)
   - Gestion des erreurs (errorHandler centralisé)

3. **Accès base de données**
   - ORM Sequelize (pas de SQL brut)
   - Hooks de modèle pour hachage automatique
   - Associations pour chargement de données liées
   - Connection pooling (5-20 connexions selon env)

---

## Modèles de Données (12 Tables)

### Modèles Principaux

#### 1. **User** (Utilisateurs)
- UUID comme clé primaire
- Champs : username, email, password (hashé), role, first_name, last_name
- Rôles : `admin`, `manager`, `editor`, `user`
- Hachage bcrypt (10 rounds)
- JSONB : `addresses` (adresses multiples)
- Méthodes : `comparePassword()`, `isAdmin()`, `isManager()`, etc.

#### 2. **Category** (Catégories)
- Structure hiérarchique (parent_id pour sous-catégories)
- Génération automatique de slug
- Champs : name, slug, description, image
- Relation self-référentielle

#### 3. **Product** (Produits)
- Champs : name, slug, description, price, SKU, barcode, quantity
- Images : stockées en JSONB `{ url, alt, position }`
- Support variantes : `has_variants`
- Suivi stock : `track_inventory`
- SEO : meta_title, meta_description, tags
- Méthodes : `isAvailable()`, `getDiscountPercentage()`

#### 4. **ProductVariant** (Variantes de produits)
- Attributs : size, color, color_hex
- Prix et stock individuels par variante
- SKU unique par variante
- Images par variante (JSONB : thumbnail/medium/large)
- 15 index dont index composite (product_id, size, color)
- Méthodes : `isAvailable()`, `getEffectivePrice()`

#### 5. **Cart** (Paniers)
- Panier par utilisateur
- Statuts : `active`, `abandoned`, `converted`
- JSONB : `applied_promotions` (coupons, réductions, bundles)
- Méthodes : `calculateTotal()`, `getItemsCount()`

#### 6. **CartItem** (Articles du panier)
- Lie Product et ProductVariant au Cart
- Quantité et prix par article

#### 7. **Order** (Commandes)
- Numéro de commande auto-généré : `ORD-{timestamp}-{random}`
- Statuts : `pending`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`
- Statut paiement : `pending`, `paid`, `failed`, `refunded`
- JSONB : `shipping_address`, `billing_address`, `applied_promotions`
- Calcul : subtotal + tax + shipping - discount
- Méthode : `calculateTotal()`

#### 8. **OrderItem** (Articles de commande)
- Articles individuels d'une commande
- Référence Product et ProductVariant

#### 9. **Coupon** (Coupons de réduction)
- Types : `percentage`, `fixed_amount`, `free_shipping`
- Restrictions : montant minimum, montant maximum
- Applicabilité : tous produits, produits spécifiques, catégories spécifiques
- Limites d'utilisation : globale et par utilisateur
- Période de validité : `valid_from`, `valid_until`
- Méthodes : `isValid()`, `calculateDiscount()`, `isApplicableToCart()`

#### 10. **Discount** (Réductions automatiques)
- Similaire à Coupon mais pour réductions basées sur règles

#### 11. **Bundle** (Offres groupées)
- Types : `buy_x_get_y` (3+1), `bundle_price`, `bundle_percentage`
- Fonctionnalités avancées :
  - `auto_apply` : application automatique
  - `requires_all_products` : nécessite tous les produits
  - `stackable` : cumulable avec autres offres
  - Système de priorité
  - Limites de rédemption (globale et par utilisateur)
- Méthodes : `isValid()`, `isApplicableToCart()`, `calculateBundleDiscount()`

### Relations entre modèles

```
User (1) ──────> (M) Cart ──────> (M) CartItem
User (1) ──────> (M) Order ──────> (M) OrderItem
User (1) ──────> (M) Coupon (created_by)

Category (1) ──────> (M) Product
Category (1) ──────> (M) Category (hiérarchie)

Product (1) ──────> (M) ProductVariant
Product (1) ──────> (M) CartItem
Product (1) ──────> (M) OrderItem

ProductVariant (1) ──────> (M) CartItem
ProductVariant (1) ──────> (M) OrderItem
```

---

## Endpoints API Principaux

### Authentification (`/api/auth`)
```
POST   /api/auth/register          # Inscription utilisateur
POST   /api/auth/login             # Connexion (retourne JWT)
POST   /api/auth/logout            # Déconnexion
GET    /api/auth/me                # Profil utilisateur actuel
PUT    /api/auth/update-password   # Changement mot de passe
```

### Produits (`/api/products`)
```
GET    /api/products               # Liste (filtres, pagination, recherche)
GET    /api/products/:id           # Produit unique
GET    /api/products/slug/:slug    # Recherche par slug
POST   /api/products               # Créer produit (admin)
PUT    /api/products/:id           # Modifier produit (admin)
DELETE /api/products/:id           # Supprimer produit (admin)
PATCH  /api/products/:id/stock     # Mettre à jour stock (admin/manager)
POST   /api/products/:id/images    # Upload images (admin)
DELETE /api/products/:id/images/:index  # Supprimer image (admin)
```

### Variantes (`/api/variants`)
```
GET    /api/products/:productId/variants              # Liste variantes
GET    /api/variants/:variantId                       # Variante unique
POST   /api/products/:productId/variants              # Créer variante (admin)
POST   /api/products/:productId/variants/bulk         # Création en masse (admin)
PUT    /api/variants/:variantId                       # Modifier variante (admin)
DELETE /api/variants/:variantId                       # Supprimer variante (admin)
```

### Catégories (`/api/categories`)
```
GET    /api/categories             # Liste avec hiérarchie
GET    /api/categories/:id         # Catégorie unique
POST   /api/categories             # Créer catégorie (admin)
PUT    /api/categories/:id         # Modifier catégorie (admin)
DELETE /api/categories/:id         # Supprimer catégorie (admin)
```

### Panier (`/api/cart`)
```
GET    /api/cart/my-cart           # Panier de l'utilisateur
POST   /api/cart/my-cart/items     # Ajouter article
PUT    /api/cart/my-cart/items/:id # Modifier quantité
DELETE /api/cart/my-cart/items/:id # Supprimer article
DELETE /api/cart/my-cart           # Vider panier
```

### Commandes (`/api/orders`)
```
GET    /api/orders                 # Commandes de l'utilisateur
GET    /api/orders/:id             # Détails commande
POST   /api/orders                 # Créer commande depuis panier
PUT    /api/orders/:id/status      # Mettre à jour statut (admin)
```

### Promotions
```
# Coupons
GET    /api/coupons                # Liste coupons (admin)
GET    /api/coupons/:code          # Valider coupon (public)
POST   /api/coupons                # Créer coupon (admin)
PUT    /api/coupons/:id            # Modifier coupon (admin)
DELETE /api/coupons/:id            # Supprimer coupon (admin)

# Bundles
GET    /api/bundles                # Liste bundles (admin)
POST   /api/bundles                # Créer bundle (admin)
```

### Utilisateurs (`/api/users`)
```
GET    /api/users                  # Liste utilisateurs (admin)
GET    /api/users/:id              # Utilisateur unique
POST   /api/users                  # Créer utilisateur (admin)
PUT    /api/users/:id              # Modifier utilisateur
DELETE /api/users/:id              # Supprimer utilisateur (admin)
```

---

## Fonctionnalités Avancées

### 1. Système de Variantes de Produits
- Attributs multiples (taille, couleur)
- Prix individuel par variante (optionnel, sinon prix produit)
- Suivi stock par variante
- Images spécifiques par variante
- Support couleurs avec codes hex

### 2. Pipeline de Traitement d'Images
- Génération automatique multi-résolutions :
  - **Thumbnail** : 150x150 (WebP 80%)
  - **Medium** : 500x500 (WebP 85%)
  - **Large** : 1200x1200 (WebP 90%)
  - **Original** : Copie du fichier original
- Stockage organisé par ID produit
- Traitement parallèle (Promise.all)
- Noms de fichiers avec timestamp

### 3. Système Promotionnel Avancé

**Coupons**
- Types : pourcentage, montant fixe, livraison gratuite
- Restrictions produits/catégories spécifiques
- Limites d'utilisation globales et par utilisateur
- Périodes de validité
- Montant minimum d'achat
- Plafond de réduction maximum

**Bundles (Offres 3+1)**
- Buy X Get Y : ex. "Achetez 3, obtenez 1 gratuit"
- Prix bundle fixe
- Pourcentage de réduction sur bundle
- Application automatique
- Système de priorité
- Limites de rédemption

### 4. Gestion des Commandes
- Cycle de vie complet : pending → processing → shipped → delivered
- Suivi paiement : pending → paid / failed / refunded
- Numéros de commande automatiques
- Adresses de livraison et facturation (JSONB)
- Numéros de tracking
- Calcul total : subtotal + tax + shipping - discount

### 5. Sécurité

**Authentification & Autorisation**
- Tokens JWT (expiration 3 jours par défaut)
- Contrôle d'accès basé sur les rôles (4 rôles)
- Hachage bcrypt (10 rounds)
- Validation tokens sur routes protégées
- Vérification statut actif utilisateur

**Validation des Entrées**
- express-validator pour données requêtes
- Validation format email
- Exigences mot de passe (min 6 chars, 1 majuscule, 1 chiffre)
- Validation format slug
- Plages numériques pour prix/quantités

**Gestion des Erreurs**
- Gestionnaire d'erreurs centralisé
- Traduction erreurs Sequelize
- Détails erreurs selon environnement
- Codes HTTP appropriés (400, 401, 403, 404, 409, 500, 503)

---

## Configuration et Environnement

### Variables d'environnement requises (.env)

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_cc_db
DB_USER=<utilisateur_postgres>
DB_PASSWORD=<mot_de_passe_sécurisé>

# Serveur
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=<chaine_secrete_longue>
JWT_EXPIRES_IN=7d

# Upload fichiers
MAX_FILE_SIZE=5242880  # 5MB en octets
```

---

## Commandes Utiles

### Développement
```bash
npm install              # Installer dépendances
npm run dev             # Démarrer avec nodemon (auto-reload)
npm start               # Démarrer serveur (production)
```

### Gestion Base de Données
```bash
npm run create-admin    # Créer admin interactif
npm run reset-admin     # Réinitialiser mot de passe admin
npm run clean-db        # Nettoyage complet BDD (destructif)
```

### Tests
- Utiliser `test-ecommerce.html` dans `/public`
- API accessible sur : `http://localhost:3000/api/`
- Interfaces de test : `http://localhost:3000/`

---

## Points Forts du Projet

### 1. Évolutivité
- Abstraction ORM (facile de changer de BDD)
- Couche service pour réutilisation code
- Connection pooling pour concurrence
- Traitement images parallélisé

### 2. Maintenabilité
- Séparation claire des responsabilités
- Gestion d'erreurs centralisée
- Pattern middleware cohérent
- Associations de modèles complètes

### 3. Sécurité
- Authentification JWT
- Hachage bcrypt
- Autorisation basée rôles
- Validation entrées
- Configuration CORS

### 4. Richesse Fonctionnelle
- Système de variantes complet
- Système promotionnel avancé
- Gestion commandes cycle complet
- Traitement images multi-résolutions
- Catégories hiérarchiques

### 5. Expérience Développeur
- ES modules (JavaScript moderne)
- Nodemon pour développement
- Logging complet
- Scripts admin interactifs
- Interfaces HTML de test fournies

---

## Résumé

Ce projet est une **API REST e-commerce prête pour la production** avec des fonctionnalités de niveau entreprise. Il démontre de solides patterns architecturaux (MVC + Services), des pratiques de sécurité exemplaires (JWT + bcrypt), et une logique métier sophistiquée (variantes, promotions, bundles). Le code est bien organisé, évolutif et maintenable avec une séparation claire entre données (models), logique métier (controllers/services) et routage (routes/middlewares).

---

*Document généré automatiquement - Dernière mise à jour : 2025-11-05*
