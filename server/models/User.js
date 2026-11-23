// Mongoose permet de décrire la forme des données stockées dans MongoDB
import mongoose from 'mongoose';

// Description d'un utilisateur (élève, professeur ou admin)
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true }, // nom complet (obligatoire, espaces retirés)
  phone: { type: String, required: true, unique: true }, // téléphone : sert à se connecter, unique
  password: { type: String, required: true }, // mot de passe CHIFFRÉ (jamais en clair)
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' }, // rôle de la personne
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }, // validation (utile pour les professeurs)
  photo: String, // nom du fichier de la photo de profil
  classe: String, // classe de l'élève (6e … Tle)
  subject: String, // matière du professeur
  classes: [String], // classes enseignées par le professeur
  online: { type: Boolean, default: false }, // true quand la personne est connectée (vert)
  lastSeen: Date, // dernière déconnexion
  resetCode: String, // code SMS chiffré pour changer le mot de passe
  resetExpires: Date, // date limite de ce code
  resetAttempts: { type: Number, default: 0 }, // essais de code ratés (5 maximum)
}, { timestamps: true }); // ajoute createdAt et updatedAt automatiquement

// Quand on renvoie un utilisateur au navigateur, on masque les secrets
userSchema.set('toJSON', { transform: (doc, ret) => {
  delete ret.password; // jamais le mot de passe
  delete ret.resetCode; // ni le code SMS
  delete ret.resetExpires; // ni sa date limite
  delete ret.resetAttempts; // ni le compteur d'essais
  delete ret.__v; // ni le numéro de version interne
  if (ret.photo) ret.photo = '/photos/' + ret.photo; // la photo devient une adresse utilisable
  return ret; // résultat final envoyé
} });

// Exporte le modèle « User » (collection « users » dans MongoDB)
export default mongoose.model('User', userSchema);
