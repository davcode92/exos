// Bibliothèque qui crée et vérifie les jetons de connexion
import jwt from 'jsonwebtoken';
// Modèle utilisateur
import User from '../models/User.js';
// Modèle abonnement
import Subscription from '../models/Subscription.js';

// Dit si la personne peut utiliser l'application (abonnement actif pour un élève)
export const isActive = async (user) => {
  if (user.role !== 'student') return true; // professeur et admin : jamais d'abonnement à payer
  const sub = await Subscription.findOne({ user: user._id }); // cherche l'abonnement de l'élève
  return !!sub && sub.endDate > new Date(); // actif si la date de fin n'est pas dépassée
};

// Middleware : exige que la personne soit connectée (jeton valide)
export async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', ''); // récupère le jeton dans l'en-tête
    const { id } = jwt.verify(token, process.env.JWT_SECRET); // vérifie le jeton et lit l'identifiant
    req.user = await User.findById(id); // charge la personne depuis la base
    if (!req.user) throw new Error(); // personne supprimée : on refuse
    if (req.user.role === 'teacher' && req.user.status !== 'approved') // professeur non validé par l'admin
      return res.status(403).json({ message: 'Compte professeur non validé' }); // accès refusé
    next(); // tout va bien : on passe à la suite
  } catch { res.status(401).json({ message: 'Non connecté' }); } // jeton absent ou faux
}

// Middleware : bloque les élèves dont l'abonnement est expiré
export async function requireSubscription(req, res, next) {
  if (await isActive(req.user)) return next(); // abonnement actif : on continue
  res.status(402).json({ message: 'Abonnement requis : 3000 FCFA / mois' }); // sinon : paiement requis
}

// Middleware : limite une route à certains rôles (ex. admin)
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Accès refusé' }); // refuse les autres rôles
