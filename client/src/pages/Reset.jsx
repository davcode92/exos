// Mémoire d'état
import { useState } from 'react';
// Liens et navigation
import { Link, useNavigate } from 'react-router-dom';
// Appel API
import { api } from '../api.js';
// Logo EXOS
import Logo from '../components/Logo.jsx';
// Champ mot de passe
import PasswordInput from '../components/PasswordInput.jsx';

// Mot de passe oublié : 1) numéro de téléphone → code SMS ; 2) code + nouveau mot de passe
export default function Reset() {
  const [step, setStep] = useState(1); // étape en cours (1 ou 2)
  const [phone, setPhone] = useState(''); // numéro utilisé à l'inscription
  const [code, setCode] = useState(''); // code reçu par SMS
  const [password, setPassword] = useState(''); // nouveau mot de passe
  const [msg, setMsg] = useState(''); // message d'information
  const [err, setErr] = useState(''); // erreur
  const nav = useNavigate(); // changement de page

  // Étape 1 : demande l'envoi du code
  async function sendCode(e) {
    e.preventDefault(); // pas de rechargement
    setErr('');
    try { setMsg((await api('/auth/forgot', { method: 'POST', body: { phone } })).message); setStep(2); } // passe à l'étape 2
    catch (e2) { setErr(e2.message); } // affiche l'erreur
  }
  // Étape 2 : change le mot de passe
  async function reset(e) {
    e.preventDefault(); // pas de rechargement
    setErr('');
    try { await api('/auth/reset', { method: 'POST', body: { phone, code, password } }); alert('Mot de passe modifié'); nav('/login'); } // retour à la connexion
    catch (e2) { setErr(e2.message); } // affiche l'erreur
  }

  return (
    <form onSubmit={step === 1 ? sendCode : reset}>{/* le formulaire change selon l'étape */}
      <Logo />{/* logo EXOS */}
      <h1>Réinitialiser le mot de passe</h1>{/* titre */}
      <p className="sub">{step === 1 ? 'Entre ton numéro pour recevoir un code' : 'Entre le code reçu par SMS'}</p>{/* consigne */}
      <label>Numéro de téléphone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+241 07 00 00 00" inputMode="tel" required disabled={step === 2} />{/* téléphone */}
      {step === 2 && <>{/* champs de l'étape 2 */}
        <label>Code reçu</label><input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} required />{/* code SMS */}
        <label>Nouveau mot de passe</label><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />{/* nouveau mot de passe */}
      </>}
      {msg && step === 2 && <p className="ok-msg">{msg}</p>}{/* confirmation d'envoi */}
      {err && <p className="error">{err}</p>}{/* erreur éventuelle */}
      <button className="btn">{step === 1 ? 'Envoyer le code' : 'Changer le mot de passe'}</button>{/* bouton */}
      <p className="center"><Link to="/login">Retour à la connexion</Link></p>{/* retour */}
    </form>
  );
}
