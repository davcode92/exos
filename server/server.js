// Charge les variables du fichier .env dans process.env
import 'dotenv/config';
// Module Node.js pour créer un serveur HTTP (Socket.io en a besoin)
import http from 'http';
// Express : le framework qui gère les routes de l'API
import express from 'express';
// CORS : autorise l'interface React (autre adresse) à appeler l'API
import cors from 'cors';
// Mongoose : outil pour parler à la base MongoDB
import mongoose from 'mongoose';
// Modèle utilisateur (pour remettre tout le monde « hors ligne » au démarrage)
import User from './models/User.js';
// Routes : inscription, connexion, mot de passe oublié
import auth from './routes/auth.js';
// Routes : profil, liste des professeurs, personnes en ligne
import users from './routes/users.js';
// Routes : paiement Airtel Money / Moov Money
import payments from './routes/payments.js';
// Routes : exercices et corrections
import exercises from './routes/exercises.js';
// Routes : chat (historique et envoi)
import chat from './routes/chat.js';
// Routes : espace administrateur
import admin from './routes/admin.js';
// Envoi des fichiers stockés (photos de profil)
import { sendStored } from './services/storage.js';
// Fonction qui démarre le chat temps réel (Socket.io)
import { initSocket } from './socket.js';

// Crée l'application Express
const app = express();
// Derrière Render/Vercel : fait confiance au 1er relais pour connaître la vraie adresse IP
app.set('trust proxy', 1);
// N'accepte que les appels venant de l'adresse de l'interface (CLIENT_URL)
app.use(cors({ origin: process.env.CLIENT_URL }));
// Permet de lire le JSON envoyé dans les requêtes
app.use(express.json());
// Les photos de profil sont accessibles à l'adresse /photos/nom-du-fichier (disque ou S3)
app.get('/photos/:name', (req, res) => sendStored(res, 'photos', req.params.name, { cache: true }));
// Chaque groupe de routes est rangé sous un préfixe /api/...
app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/payments', payments);
app.use('/api/exercises', exercises);
app.use('/api/chat', chat);
app.use('/api/admin', admin);
// Gestionnaire d'erreurs : s'exécute quand une route plante ou qu'un fichier est refusé
app.use((err, req, res, next) => {
  // Fichier trop gros ou mauvais type : on répond avec une erreur claire (400)
  if (err.name === 'MulterError' || err.message === 'Type de fichier non autorisé')
    return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop volumineux' : err.message });
  // Autre erreur : on l'écrit dans la console du serveur
  console.error(err);
  // et on répond « erreur serveur » sans montrer de détails à l'utilisateur
  res.status(500).json({ message: 'Erreur serveur' });
});

// Connexion à la base de données (le serveur attend que ce soit fait)
await mongoose.connect(process.env.MONGO_URI);
// Au démarrage, personne n'est connecté : on remet tout le monde « hors ligne »
await User.updateMany({ online: true }, { online: false });
// Crée le serveur HTTP à partir de l'application Express
const server = http.createServer(app);
// Branche le chat temps réel sur ce serveur
initSocket(server);
// Le serveur commence à écouter les requêtes (PORT du .env, sinon 5000)
server.listen(process.env.PORT || 5000, () => console.log('EXOS API prête'));
