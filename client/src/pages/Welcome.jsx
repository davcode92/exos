// Lien vers une autre page sans recharger
import { Link } from 'react-router-dom';
// Contact WhatsApp pour les réclamations
import WhatsAppButton from '../components/WhatsAppButton.jsx';

// Page d'accueil : « Commencer » ou « Se connecter »
export default function Welcome() {
  return (
    <div>{/* conteneur de la page */}
      <div className="bar" />{/* bande de couleurs en haut */}
      <img className="hero" src="/logo.jpg" alt="EXOS - Fais tes exos, réussis à l'école" />{/* logo et slogan */}
      <img className="students" src="/students.jpg" alt="Élèves" />{/* illustration */}
      <Link to="/signup" className="btn" style={{ textDecoration: 'none' }}>Commencer</Link>{/* mène à l'inscription */}
      <Link to="/login" className="btn outline" style={{ textDecoration: 'none' }}>J'ai déjà un compte<br /><small>Se connecter</small></Link>{/* mène à la connexion */}
      <WhatsAppButton />{/* réclamation par WhatsApp */}
      <p className="center muted small">Développée par Nkomengane</p>{/* signature */}
      <p className="center small"><Link to="/prof/login">Espace professeur</Link> • <Link to="/admin/login">Espace admin</Link></p>{/* accès des autres rôles */}
    </div>
  );
}
