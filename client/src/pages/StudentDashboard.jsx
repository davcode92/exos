// Outils React
import { useCallback, useEffect, useState } from 'react';
// Navigation
import { Link, useNavigate } from 'react-router-dom';
// Appel API
import { api } from '../api.js';
// Session (utilisateur, date de fin d'abonnement, socket temps réel)
import { useAuth } from '../AuthContext.jsx';
// Composants
import Avatar from '../components/Avatar.jsx';
import BottomNav from '../components/BottomNav.jsx';
// Contact WhatsApp pour les réclamations
import WhatsAppButton from '../components/WhatsAppButton.jsx';

// Tableau de bord de l'élève
export default function StudentDashboard() {
  const { user, endDate, socket, logout } = useAuth(); // session
  const nav = useNavigate(); // changement de page
  const [teachers, setTeachers] = useState([]); // professeurs (avec présence)
  const [list, setList] = useState([]); // exercices de l'élève
  const [teacherId, setTeacherId] = useState(''); // professeur choisi pour l'envoi
  const [msg, setMsg] = useState(''); // message d'information
  const [busy, setBusy] = useState(false); // envoi en cours

  // Recharge professeurs et exercices
  const load = useCallback(async () => {
    try {
      const [t, e] = await Promise.all([api('/users/teachers'), api('/exercises/mine')]); // deux appels en parallèle
      setTeachers(t); setList(e); // met à jour l'écran
    } catch { /* erreur passagère : on garde l'affichage actuel */ }
  }, []);

  // Charge au départ puis toutes les 15 secondes
  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, [load]);
  // Recharge aussi dès qu'une personne passe en ligne ou hors ligne
  useEffect(() => { if (!socket) return undefined; socket.on('presence', load); return () => socket.off('presence', load); }, [socket, load]);

  // Envoie la photo ou le PDF choisi au professeur sélectionné
  async function upload(e) {
    const file = e.target.files[0]; // fichier choisi
    e.target.value = ''; // permet de rechoisir le même fichier ensuite
    if (!file) return; // rien choisi
    if (!teacherId) { setMsg('Choisis d\'abord un professeur ci-dessus.'); return; } // professeur obligatoire
    const fd = new FormData(); // formulaire avec fichier
    fd.append('file', file); // le fichier
    fd.append('teacherId', teacherId); // le professeur
    setBusy(true); setMsg(''); // prépare
    try { await api('/exercises', { method: 'POST', body: fd }); setMsg('Exercice envoyé ✔ — en attente de correction'); load(); } // succès
    catch (err) { setMsg(err.message); } // erreur
    finally { setBusy(false); } // débloque
  }

  const done = list.filter((x) => x.status === 'corrected'); // exercices corrigés
  const pending = list.filter((x) => x.status === 'pending'); // exercices en attente
  const date = (d) => new Date(d).toLocaleDateString('fr-FR'); // date lisible

  return (
    <div className="withnav">{/* conteneur (place pour la barre du bas) */}
      <div className="row tight" style={{ marginTop: 10 }}>{/* en-tête */}
        <Avatar user={{ ...user, online: true }} size={64} dot />{/* ma photo + point vert */}
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Bonjour {user.fullName.split(' ')[0]},</h1>{/* salutation */}
          <div className="muted">Classe {user.classe} • <span className="live">● En ligne</span></div>{/* classe et présence en vert */}
        </div>
      </div>
      <p className="muted small">Abonnement actif jusqu'au {endDate ? date(endDate) : '—'}</p>{/* date de fin */}

      <h2 id="profs">Profs en ligne</h2>{/* section professeurs */}
      <div className="scroll">
        {teachers.map((t) => (
          <div key={t._id} className="card person" onClick={() => nav(`/chat/${t._id}`, { state: { name: t.fullName, subtitle: t.subject } })}>{/* touche = ouvre le chat */}
            <Avatar user={t} size={48} dot />{/* photo + présence */}
            <div><b>{t.fullName}</b></div>{/* nom */}
            <div>{t.subject} • <span className={t.online ? 'live' : 'muted'}>{t.online ? 'en ligne' : 'hors ligne'}</span></div>{/* matière et état */}
          </div>
        ))}
        {!teachers.length && <p className="muted">Aucun professeur pour l'instant.</p>}{/* liste vide */}
      </div>

      <h2>Envoyer un exercice</h2>{/* section envoi */}
      <label>Matière et professeur</label>{/* choix du professeur */}
      <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
        <option value="">Choisis un professeur</option>{/* valeur vide */}
        {teachers.map((t) => <option key={t._id} value={t._id}>{t.subject} — {t.fullName}{t.online ? ' (en ligne)' : ''}</option>)}{/* une option par professeur */}
      </select>
      <div className="row" style={{ marginTop: 10 }}>{/* deux boutons d'envoi */}
        <label className="btn light" style={{ margin: 0 }}>📷 Prendre une photo<input type="file" accept="image/*" capture="environment" hidden onChange={upload} disabled={busy} /></label>{/* ouvre l'appareil photo */}
        <label className="btn light" style={{ margin: 0 }}>📄 Photo ou PDF<input type="file" accept="image/*,application/pdf" hidden onChange={upload} disabled={busy} /></label>{/* choisit un fichier */}
      </div>
      {msg && <p className="ok-msg">{msg}</p>}{/* retour d'information */}

      <h2 id="exos">Exercices corrigés par le professeur</h2>{/* section corrections */}
      {done.map((x) => (
        <div key={x._id} className="card item">{/* une correction */}
          <div>
            <b>✅ {x.subject}</b> • {x.teacher?.fullName}<br />{/* matière et professeur */}
            <span className="muted small">{x.correction?.comment || 'Corrigé'} • {date(x.correction?.date)}</span>{/* commentaire et date */}
          </div>
          <Link className="pill ok" to={`/correction/${x._id}`} style={{ textDecoration: 'none' }}>Voir la correction ›</Link>{/* ouvre l'écran de correction */}
        </div>
      ))}
      {!done.length && <p className="muted">Aucune correction pour l'instant.</p>}{/* liste vide */}

      <h2>Mes exercices envoyés</h2>{/* section envois */}
      {pending.map((x) => (
        <div key={x._id} className="card item">{/* un exercice en attente */}
          <div><b>{x.file?.originalName}</b><br /><span className="muted small">{x.subject} • {x.teacher?.fullName} • {date(x.createdAt)}</span></div>{/* détails */}
          <span className="pill">En attente de correction</span>{/* statut jaune */}
        </div>
      ))}
      {!pending.length && <p className="muted">Aucun exercice en attente.</p>}{/* liste vide */}
      <WhatsAppButton variant="float" />{/* bulle flottante : réclamation WhatsApp */}
      <BottomNav items={[ // barre du bas : Accueil, Exercices, Chat, Profil, Quitter
        { icon: '🏠', label: 'Accueil', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) }, // remonte en haut
        { icon: '📝', label: 'Exercices', onClick: () => document.getElementById('exos')?.scrollIntoView({ behavior: 'smooth' }) }, // va aux exercices
        { icon: '💬', label: 'Chat', onClick: () => document.getElementById('profs')?.scrollIntoView({ behavior: 'smooth' }) }, // va aux professeurs
        { icon: '👤', label: 'Profil', onClick: () => nav('/profile') }, // ouvre le profil
        { icon: '🚪', label: 'Quitter', onClick: () => { logout(); nav('/'); } }, // déconnexion
      ]} />
    </div>
  );
}
