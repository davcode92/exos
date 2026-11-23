// Mongoose pour décrire les données
import mongoose from 'mongoose';
// Un abonnement = une date de fin par élève
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true }, // l'élève concerné (un seul abonnement par élève)
  endDate: Date, // date où l'accès sera bloqué
}, { timestamps: true }); // dates de création et de modification
// Exporte le modèle
export default mongoose.model('Subscription', s);
