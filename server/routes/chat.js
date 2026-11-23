// Router Express
import { Router } from 'express';
// Modèle message
import Message from '../models/Message.js';
// Modèle utilisateur
import User from '../models/User.js';
// Sécurité : connexion + abonnement
import { requireAuth, requireSubscription } from '../middleware/auth.js';
// Fonctions du chat
import { sendMessage, canChat } from '../services/chat.js';

// Crée le groupe de routes
const r = Router();
// Connexion et abonnement obligatoires
r.use(requireAuth, requireSubscription);

// GET /api/chat/:userId : historique de la conversation avec une personne
r.get('/:userId', async (req, res) => {
  const other = await User.findById(req.params.userId).catch(() => null); // l'autre personne
  if (!other || !canChat(req.user, other)) return res.status(403).json({ message: 'Conversation non autorisée' }); // interdit
  const q = { $or: [{ from: req.user._id, to: other._id }, { from: other._id, to: req.user._id }] }; // messages dans les deux sens
  const msgs = await Message.find(q).sort({ createdAt: 1 }).limit(200); // 200 derniers messages, du plus ancien au plus récent
  await Message.updateMany({ from: other._id, to: req.user._id, readAt: null }, { readAt: new Date() }); // marque comme lus
  res.json(msgs); // renvoie l'historique
});

// POST /api/chat/:userId : envoi d'un message (le temps réel passe aussi par Socket.io)
r.post('/:userId', async (req, res) => {
  try { res.status(201).json(await sendMessage(req.user, req.params.userId, req.body.text)); } // envoie et renvoie le message
  catch (e) { res.status(400).json({ message: e.message }); } // erreur de règle (texte vide, interdit…)
});

// Exporte le groupe de routes
export default r;
