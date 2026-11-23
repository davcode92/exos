// Outils React
import { useCallback, useEffect, useState } from 'react';
// Navigation
import { Link, useNavigate } from 'react-router-dom';
// Appel API
import { api } from '../api.js';
// Session
import { useAuth } from '../AuthContext.jsx';
// Photo de profil
import Avatar from '../components/Avatar.jsx';

// Tableau de bord de l'administrateur
export default function AdminDashboard() {
  const { user, socket, logout } = useAuth(); // session
  const nav = useNavigate(); // changement de page
  const [ov, setOv] = useState(null); // chiffres clés
  const [pending, setPending] = useState([]); // professeurs à valider
  const [teachers, setTeachers] = useState([]); // professeurs validés
  const [students, setStudents] = useState([]); // élèves
  const [online, setOnline] = useState([]); // personnes connectées

  // Recharge toutes les données
  const load = useCallback(async () => {
    try {
      const [o, p, t, s, on] = await Promise.all([ // cinq appels en parallèle
        api('/admin/overview'), api('/admin/teachers?status=pending'), api('/admin/teachers?status=approved'), api('/admin/students'), api('/admin/online'),
      ]);
      setOv(o); setPending(p); setTeachers(t); setStudents(s); setOnline(on); // met à jour l'écran
    } catch { /* erreur passagère */ }
  }, []);

  // Charge au départ puis toutes les 15 secondes
  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, [load]);
  // Recharge quand quelqu'un se connecte ou se déconnecte
  useEffect(() => { if (!socket) return undefined; socket.on('presence', load); return () => socket.off('presence', load); }, [socket, load]);

  // Accepte ou refuse un professeur
  async function decide(id, status) { await api(`/admin/teachers/${id}/status`, { method: 'PATCH', body: { status } }); load(); }

  const date = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—'); // date lisible
  const fcfa = (n) => (n || 0).toLocaleString('fr-FR') + ' FCFA'; // montant lisible
  // Ouvre le chat avec une personne
  const chat = (p, sub) => nav(`/chat/${p._id}`, { state: { name: p.fullName, subtitle: sub } });

  return (
    <div>{/* conteneur */}
      <div className="topbar">{/* ligne du haut */}
        <a onClick={() => { logout(); nav('/'); }}>Déconnexion</a>{/* déconnexion */}
        <Link to="/profile">Profil</Link>{/* profil */}
      </div>
      <div className="row tight" style={{ marginTop: 10 }}>{/* en-tête */}
        <Avatar user={user} size={56} />{/* photo */}
        <div><h1 style={{ margin: 0, fontSize: 24 }}>Administration EXOS</h1><span className="muted">{user.fullName}</span></div>{/* titre et nom */}
      </div>

      {ov && (
        <>{/* chiffres clés */}
          <h2>Suivi</h2>
          <div className="card center"><div className="muted">Montant généré par les abonnements</div><div className="stat">{fcfa(ov.revenue.total)}</div><div className="muted small">{ov.revenue.payments} paiement(s)</div></div>{/* total */}
          <div className="row">{/* trois petits compteurs */}
            <div className="card center"><div className="stat">{ov.students}</div><div className="small muted">Élèves</div></div>{/* élèves */}
            <div className="card center"><div className="stat">{ov.activeSubscriptions}</div><div className="small muted">Abonnés actifs</div></div>{/* abonnés */}
            <div className="card center"><div className="stat">{ov.online}</div><div className="small muted">En ligne</div></div>{/* connectés */}
          </div>
          {ov.revenue.byMonth.map((m) => <p key={m._id} className="muted small">{m._id} : {fcfa(m.amount)}</p>)}{/* revenus par mois */}
          {ov.revenue.byOperator.map((m) => <p key={m._id} className="muted small">{m._id === 'airtel' ? 'Airtel Money' : 'Moov Money'} : {fcfa(m.amount)}</p>)}{/* revenus par opérateur */}
        </>
      )}

      <h2>Professeurs à valider</h2>{/* validation */}
      {pending.map((p) => (
        <div key={p._id} className="card item">{/* une demande */}
          <Avatar user={p} size={40} />{/* photo */}
          <div><b>{p.fullName}</b><br /><span className="muted small">{p.subject} • {(p.classes || []).join(', ')} • {p.phone}</span></div>{/* détails */}
          <div className="filebtns">
            <button className="pill ok" onClick={() => decide(p._id, 'approved')}>Valider</button>{/* accepter */}
            <button className="pill no" onClick={() => decide(p._id, 'rejected')}>Refuser</button>{/* refuser */}
          </div>
        </div>
      ))}
      {!pending.length && <p className="muted">Aucune demande en attente.</p>}{/* liste vide */}

      <h2>Professeurs</h2>{/* liste des professeurs */}
      {teachers.map((p) => (
        <div key={p._id} className="card item">{/* un professeur */}
          <Avatar user={p} size={40} dot />{/* photo + présence */}
          <div><b>{p.fullName}</b><br /><span className="muted small">{p.subject} • {p.phone}</span></div>{/* détails */}
          <button className="pill ok" onClick={() => chat(p, p.subject)}>Écrire</button>{/* ouvre le chat */}
        </div>
      ))}

      <h2>Élèves et abonnements</h2>{/* liste des élèves */}
      {students.map((s) => (
        <div key={s._id} className="card item">{/* un élève */}
          <Avatar user={s} size={40} dot />{/* photo + présence */}
          <div><b>{s.fullName}</b> • {s.classe}<br /><span className="muted small">{s.phone} • jusqu'au {date(s.endDate)}</span></div>{/* détails */}
          <div className="filebtns">
            <span className={'pill ' + (s.subscriptionActive ? 'ok' : 'no')}>{s.subscriptionActive ? 'Actif' : 'Expiré'}</span>{/* état de l'abonnement */}
            <button className="pill ok" onClick={() => chat(s, `Élève ${s.classe}`)}>Écrire</button>{/* ouvre le chat */}
          </div>
        </div>
      ))}
      {!students.length && <p className="muted">Aucun élève inscrit.</p>}{/* liste vide */}

      <h2>Connectés en ce moment</h2>{/* présence */}
      {online.map((p) => <p key={p._id}><span className="live">●</span> {p.fullName} <span className="muted small">({p.role === 'teacher' ? 'professeur' : 'élève'})</span></p>)}{/* personnes en ligne */}
      {!online.length && <p className="muted">Personne n'est connecté.</p>}{/* liste vide */}
    </div>
  );
}
