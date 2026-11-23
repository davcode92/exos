// Mongoose pour décrire les données
import mongoose from 'mongoose';
// Description d'un fichier stocké sur le serveur
const file = new mongoose.Schema({
  name: String, // nom du fichier sur le disque
  originalName: String, // nom d'origine donné par l'utilisateur
  mime: String, // type du fichier (image/jpeg, application/pdf…)
}, { _id: false }); // pas d'identifiant séparé pour ce petit bloc
// Un exercice envoyé par un élève
const s = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // élève qui envoie
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // professeur choisi
  subject: { type: String, required: true }, // matière
  file: file, // fichier de l'exercice (photo ou PDF)
  status: { type: String, enum: ['pending', 'corrected'], default: 'pending' }, // en attente / corrigé
  correction: { file: file, comment: String, date: Date }, // correction envoyée par le professeur
}, { timestamps: true }); // dates automatiques
// Exporte le modèle
export default mongoose.model('Exercise', s);
