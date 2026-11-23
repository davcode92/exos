// Outils React
import { useEffect, useState } from 'react';
// Paramètre d'adresse et navigation
import { Link, useNavigate, useParams } from 'react-router-dom';
// Appel API
import { api } from '../api.js';
// Boutons voir / télécharger
import FileButtons from '../components/FileButtons.jsx';

// Écran de correction : le professeur ouvre l'exercice et renvoie sa correction (photo ou PDF)
export default function Correct() {
  const { id } = useParams(); // identifiant de l'exercice dans l'adresse
  const nav = useNavigate(); // changement de page
  const [ex, setEx] = useState(null); // l'exercice à corriger
  const [file, setFile] = useState(null); // fichier de correction choisi
  const [comment, setComment] = useState(''); // commentaire pour l'élève
  const [err, setErr] = useState(''); // erreur
  const [busy, setBusy] = useState(false); // envoi en cours

  // Charge la liste « à corriger » et retrouve l'exercice demandé
  useEffect(() => { api('/exercises/todo').then((l) => setEx(l.find((x) => x._id === id) || false)).catch(() => setEx(false)); }, [id]);

  // Envoie la correction
  async function submit(e) {
    e.preventDefault(); // pas de rechargement
    if (!file) { setErr('Choisis la photo ou le PDF de ta correction.'); return; } // fichier obligatoire
    setErr(''); setBusy(true); // prépare
    try {
      const fd = new FormData(); // formulaire avec fichier
      fd.append('file', file); // la correction
      fd.append('comment', comment); // le commentaire
      await api(`/exercises/${id}/correction`, { method: 'POST', body: fd }); // envoi au serveur
      nav('/prof'); // retour au tableau de bord
    } catch (e2) { setErr(e2.message); } // affiche l'erreur
    finally { setBusy(false); } // débloque
  }

  if (ex === null) return <p className="center muted">Chargement…</p>; // en cours de chargement
  if (ex === false) return <p className="center">Exercice introuvable. <Link to="/prof">Retour</Link></p>; // inconnu ou déjà corrigé

  return (
    <form onSubmit={submit}>{/* formulaire */}
      <Link to="/prof" className="back">←</Link>{/* flèche de retour */}
      <h1>Correction</h1>{/* titre */}
      <div className="card item">{/* rappel de l'exercice */}
        <div><b>{ex.file?.originalName}</b><br /><span className="muted small">{ex.student?.fullName} • {ex.student?.classe} • {ex.subject}</span></div>{/* détails */}
        <FileButtons path={`/exercises/${ex._id}/file`} name={ex.file?.originalName} />{/* ouvrir ou télécharger l'exercice */}
      </div>
      <label>Ta correction (photo ou PDF)</label>{/* fichier de correction */}
      <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files[0])} />{/* choix du fichier */}
      <label>Commentaire pour l'élève</label>{/* commentaire */}
      <textarea rows={4} value={comment} maxLength={500} onChange={(e) => setComment(e.target.value)} placeholder="Ex : Bien, revois la question 3" />{/* zone de texte */}
      {err && <p className="error">{err}</p>}{/* erreur éventuelle */}
      <button className="btn green" disabled={busy}>{busy ? 'Envoi…' : 'Envoyer la correction'}</button>{/* bouton */}
    </form>
  );
}
