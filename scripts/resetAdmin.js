import sequelize from '../config/sequelize.js';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
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

// Fonction pour valider le mot de passe
const isValidPassword = (password) => {
  // Au moins 6 caractères, 1 majuscule, 1 chiffre
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

async function resetAdmin() {
  try {
    console.log('\n🔄 === RÉINITIALISATION DE MOT DE PASSE ADMINISTRATEUR ===\n');

    // Connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connecté à la base de données\n');

    let emailOrUsername, newPassword;

    // Vérifier si des arguments sont passés en ligne de commande
    const args = process.argv.slice(2);

    if (args.length >= 2) {
      // Mode arguments : node resetAdmin.js email_or_username new_password
      [emailOrUsername, newPassword] = args;
      console.log('📝 Mode arguments détecté\n');
    } else {
      // Mode interactif
      console.log('📝 Mode interactif - Veuillez entrer les informations\n');

      // Email ou Username
      emailOrUsername = await question('Email ou nom d\'utilisateur de l\'admin : ');
      while (!emailOrUsername || emailOrUsername.length < 3) {
        console.log('❌ Veuillez entrer un email ou nom d\'utilisateur valide');
        emailOrUsername = await question('Email ou nom d\'utilisateur : ');
      }

      // New Password
      newPassword = await question('Nouveau mot de passe (min 6 char, 1 majuscule, 1 chiffre) : ');
      while (!isValidPassword(newPassword)) {
        console.log('❌ Le mot de passe doit contenir au moins 6 caractères, 1 majuscule et 1 chiffre');
        newPassword = await question('Nouveau mot de passe : ');
      }

      // Confirmation
      const confirm = await question('Confirmer le nouveau mot de passe : ');
      if (confirm !== newPassword) {
        console.log('\n❌ Les mots de passe ne correspondent pas!');
        rl.close();
        await sequelize.close();
        process.exit(1);
      }
    }

    // Chercher l'utilisateur par email ou username
    const user = await User.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    });

    if (!user) {
      console.log('\n❌ Aucun utilisateur trouvé avec cet email ou nom d\'utilisateur!');
      rl.close();
      await sequelize.close();
      process.exit(1);
    }

    // Vérifier que c'est bien un admin
    if (user.role !== 'admin') {
      console.log(`\n⚠️  ATTENTION : Cet utilisateur n'est pas administrateur (rôle: ${user.role})`);
      const proceed = await question('Voulez-vous quand même réinitialiser le mot de passe ? (oui/non) : ');

      if (proceed.toLowerCase() !== 'oui' && proceed.toLowerCase() !== 'o' && proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
        console.log('\n❌ Opération annulée');
        rl.close();
        await sequelize.close();
        process.exit(0);
      }
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await user.update({ password: hashedPassword });

    console.log('\n✅ === MOT DE PASSE RÉINITIALISÉ AVEC SUCCÈS ===\n');
    console.log('📋 Détails du compte :');
    console.log(`   ID           : ${user.id}`);
    console.log(`   Username     : ${user.username}`);
    console.log(`   Email        : ${user.email}`);
    console.log(`   Prénom       : ${user.first_name || 'N/A'}`);
    console.log(`   Nom          : ${user.last_name || 'N/A'}`);
    console.log(`   Rôle         : ${user.role}`);
    console.log(`   Actif        : ${user.is_active ? 'Oui' : 'Non'}`);
    console.log('\n🔑 Le mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.\n');

    rl.close();
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la réinitialisation du mot de passe:');
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

resetAdmin();
