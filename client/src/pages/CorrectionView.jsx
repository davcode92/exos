// Outils React
import { useEffect, useState } from 'react';
// Navigation
import { Link, useNavigate, useParams } from 'react-router-dom';
// Appels API : liste, fichier protégé, téléchargement
import { api, blobUrl, openFile } from '../api.js';

// Écran « Voir la correction » : l'élève consulte la correction et peut la télécharger
export default function CorrectionView() {
  const { id } = useParams(); // identifiant de l'exercice dans l'adresse
  const nav = useNavigate(); // changement de page
  const [ex, setEx] = useState(null); // exercice (false = introuvable)
  const [url, setUrl] = useState(null); // adresse temporaire du fichier de correction
  const [err, setErr] = useState(''); // erreur

  // Charge l'exercice puis son fichier de correction
  useEffect(() => {
    let obj; // adresse temporaire à libérer ensuite
    (async () => {
      try {
        const list = await api('/exercises/mine'); // exercices de l'élève
        const e = list.find((x) => x._id === id); // celui demandé
        if (!e || !e.correction?.file) { setEx(false); return; } // introuvable ou pas encore corrigé
        setEx(e); // l'affiche
        obj = await blobUrl(`/exercises/${id}/correction/file`); // récupère le fichier avec le jeton
        setUrl(obj); // l'affiche
      } catch (e2) { setErr(e2.message); } // erreur
    })();
    return () => { if (obj) URL.revokeObjectURL(obj); }; // libère la mémoire en quittant
  }, [id]);

  if (ex === false) return <p className="center">Correction introuvable. <Link to="/dashboard">Retour</Link></p>; // cas d'erreur
  if (!ex) return <p className="center muted">Chargement…</p>; // chargement en cours

  const isImage = ex.correction.file.mime.startsWith('image/'); // photo ou PDF ?
  const name = ex.correction.file.originalName; // nom du fichier

  return (
    <div>{/* conteneur */}
      <a className="back" onClick={() => nav('/dashboard')}>←</a>{/* retour au tableau de bord */}
      <h1>Correction</h1>{/* titre */}
      <div className="card">{/* informations */}
        <b>{ex.subject}</b> • {ex.teacher?.fullName}<br />{/* matière et professeur */}
        <span className="muted">Commentaire du prof : {ex.correction.comment || '—'}</span>{/* commentaire */}
      </div>
      {err && <p className="error">{err}</p>}{/* erreur éventuelle */}
      {url && (isImage
        ? <img className="preview" src={url} alt="Correction" /> // correction en photo
        : <iframe className="preview" src={url} title="Correction" />)}{/* ou en PDF */}
      <p className="muted small">Si le PDF ne s'affiche pas sur ton téléphone, utilise le bouton de téléchargement.</p>{/* aide */}
      <button className="btn green" onClick={() => openFile(`/exercises/${id}/correction/file`, name, true)}>⬇ Télécharger sur mon téléphone</button>{/* téléchargement */}
      <button className="btn outline" onClick={() => nav(`/chat/${ex.teacher._id}`, { state: { name: ex.teacher.fullName, subtitle: ex.subject } })}>💬 Poser une question au professeur</button>{/* ouvre le chat */}
    </div>
  );
}
