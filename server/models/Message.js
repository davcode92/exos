// Mongoose pour décrire les données
import mongoose from 'mongoose';
// Un message de chat (texte seulement)
const s = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // expéditeur
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // destinataire
  text: { type: String, required: true, maxlength: 1000 }, // le texte (1000 caractères maximum)
  readAt: Date, // date de lecture
}, { timestamps: true }); // dates automatiques
// Index pour retrouver vite une conversation
s.index({ from: 1, to: 1, createdAt: 1 });
// Exporte le modèle
export default mongoose.model('Message', s);
