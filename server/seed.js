// Script à lancer une fois (npm run seed) pour créer le compte administrateur
import 'dotenv/config';
// Mongoose pour se connecter à la base
import mongoose from 'mongoose';
// bcrypt pour chiffrer le mot de passe
import bcrypt from 'bcryptjs';
// Modèle utilisateur
import User from './models/User.js';

// Connexion à la base
await mongoose.connect(process.env.MONGO_URI);
// Numéro de l'admin tiré du .env, sans espaces ni tirets
const phone = (process.env.ADMIN_PHONE || '').replace(/[\s.-]/g, '');
// Sans numéro, on arrête avec un message clair
if (!phone) throw new Error('Renseigne ADMIN_PHONE dans le fichier .env');
// Si un compte avec ce numéro existe déjà, on ne le recrée pas
if (await User.findOne({ phone })) console.log('Admin déjà créé');
else {
  // Sinon on crée l'administrateur avec un mot de passe chiffré
  await User.create({
    fullName: process.env.ADMIN_NAME || 'Administrateur', // nom affiché
    phone, // numéro de connexion
    role: 'admin', // rôle administrateur
    status: 'approved', // l'admin est validé d'office
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMoi123', 10), // mot de passe chiffré
  });
  // Message de confirmation
  console.log('Admin créé :', phone);
}
// Ferme la connexion : le script est terminé
await mongoose.disconnect();
