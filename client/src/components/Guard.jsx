// Redirection vers une autre page
import { Navigate } from 'react-router-dom';
// Utilisateur connecté et page d'accueil par rôle
import { useAuth, homeOf } from '../AuthContext.jsx';

// Protège une page : roles = rôles autorisés ; needSub = abonnement exigé pour les élèves
export default function Guard({ roles, needSub = false, login = '/login', children }) {
  const { user, active, loading } = useAuth(); // état de la session
  if (loading) return <p className="center muted">Chargement…</p>; // vérification en cours
  if (!user) return <Navigate to={login} replace />; // pas connecté : page de connexion
  if (roles && !roles.includes(user.role)) return <Navigate to={homeOf(user)} replace />; // mauvais rôle : sa propre page
  if (needSub && user.role === 'student' && !active) return <Navigate to="/pay" replace />; // élève sans abonnement : paiement
  return children; // tout est bon : affiche la page
}
