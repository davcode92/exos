// Modèle utilisateur
import User from '../models/User.js';
// Modèle message
import Message from '../models/Message.js';
// Savoir si l'abonnement d'un élève est actif
import { isActive } from '../middleware/auth.js';

// Variable qui contiendra le serveur Socket.io (rempli au démarrage)
let io;
// Enregistre le serveur Socket.io pour pouvoir envoyer des messages en direct
export const setIo = (i) => { io = i; };

// Règle : élève ↔ professeur, ou admin ↔ tout le monde (jamais élève ↔ élève)
export const canChat = (a, b) =>
  String(a._id) !== String(b._id) && (a.role === 'admin' || b.role === 'admin' || a.role !== b.role);

// Enregistre et distribue un message (TEXTE UNIQUEMENT : pas de photo, vidéo ni vocal)
export async function sendMessage(from, toId, text) {
  const t = typeof text === 'string' ? text.trim() : ''; // nettoie le texte
  if (!t || t.length > 1000) throw new Error('Message invalide (1 à 1000 caractères)'); // vide ou trop long
  const to = await User.findById(toId).catch(() => null); // cherche le destinataire
  if (!to || (to.role === 'teacher' && to.status !== 'approved') || !canChat(from, to)) // destinataire interdit
    throw new Error('Conversation non autorisée'); // on refuse
  if (!(await isActive(from))) throw new Error('Abonnement requis'); // élève sans abonnement : refus
  const msg = await Message.create({ from: from._id, to: to._id, text: t }); // enregistre dans la base
  io?.to(String(to._id)).emit('message', msg); // envoie en direct au destinataire s'il est connecté
  return msg; // renvoie le message créé
}
