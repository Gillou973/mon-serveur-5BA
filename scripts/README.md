# Scripts d'administration

Ce dossier contient les scripts utilitaires pour gérer l'application.

## 📝 Scripts disponibles

### 1. createAdmin.js - Créer un nouvel administrateur

Ce script permet de créer facilement un nouvel utilisateur avec le rôle administrateur.

#### Utilisation en mode interactif

```bash
npm run create-admin
```

Le script vous posera alors des questions interactives :
- Nom d'utilisateur (minimum 3 caractères)
- Email (format valide requis)
- Mot de passe (minimum 6 caractères, 1 majuscule, 1 chiffre)
- Prénom (optionnel)
- Nom de famille (optionnel)

#### Utilisation avec arguments

```bash
npm run create-admin <username> <email> <password> [prénom] [nom]
```

**Exemple :**
```bash
npm run create-admin superadmin admin@shop.com AdminPass123 Pierre Dupont
```

#### Validation

- **Username** : Minimum 3 caractères, doit être unique
- **Email** : Format email valide, doit être unique
- **Password** : Minimum 6 caractères, au moins 1 majuscule et 1 chiffre
- **Prénom/Nom** : Optionnels

#### Sortie

En cas de succès, le script affiche :
- ID de l'utilisateur créé
- Username
- Email
- Prénom et Nom
- Rôle (admin)
- Statut actif
- Date de création

#### Erreurs possibles

- ❌ Email déjà existant
- ❌ Username déjà existant
- ❌ Format email invalide
- ❌ Mot de passe trop faible
- ❌ Erreur de connexion à la base de données

---

### 2. resetAdmin.js - Réinitialiser le mot de passe d'un administrateur

Ce script permet de réinitialiser le mot de passe d'un utilisateur existant (admin ou autre).

#### Utilisation en mode interactif

```bash
npm run reset-admin
```

Le script vous posera alors des questions interactives :
- Email ou nom d'utilisateur
- Nouveau mot de passe (minimum 6 caractères, 1 majuscule, 1 chiffre)
- Confirmation du mot de passe

#### Utilisation avec arguments

```bash
npm run reset-admin <email_or_username> <new_password>
```

**Exemple :**
```bash
npm run reset-admin superadmin NewPassword123
npm run reset-admin admin@shop.com AdminReset2024
```

#### Validation

- **Nouveau mot de passe** : Minimum 6 caractères, au moins 1 majuscule et 1 chiffre
- L'utilisateur doit exister dans la base de données
- Si l'utilisateur n'est pas admin, une confirmation sera demandée

#### Sortie

En cas de succès, le script affiche :
- ID de l'utilisateur
- Username
- Email
- Prénom et Nom
- Rôle
- Statut actif
- Confirmation de la réinitialisation

#### Erreurs possibles

- ❌ Utilisateur inexistant
- ❌ Mot de passe trop faible
- ❌ Mots de passe non concordants (mode interactif)
- ❌ Erreur de connexion à la base de données

---

### 3. cleanDatabase.js - Nettoyer la base de données

Ce script supprime toutes les tables et types ENUM de la base de données.

⚠️ **ATTENTION : Cette action est irréversible !**

#### Utilisation

```bash
npm run clean-db
```

#### Actions effectuées

1. Suppression de toutes les tables dans l'ordre :
   - order_items
   - orders
   - cart_items
   - carts
   - product_variants
   - products
   - categories
   - users (si applicable)

2. Suppression des types ENUM :
   - enum_orders_status
   - enum_orders_payment_status
   - enum_carts_status

3. Nettoyage des types mal créés (si existants)

---

## 🔧 Exemples d'utilisation

### Créer un super administrateur

```bash
npm run create-admin superadmin super@example.com SuperAdmin123! John Doe
```

### Créer un admin en mode interactif

```bash
npm run create-admin
# Puis suivre les instructions à l'écran
```

### Réinitialiser le mot de passe d'un admin

```bash
# Avec arguments
npm run reset-admin superadmin NewPassword123

# Mode interactif
npm run reset-admin
# Puis suivre les instructions à l'écran
```

### Nettoyer et réinitialiser la base de données

```bash
npm run clean-db
# Puis redémarrer le serveur pour recréer les tables
npm run dev
```

---

## 📋 Notes

- Tous les mots de passe sont automatiquement hashés avec bcrypt
- Le rôle est automatiquement défini à 'admin'
- Le compte est automatiquement activé (is_active = true)
- Les scripts se connectent automatiquement à la base de données configurée dans .env
- Les scripts ferment automatiquement la connexion à la base de données après exécution

---

## 🆘 Dépannage

### Le script ne trouve pas la base de données

Vérifiez votre fichier `.env` :
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_cc_db
DB_USER=votre_user
DB_PASSWORD=votre_password
```

### Erreur "Email déjà existant"

L'email que vous essayez d'utiliser existe déjà dans la base de données. Utilisez un autre email ou supprimez l'utilisateur existant.

### Erreur "Username déjà existant"

Le nom d'utilisateur existe déjà. Choisissez un autre nom d'utilisateur.

### Le mot de passe ne respecte pas les critères

Assurez-vous que votre mot de passe contient :
- Au moins 6 caractères
- Au moins 1 lettre majuscule
- Au moins 1 chiffre

**Exemples de mots de passe valides :**
- Admin123
- Password1
- SuperAdmin2024



 ✅ Script resetAdmin.js - Résumé complet

  📁 Ce qui a été créé/modifié

  1. scripts/resetAdmin.js (131 lignes)
    - Script pour réinitialiser le mot de passe d'un admin
    - Recherche par email OU username
    - 2 modes : interactif ou avec arguments
    - Validation complète du nouveau mot de passe
    - Confirmation demandée si l'utilisateur n'est pas admin
    - Hash automatique avec bcrypt
  2. package.json
    - Ajout du script reset-admin
  3. scripts/README.md
    - Documentation complète du nouveau script
    - Exemples d'utilisation
  4. README.md (racine)
    - Mise à jour avec le nouveau script

  🎯 Utilisation

  Mode interactif :
  npm run reset-admin

  Mode direct avec username :
  npm run reset-admin superadmin NewPassword123

  Mode direct avec email :
  npm run reset-admin admin@shop.com AdminReset123

  ✅ Tests effectués

  1. Réinitialisation par username : ✅ Succès
    - Username : superadmin
    - Nouveau mot de passe : NewAdmin2024
  2. Réinitialisation par email : ✅ Succès
    - Email : admin@shop.com
    - Nouveau mot de passe : AdminReset123

  🔒 Fonctionnalités

  - ✅ Recherche flexible (email OU username)
  - ✅ Validation du mot de passe (6 char min, 1 majuscule, 1 chiffre)
  - ✅ Confirmation en mode interactif
  - ✅ Avertissement si l'utilisateur n'est pas admin
  - ✅ Affichage complet des informations du compte
  - ✅ Hash automatique du nouveau mot de passe
  - ✅ Gestion d'erreurs complète

  📋 Scripts disponibles maintenant

  npm run create-admin  # Créer un nouvel admin
  npm run reset-admin   # Réinitialiser mot de passe admin
  npm run clean-db      # Nettoyer la base de données

  Vous disposez maintenant d'une suite complète de scripts d'administration ! 🚀