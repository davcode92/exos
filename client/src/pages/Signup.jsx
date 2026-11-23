// Mémoire d'état
import { useState } from 'react';
// Navigation et liens
import { Link, useNavigate } from 'react-router-dom';
// Appel API et session
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
// Champ mot de passe avec œil
import PasswordInput from '../components/PasswordInput.jsx';
// Logo EXOS
import Logo from '../components/Logo.jsx';
// Liste des classes
import { CLASSES } from '../constants.js';

// Inscription d'un élève : nom, téléphone, classe, mot de passe, photo
export default function Signup() {
  const [f, setF] = useState({ fullName: '', phone: '', password: '', classe: '' }); // valeurs du formulaire
  const [photo, setPhoto] = useState(null); // photo de profil choisie
  const [err, setErr] = useState(''); // message d'erreur
  const [busy, setBusy] = useState(false); // envoi en cours
  const { login } = useAuth(); // pour ouvrir la session
  const nav = useNavigate(); // pour changer de page
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value }); // met à jour un champ

  // Envoie le formulaire au serveur
  async function submit(e) {
    e.preventDefault(); // empêche le rechargement de la page
    setErr(''); setBusy(true); // efface l'erreur et bloque le bouton
    try {
      const fd = new FormData(); // formulaire pouvant contenir un fichier
      Object.entries(f).forEach(([k, v]) => fd.append(k, v)); // ajoute chaque champ texte
      if (photo) fd.append('photo', photo); // ajoute la photo si elle existe
      const data = await api('/auth/register', { method: 'POST', body: fd }); // appel au serveur
      login(data); // ouvre la session
      nav('/pay'); // l'élève doit maintenant payer son abonnement
    } catch (e2) { setErr(e2.message); } // affiche l'erreur
    finally { setBusy(false); } // débloque le bouton
  }

  return (
    <form onSubmit={submit}>{/* formulaire */}
      <Logo />{/* logo EXOS */}
      <h1>Créer un compte</h1>{/* titre */}
      <p className="sub">Rejoins EXOS et réussis à l'école</p>{/* sous-titre */}
      <label>Nom complet</label><input value={f.fullName} onChange={set('fullName')} placeholder="Entrez votre nom complet" required />{/* nom */}
      <label>Numéro de téléphone</label><input value={f.phone} onChange={set('phone')} placeholder="+241 07 00 00 00" inputMode="tel" required />{/* téléphone */}
      <label>Mot de passe</label><PasswordInput value={f.password} onChange={set('password')} placeholder="Créez un mot de passe" minLength={6} required />{/* mot de passe */}
      <label>Classe</label>{/* choix de la classe */}
      <select value={f.classe} onChange={set('classe')} required>
        <option value="">Sélectionnez votre classe</option>{/* valeur vide */}
        {CLASSES.map((c) => <option key={c}>{c}</option>)}{/* une option par classe */}
      </select>
      <label>Photo de profil</label><input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />{/* photo */}
      {err && <p className="error">{err}</p>}{/* erreur éventuelle */}
      <button className="btn" disabled={busy}>{busy ? 'Envoi…' : "S'inscrire"}</button>{/* bouton d'envoi */}
      <p className="center muted">J'ai déjà un compte — <Link to="/login">Se connecter</Link></p>{/* lien vers la connexion */}
    </form>
  );
}
