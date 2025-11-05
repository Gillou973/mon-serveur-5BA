import sequelize from '../config/sequelize.js';
import User from '../models/User.js';
import readline from 'readline';

// Configuration readline pour l'entrée utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour poser une question
const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

// Fonction pour valider l'email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Fonction pour valider le mot de passe
const isValidPassword = (password) => {
  // Au moins 6 caractères, 1 majuscule, 1 chiffre
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

async function createAdmin() {
  try {
    console.log('\n🔐 === CRÉATION D\'UN NOUVEL ADMINISTRATEUR ===\n');

    // Connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connecté à la base de données\n');

    // Récupérer les informations
    let username, email, password, firstName, lastName;

    // Vérifier si des arguments sont passés en ligne de commande
    const args = process.argv.slice(2);

    if (args.length >= 3) {
      // Mode arguments : node createAdmin.js username email password [firstName] [lastName]
      [username, email, password, firstName, lastName] = args;
      console.log('📝 Mode arguments détecté\n');
    } else {
      // Mode interactif
      console.log('📝 Mode interactif - Veuillez entrer les informations\n');

      // Username
      username = await question('Nom d\'utilisateur (username) : ');
      while (!username || username.length < 3) {
        console.log('❌ Le nom d\'utilisateur doit contenir au moins 3 caractères');
        username = await question('Nom d\'utilisateur (username) : ');
      }

      // Email
      email = await question('Email : ');
      while (!isValidEmail(email)) {
        console.log('❌ Email invalide');
        email = await question('Email : ');
      }

      // Password
      password = await question('Mot de passe (min 6 char, 1 majuscule, 1 chiffre) : ');
      while (!isValidPassword(password)) {
        console.log('❌ Le mot de passe doit contenir au moins 6 caractères, 1 majuscule et 1 chiffre');
        password = await question('Mot de passe : ');
      }

      // Prénom (optionnel)
      firstName = await question('Prénom (optionnel) : ');

      // Nom (optionnel)
      lastName = await question('Nom de famille (optionnel) : ');
    }

    // Vérifier si l'email existe déjà
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      console.log('\n❌ Un utilisateur avec cet email existe déjà!');
      rl.close();
      await sequelize.close();
      process.exit(1);
    }

    // Vérifier si le username existe déjà
    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      console.log('\n❌ Un utilisateur avec ce nom d\'utilisateur existe déjà!');
      rl.close();
      await sequelize.close();
      process.exit(1);
    }

    // Créer l'admin (le mot de passe sera hashé automatiquement par le hook du modèle)
    const admin = await User.create({
      username,
      email,
      password, // Le hook du modèle User va hasher automatiquement
      first_name: firstName || null,
      last_name: lastName || null,
      role: 'admin',
      is_active: true
    });

    console.log('\n✅ === ADMINISTRATEUR CRÉÉ AVEC SUCCÈS ===\n');
    console.log('📋 Détails du compte :');
    console.log(`   ID           : ${admin.id}`);
    console.log(`   Username     : ${admin.username}`);
    console.log(`   Email        : ${admin.email}`);
    console.log(`   Prénom       : ${admin.first_name || 'N/A'}`);
    console.log(`   Nom          : ${admin.last_name || 'N/A'}`);
    console.log(`   Rôle         : ${admin.role}`);
    console.log(`   Actif        : ${admin.is_active ? 'Oui' : 'Non'}`);
    console.log(`   Créé le      : ${admin.created_at}`);
    console.log('\n🔑 Vous pouvez maintenant vous connecter avec ces identifiants\n');

    rl.close();
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la création de l\'administrateur:');
    console.error(error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`   - ${err.message}`);
      });
    }
    rl.close();
    await sequelize.close();
    process.exit(1);
  }
}

createAdmin();
