// Router Express : permet de ranger les routes dans un fichier
import { Router } from 'express';
// bcrypt : chiffre et compare les mots de passe
import bcrypt from 'bcryptjs';
// jwt : crée les jetons de connexion
import jwt from 'jsonwebtoken';
// Modèle utilisateur
import User from '../models/User.js';
// Modèle abonnement
import Subscription from '../models/Subscription.js';
// Middlewares et fonction d'état de l'abonnement
import { requireAuth, isActive } from '../middleware/auth.js';
// Réception des photos de profil
import { uploadPhoto } from '../middleware/upload.js';
// Rangement des fichiers (disque ou S3)
import { persist, removeStored } from '../services/storage.js';
// Envoi de SMS (console ou Twilio)
import { sendSms } from '../services/sms.js';
// Limite le nombre de demandes (anti-abus)
import { tooMany } from '../services/rateLimit.js';

// Crée le groupe de routes d'authentification
const r = Router();
// Retire espaces, points et tirets d'un numéro de téléphone
const normPhone = (p = '') => String(p).replace(/[\s.-]/g, '');
// Crée un jeton valable 30 jours pour une personne
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// Transforme « 6e,5e » ou une liste en tableau propre de classes
const list = (v) => [].concat(v || []).flatMap((x) => String(x).split(',')).map((x) => x.trim()).filter(Boolean);

// POST /api/auth/register : inscription d'un élève (photo facultative dans le champ « photo »)
r.post('/register', uploadPhoto.single('photo'), persist('photos'), async (req, res) => {
  const { fullName, phone, password, classe } = req.body; // données du formulaire
  const bad = (code, message) => { removeStored('photos', req.file?.filename); return res.status(code).json({ message }); }; // refuse et supprime la photo reçue
  if (!fullName || !phone || !password || !classe) return bad(400, 'Tous les champs sont requis'); // champs manquants
  if (password.length < 6) return bad(400, 'Mot de passe trop court (6 minimum)'); // mot de passe trop court
  const p = normPhone(phone); // numéro nettoyé
  if (await User.findOne({ phone: p })) return bad(409, 'Ce numéro est déjà inscrit'); // numéro déjà pris
  const user = await User.create({ fullName, phone: p, classe, photo: req.file?.filename, password: await bcrypt.hash(password, 10) }); // crée l'élève
  res.status(201).json({ token: sign(user), user, subscriptionActive: false }); // renvoie jeton + profil (abonnement à payer)
});

// POST /api/auth/register-teacher : inscription d'un professeur (reste « pending » jusqu'à validation admin)
r.post('/register-teacher', uploadPhoto.single('photo'), persist('photos'), async (req, res) => {
  const { fullName, phone, password, subject } = req.body; // données du formulaire
  const bad = (code, message) => { removeStored('photos', req.file?.filename); return res.status(code).json({ message }); }; // refuse et nettoie
  if (!fullName || !phone || !password || !subject) return bad(400, 'Tous les champs sont requis'); // champs manquants
  if (password.length < 6) return bad(400, 'Mot de passe trop court (6 minimum)'); // mot de passe trop court
  const p = normPhone(phone); // numéro nettoyé
  if (await User.findOne({ phone: p })) return bad(409, 'Ce numéro est déjà inscrit'); // numéro déjà pris
  await User.create({ fullName, phone: p, subject, classes: list(req.body.classes), photo: req.file?.filename, // crée le professeur
    role: 'teacher', status: 'pending', password: await bcrypt.hash(password, 10) }); // en attente, sans abonnement
  res.status(201).json({ message: 'Compte créé : en attente de validation par l’administrateur' }); // pas de jeton avant validation
});

// POST /api/auth/login : connexion (élève, professeur ou admin) avec le téléphone
r.post('/login', async (req, res) => {
  const user = await User.findOne({ phone: normPhone(req.body.phone) }); // cherche la personne
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) // numéro inconnu ou mauvais mot de passe
    return res.status(401).json({ message: 'Numéro ou mot de passe incorrect' }); // même message dans les deux cas
  if (user.role === 'teacher' && user.status === 'pending') // professeur pas encore validé
    return res.status(403).json({ code: 'PENDING', message: 'Ton compte est en attente de validation par l’administrateur' });
  if (user.role === 'teacher' && user.status === 'rejected') // professeur refusé
    return res.status(403).json({ code: 'REJECTED', message: 'Ton compte a été refusé par l’administrateur' });
  res.json({ token: sign(user), user, subscriptionActive: await isActive(user) }); // succès : jeton + profil + état abonnement
});

// GET /api/auth/me : profil de la personne connectée et état de son abonnement
r.get('/me', requireAuth, async (req, res) => {
  const sub = await Subscription.findOne({ user: req.user._id }); // abonnement éventuel
  res.json({ user: req.user, subscriptionActive: await isActive(req.user), endDate: sub?.endDate || null }); // réponse complète
});

// POST /api/auth/forgot : envoie un code par SMS au numéro utilisé à l'inscription
r.post('/forgot', async (req, res) => {
  const phone = normPhone(req.body.phone); // numéro nettoyé
  if (tooMany('sms:' + phone, 3, 3600000) || tooMany('ip:' + req.ip, 10, 3600000)) // 3 demandes/heure par numéro, 10 par adresse IP
    return res.status(429).json({ message: 'Trop de demandes. Réessaie dans une heure.' }); // évite les abus et les coûts de SMS
  const user = await User.findOne({ phone }); // cherche la personne
  if (user) { // si elle existe
    const code = String(Math.floor(100000 + Math.random() * 900000)); // code à 6 chiffres
    user.resetCode = await bcrypt.hash(code, 10); // stocké chiffré
    user.resetExpires = new Date(Date.now() + 10 * 60 * 1000); // valable 10 minutes
    user.resetAttempts = 0; // remet le compteur d'essais à zéro
    await user.save(); // enregistre
    try { await sendSms(user.phone, `EXOS : ton code est ${code}. Valable 10 min. Ne le partage a personne.`); } // envoie le SMS (sans accents : 1 seul SMS)
    catch (e) { console.error('SMS non envoyé :', e.message); } // erreur écrite dans le journal, jamais montrée à l'utilisateur
  }
  res.json({ message: 'Si ce numéro existe, un code a été envoyé' }); // même réponse dans tous les cas (sécurité)
});

// POST /api/auth/reset : change le mot de passe avec le code reçu
r.post('/reset', async (req, res) => {
  const { phone, code, password } = req.body; // données reçues
  const p = normPhone(phone); // numéro nettoyé
  if (tooMany('reset:' + p, 10, 3600000)) return res.status(429).json({ message: 'Trop d\'essais. Réessaie plus tard.' }); // limite les essais
  const user = await User.findOne({ phone: p }); // cherche la personne
  if (!user || !user.resetCode || user.resetExpires < new Date()) return res.status(400).json({ message: 'Code invalide ou expiré' }); // pas de code actif
  if (!(await bcrypt.compare(code || '', user.resetCode))) { // code faux
    user.resetAttempts = (user.resetAttempts || 0) + 1; // un essai raté de plus
    if (user.resetAttempts >= 5) { user.resetCode = undefined; user.resetExpires = undefined; } // 5 échecs : le code est annulé
    await user.save(); // enregistre
    return res.status(400).json({ message: 'Code invalide ou expiré' }); // refus
  }
  if (!password || password.length < 6) return res.status(400).json({ message: 'Mot de passe trop court' }); // nouveau mot de passe trop court
  user.password = await bcrypt.hash(password, 10); // enregistre le nouveau mot de passe chiffré
  user.resetCode = undefined; // le code ne sert qu'une fois
  user.resetExpires = undefined; // on efface sa date limite
  user.resetAttempts = 0; // compteur remis à zéro
  await user.save(); // enregistre
  res.json({ message: 'Mot de passe modifié' }); // confirmation
});

// Exporte le groupe de routes
export default r;
