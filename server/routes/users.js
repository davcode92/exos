// Router Express
import { Router } from 'express';
// Modèle utilisateur
import User from '../models/User.js';
// Connexion obligatoire + abonnement actif pour les élèves
import { requireAuth, requireSubscription } from '../middleware/auth.js';
// Réception des photos de profil
import { uploadPhoto } from '../middleware/upload.js';
// Rangement des fichiers (disque ou S3)
import { persist, removeStored } from '../services/storage.js';

// Crée le groupe de routes
const r = Router();
// Toutes les routes ci-dessous exigent d'être connecté
r.use(requireAuth);

// PATCH /api/users/me : modifier son nom et sa photo de profil
r.patch('/me', uploadPhoto.single('photo'), persist('photos'), async (req, res) => {
  if (req.body.fullName) req.user.fullName = req.body.fullName.trim(); // nouveau nom
  if (req.file) { removeStored('photos', req.user.photo); req.user.photo = req.file.filename; } // remplace l'ancienne photo
  await req.user.save(); // enregistre
  res.json(req.user); // renvoie le profil à jour
});

// GET /api/users/teachers : professeurs validés (filtre ?subject=Maths), les « en ligne » d'abord
r.get('/teachers', requireSubscription, async (req, res) => {
  const q = { role: 'teacher', status: 'approved' }; // seulement les professeurs validés
  if (req.query.subject) q.subject = req.query.subject; // filtre éventuel par matière
  res.json(await User.find(q).sort({ online: -1, fullName: 1 })); // en ligne d'abord, puis ordre alphabétique
});

// GET /api/users/online : l'élève voit les professeurs en ligne, le professeur voit les élèves, l'admin voit tous
r.get('/online', requireSubscription, async (req, res) => {
  const q = { online: true, status: 'approved' }; // personnes en ligne et validées
  q.role = req.user.role === 'student' ? 'teacher' : req.user.role === 'teacher' ? 'student' : { $in: ['student', 'teacher'] }; // qui chacun peut voir
  res.json(await User.find(q).sort({ fullName: 1 })); // liste triée par nom
});

// Exporte le groupe de routes
export default r;
