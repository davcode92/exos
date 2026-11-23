// Socket.io : communication temps réel (chat et présence en ligne)
import { Server } from 'socket.io';
// Vérification des jetons de connexion
import jwt from 'jsonwebtoken';
// Modèle utilisateur
import User from './models/User.js';
// Fonctions du chat
import { setIo, sendMessage } from './services/chat.js';

// Démarre Socket.io sur le serveur HTTP
export function initSocket(server) {
  const io = new Server(server, { cors: { origin: process.env.CLIENT_URL } }); // autorise l'interface React
  setIo(io); // partage io avec le service de chat
  const conns = new Map(); // compte les connexions de chaque personne (plusieurs onglets possibles)

  // Avant d'accepter une connexion, on vérifie le jeton
  io.use(async (socket, next) => {
    try {
      const { id } = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET); // lit le jeton
      const u = await User.findById(id); // charge la personne
      if (!u || (u.role === 'teacher' && u.status !== 'approved')) throw new Error(); // refuse si invalide
      socket.user = u; // mémorise la personne sur la connexion
      next(); // accepte
    } catch { next(new Error('unauthorized')); } // refuse la connexion
  });

  // Quand une personne se connecte
  io.on('connection', async (socket) => {
    const id = String(socket.user._id); // son identifiant
    socket.join(id); // elle rejoint « sa salle » pour recevoir ses messages
    conns.set(id, (conns.get(id) || 0) + 1); // une connexion de plus
    await User.updateOne({ _id: id }, { online: true }); // elle passe « en ligne » (vert)
    io.emit('presence', { userId: id, online: true }); // prévient tout le monde

    // Quand elle envoie un message
    socket.on('message', async ({ to, text }, ack) => {
      try { ack?.({ ok: true, message: await sendMessage(socket.user, to, text) }); } // succès : renvoie le message
      catch (e) { ack?.({ ok: false, error: e.message }); } // échec : renvoie l'erreur
    });

    // Quand elle se déconnecte
    socket.on('disconnect', async () => {
      const n = (conns.get(id) || 1) - 1; // une connexion de moins
      if (n > 0) return conns.set(id, n); // d'autres onglets restent ouverts : toujours en ligne
      conns.delete(id); // plus aucune connexion
      await User.updateOne({ _id: id }, { online: false, lastSeen: new Date() }); // passe « hors ligne »
      io.emit('presence', { userId: id, online: false }); // prévient tout le monde
    });
  });
  return io; // renvoie le serveur Socket.io
}
