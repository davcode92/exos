// Mongoose pour décrire les données
import mongoose from 'mongoose';
// Un paiement Mobile Money
const p = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // l'élève qui paie
  amount: Number, // montant en FCFA
  operator: { type: String, enum: ['airtel', 'moov'] }, // opérateur choisi
  phone: String, // numéro Mobile Money utilisé
  reference: { type: String, unique: true }, // référence EXOS unique du paiement
  providerRef: String, // référence donnée par l'opérateur
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' }, // en attente / réussi / échoué
}, { timestamps: true }); // dates automatiques
// Exporte le modèle
export default mongoose.model('Payment', p);
