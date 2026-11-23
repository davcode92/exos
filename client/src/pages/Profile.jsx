// Outil React
import { useState } from 'react';
// Navigation
import { useNavigate } from 'react-router-dom';
// Appel API
import { api } from '../api.js';
// Session et page d'accueil par rôle
import { useAuth, homeOf } from '../AuthContext.jsx';
// Photo de profil
import Avatar from '../components/Avatar.jsx';

// Profil : modifier son nom et sa photo (élève, professeur, admin)
export default function Profile() {
  const { user, refresh } = useAuth(); // session
  const nav = useNavigate(); // changement de page
  const [name, setName] = useState(user.fullName); // nom modifiable
  const [photo, setPhoto] = useState(null); // nouvelle photo
  const [msg, setMsg] = useState(''); // retour d'information
  const [err, setErr] = useState(''); // erreur

  // Enregistre les changements
  async function save(e) {
    e.preventDefault(); // pas de rechargement
    setErr(''); setMsg(''); // efface les messages
    try {
      const fd = new FormData(); // formulaire avec fichier
      fd.append('fullName', name); // nouveau nom
      if (photo) fd.append('photo', photo); // nouvelle photo éventuelle
      await api('/users/me', { method: 'PATCH', body: fd }); // envoi au serveur
      await refresh(); // recharge le profil affiché
      setMsg('Profil mis à jour ✔'); // confirmation
    } catch (e2) { setErr(e2.message); } // affiche l'erreur
  }

  return (
    <form onSubmit={save}>{/* formulaire */}
      <a className="back" onClick={() => nav(homeOf(user))}>←</a>{/* retour */}
      <h1>Mon profil</h1>{/* titre */}
      <div className="center"><Avatar user={user} size={96} /></div>{/* photo actuelle */}
      <label>Nom complet</label><input value={name} onChange={(e) => setName(e.target.value)} required />{/* nom */}
      <label>Nouvelle photo de profil</label><input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />{/* photo */}
      {msg && <p className="ok-msg">{msg}</p>}{/* succès */}
      {err && <p className="error">{err}</p>}{/* erreur */}
      <button className="btn">Enregistrer</button>{/* bouton */}
    </form>
  );
}
