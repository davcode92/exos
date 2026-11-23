// Outils React
import { useCallback, useEffect, useState } from 'react';
// Navigation
import { Link, useNavigate } from 'react-router-dom';
// Appel API
import { api } from '../api.js';
// Session
import { useAuth } from '../AuthContext.jsx';
// Composants
import Avatar from '../components/Avatar.jsx';
import FileButtons from '../components/FileButtons.jsx';
// Contact WhatsApp pour les réclamations
import WhatsAppButton from '../components/WhatsAppButton.jsx';

// Tableau de bord du professeur
export default function TeacherDashboard() {
  const { user, socket, logout } = useAuth(); // session
  const nav = useNavigate(); // changement de page
  const [students, setStudents] = useState([]); // élèves en ligne
  const [todo, setTodo] = useState([]); // exercices à corriger
  const [done, setDone] = useState([]); // corrections envoyées

  // Recharge les trois listes
  const load = useCallback(async () => {
    try {
      const [s, t, d] = await Promise.all([api('/users/online'), api('/exercises/todo'), api('/exercises/done')]); // trois appels en parallèle
      setStudents(s); setTodo(t); setDone(d); // met à jour l'écran
    } catch { /* erreur passagère */ }
  }, []);

  // Charge au départ puis toutes les 15 secondes
  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, [load]);
  // Recharge quand quelqu'un se connecte ou se déconnecte
  useEffect(() => { if (!socket) return undefined; socket.on('presence', load); return () => socket.off('presence', load); }, [socket, load]);

  const date = (d) => new Date(d).toLocaleDateString('fr-FR'); // date lisible

  return (
    <div>{/* conteneur */}
      <div className="topbar">{/* ligne du haut */}
        <a onClick={() => { logout(); nav('/'); }}>Déconnexion</a>{/* déconnexion */}
        <Link to="/profile">Profil</Link>{/* modifier nom et photo */}
      </div>
      <div className="row tight" style={{ marginTop: 10 }}>{/* en-tête */}
        <Avatar user={{ ...user, online: true }} size={64} dot />{/* ma photo + point vert */}
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Espace professeur</h1>{/* titre */}
          <div className="muted">{user.fullName} • {user.subject} • <span className="live">● En ligne</span></div>{/* identité et présence */}
        </div>
      </div>

      <h2>Élèves en ligne</h2>{/* section élèves */}
      <div className="scroll">
        {students.map((s) => (
          <div key={s._id} className="card person" onClick={() => nav(`/chat/${s._id}`, { state: { name: s.fullName, subtitle: `Élève ${s.classe}` } })}>{/* touche = ouvre le chat */}
            <Avatar user={s} size={48} dot />{/* photo + présence */}
            <div><b>{s.fullName}</b></div>{/* nom */}
            <div className="live">en ligne • {s.classe}</div>{/* classe */}
          </div>
        ))}
        {!students.length && <p className="muted">Aucun élève en ligne.</p>}{/* liste vide */}
      </div>

      <h2>Exercices à corriger</h2>{/* section exercices */}
      {todo.map((x) => (
        <div key={x._id} className="card item">{/* un exercice */}
          <div><b>{x.file?.originalName}</b><br /><span className="muted small">{x.student?.fullName} • {x.student?.classe} • {date(x.createdAt)}</span></div>{/* détails */}
          <div className="filebtns">
            <FileButtons path={`/exercises/${x._id}/file`} name={x.file?.originalName} />{/* ouvrir / télécharger l'exercice */}
            <Link className="pill ok" to={`/prof/correct/${x._id}`} style={{ textDecoration: 'none' }}>Corriger ›</Link>{/* écran de correction */}
          </div>
        </div>
      ))}
      {!todo.length && <p className="muted">Aucun exercice à corriger 🎉</p>}{/* liste vide */}

      <h2>Corrections envoyées</h2>{/* section corrections */}
      {done.map((x) => (
        <div key={x._id} className="card item">{/* une correction */}
          <div>✅ <b>{x.student?.fullName}</b> • {x.subject}<br /><span className="muted small">{x.correction?.comment || 'Corrigé'} • {date(x.correction?.date)}</span></div>{/* détails */}
          <FileButtons path={`/exercises/${x._id}/correction/file`} name={x.correction?.file?.originalName} />{/* revoir la correction */}
        </div>
      ))}
      {!done.length && <p className="muted">Aucune pour l'instant.</p>}{/* liste vide */}
      <WhatsAppButton variant="float" />{/* bulle flottante : réclamation WhatsApp */}
    </div>
  );
}
