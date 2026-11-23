// Mémoire d'état
import { useState } from 'react';
// Navigation et liens
import { Link, useNavigate } from 'react-router-dom';
// Appel API
import { api } from '../api.js';
// Session et page d'accueil par rôle
import { useAuth, homeOf } from '../AuthContext.jsx';
// Contact WhatsApp pour les réclamations
import WhatsAppButton from '../components/WhatsAppButton.jsx';
// Logo EXOS
import Logo from '../components/Logo.jsx';
// Champ mot de passe
import PasswordInput from '../components/PasswordInput.jsx';

// Textes selon le rôle (la même page sert aux trois rôles)
const TEXT = {
  student: { title: 'Connexion', sub: 'Bon retour — connecte-toi pour continuer' }, // élève
  teacher: { title: 'Espace professeur', sub: 'Connecte-toi pour corriger les exercices' }, // professeur
  admin: { title: 'Connexion Admin', sub: 'Accédez à la gestion EXOS' }, // admin
};

// Page de connexion par numéro de téléphone
export default function Login({ role }) {
  const [phone, setPhone] = useState(''); // numéro saisi
  const [password, setPassword] = useState(''); // mot de passe saisi
  const [err, setErr] = useState(''); // erreur
  const [busy, setBusy] = useState(false); // envoi en cours
  const { login } = useAuth(); // ouverture de session
  const nav = useNavigate(); // changement de page
  const t = TEXT[role]; // textes du rôle

  // Envoie la connexion
  async function submit(e) {
    e.preventDefault(); // pas de rechargement
    setErr(''); setBusy(true); // prépare
    try {
      const data = await api('/auth/login', { method: 'POST', body: { phone, password } }); // appel au serveur
      login(data); // ouvre la session
      // élève sans abonnement : paiement ; sinon page d'accueil de son rôle
      nav(data.user.role === 'student' && !data.subscriptionActive ? '/pay' : homeOf(data.user));
    } catch (e2) {
      if (e2.code === 'PENDING') nav('/prof/pending'); // professeur pas encore validé
      else setErr(e2.message); // autre erreur : on l'affiche
    } finally { setBusy(false); } // débloque le bouton
  }

  return (
    <form onSubmit={submit} className={role === 'admin' ? 'admincard' : ''}>{/* formulaire (carte pour l'admin) */}
      {role === 'admin' && <div className="bar" />}{/* bande de couleurs de la carte admin */}
      <Logo size={role === 'admin' ? 80 : 62} center={role === 'admin'} />{/* logo EXOS */}
      <h1>{t.title}</h1>{/* titre */}
      <p className="sub">{t.sub}</p>{/* sous-titre */}
      <label>Numéro de téléphone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+241 07 00 00 00" inputMode="tel" required />{/* téléphone */}
      <label>Mot de passe</label><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Entrez votre mot de passe" required />{/* mot de passe */}
      {err && <p className="error">{err}</p>}{/* erreur éventuelle */}
      <button className={'btn' + (role === 'admin' ? ' green' : '')} disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>{/* bouton */}
      <p className="center"><Link to="/reset">Mot de passe oublié</Link></p>{/* réinitialisation */}
      {role === 'student' && <p className="center muted">Je n'ai pas de compte — <Link to="/signup">S'inscrire</Link></p>}{/* lien inscription élève */}
      {role === 'teacher' && <p className="center muted">Pas de compte ? <Link to="/prof/signup">Créer un compte professeur</Link></p>}{/* lien inscription professeur */}
      <p className="center"><Link to="/">← Retour à l'accueil</Link></p>{/* retour */}
      <WhatsAppButton />{/* réclamation par WhatsApp */}
    </form>
  );
}
