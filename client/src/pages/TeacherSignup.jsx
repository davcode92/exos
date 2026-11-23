// Mémoire d'état
import { useState } from 'react';
// Navigation et liens
import { Link, useNavigate } from 'react-router-dom';
// Appel API
import { api } from '../api.js';
// Champ mot de passe
import PasswordInput from '../components/PasswordInput.jsx';
// Logo EXOS
import Logo from '../components/Logo.jsx';
// Classes et matières
import { CLASSES, SUBJECTS } from '../constants.js';

// Inscription d'un professeur : aucun abonnement, validation par l'admin ensuite
export default function TeacherSignup() {
  const [f, setF] = useState({ fullName: '', phone: '', password: '', subject: '' }); // champs texte
  const [classes, setClasses] = useState([]); // classes enseignées cochées
  const [photo, setPhoto] = useState(null); // photo de profil
  const [err, setErr] = useState(''); // erreur
  const [busy, setBusy] = useState(false); // envoi en cours
  const nav = useNavigate(); // changement de page
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value }); // met à jour un champ
  // Coche ou décoche une classe
  const toggle = (c) => setClasses(classes.includes(c) ? classes.filter((x) => x !== c) : [...classes, c]);

  // Envoie le formulaire
  async function submit(e) {
    e.preventDefault(); // pas de rechargement
    setErr(''); setBusy(true); // prépare l'envoi
    try {
      const fd = new FormData(); // formulaire avec fichier possible
      Object.entries(f).forEach(([k, v]) => fd.append(k, v)); // champs texte
      fd.append('classes', classes.join(',')); // classes séparées par des virgules
      if (photo) fd.append('photo', photo); // photo éventuelle
      await api('/auth/register-teacher', { method: 'POST', body: fd }); // appel au serveur
      nav('/prof/pending'); // page « en attente de validation »
    } catch (e2) { setErr(e2.message); } // affiche l'erreur
    finally { setBusy(false); } // débloque le bouton
  }

  return (
    <form onSubmit={submit}>{/* formulaire */}
      <Logo />{/* logo EXOS */}
      <h1>Compte professeur</h1>{/* titre */}
      <p className="sub">Rejoins EXOS — gratuit pour les professeurs</p>{/* sous-titre */}
      <label>Nom complet</label><input value={f.fullName} onChange={set('fullName')} required />{/* nom */}
      <label>Numéro de téléphone</label><input value={f.phone} onChange={set('phone')} placeholder="+241 07 00 00 00" inputMode="tel" required />{/* téléphone */}
      <label>Mot de passe</label><PasswordInput value={f.password} onChange={set('password')} minLength={6} required />{/* mot de passe */}
      <label>Matière enseignée</label>{/* choix de la matière */}
      <select value={f.subject} onChange={set('subject')} required>
        <option value="">Sélectionnez votre matière</option>{/* valeur vide */}
        {SUBJECTS.map((s) => <option key={s}>{s}</option>)}{/* une option par matière */}
      </select>
      <label>Classes enseignées</label>{/* cases à cocher */}
      <div className="row tight" style={{ flexWrap: 'wrap' }}>
        {CLASSES.map((c) => (
          <label key={c} style={{ margin: 0, display: 'flex', gap: 4, alignItems: 'center' }}>{/* une case par classe */}
            <input type="checkbox" style={{ width: 'auto' }} checked={classes.includes(c)} onChange={() => toggle(c)} />{c}
          </label>
        ))}
      </div>
      <label>Photo de profil</label><input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />{/* photo */}
      {err && <p className="error">{err}</p>}{/* erreur éventuelle */}
      <button className="btn" disabled={busy}>{busy ? 'Envoi…' : 'Créer mon compte'}</button>{/* bouton */}
      <p className="center muted">Déjà un compte ? <Link to="/prof/login">Se connecter</Link></p>{/* lien connexion */}
    </form>
  );
}
