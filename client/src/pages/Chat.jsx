// Outils React
import { useEffect, useRef, useState } from 'react';
// Paramètres d'adresse, état de navigation et navigation
import { useLocation, useNavigate, useParams } from 'react-router-dom';
// Appel API
import { api } from '../api.js';
// Logo EXOS
import Logo from '../components/Logo.jsx';
// Session
import { useAuth, homeOf } from '../AuthContext.jsx';

// Chat texte uniquement (pas de photo, vidéo ni message vocal) avec flèche de retour
export default function Chat() {
  const { userId } = useParams(); // personne avec qui on discute
  const { state } = useLocation(); // nom et sous-titre transmis par la page précédente
  const { user, socket } = useAuth(); // session et connexion temps réel
  const nav = useNavigate(); // changement de page
  const [msgs, setMsgs] = useState([]); // messages affichés
  const [text, setText] = useState(''); // message en cours d'écriture
  const [err, setErr] = useState(''); // erreur
  const bottom = useRef(null); // repère en bas de la liste (pour faire défiler)

  // Charge l'historique de la conversation
  useEffect(() => { api('/chat/' + userId).then(setMsgs).catch((e) => setErr(e.message)); }, [userId]);

  // Reçoit les nouveaux messages en direct
  useEffect(() => {
    if (!socket) return undefined; // pas encore connecté
    const onMsg = (m) => { if (m.from === userId) setMsgs((l) => [...l, m]); }; // ajoute si le message vient de cette personne
    socket.on('message', onMsg); // écoute
    return () => socket.off('message', onMsg); // arrête d'écouter en quittant
  }, [socket, userId]);

  // Fait défiler vers le dernier message
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  // Envoie un message
  function send(e) {
    e.preventDefault(); // pas de rechargement
    const t = text.trim(); // texte nettoyé
    if (!t || !socket) return; // rien à envoyer
    socket.emit('message', { to: userId, text: t }, (ack) => { // envoie au serveur
      if (ack?.ok) { setMsgs((l) => [...l, ack.message]); setText(''); setErr(''); } // succès : affiche et vide le champ
      else setErr(ack?.error || 'Envoi impossible'); // échec : affiche la raison
    });
  }

  const time = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); // heure lisible

  return (
    <div>{/* conteneur */}
      <div className="row tight">{/* en-tête */}
        <a className="back" onClick={() => nav(homeOf(user))}>←</a>{/* flèche : retour au tableau de bord */}
        <Logo size={44} />{/* logo EXOS */}
        <div>
          <b style={{ color: 'var(--navy)', fontSize: 19 }}>{state?.name ? `Chat avec ${state.name}` : 'Chat EXOS'}</b><br />{/* nom */}
          <span className="muted">{state?.subtitle || ''}</span>{/* matière ou classe */}
        </div>
      </div>
      <div className="msgs">{/* liste des messages */}
        {msgs.map((m) => (
          <div key={m._id} className={'msg' + (m.from === user._id ? ' me' : '')}>{/* mes messages à droite */}
            <div className="bubble">{m.text}</div>{/* le texte (jamais interprété comme du HTML) */}
            <small>{time(m.createdAt)}</small>{/* heure */}
          </div>
        ))}
        <div ref={bottom} />{/* repère de défilement */}
      </div>
      {err && <p className="error">{err}</p>}{/* erreur éventuelle */}
      <form className="composer" onSubmit={send}>{/* barre d'écriture */}
        <input value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message…" />{/* champ texte seulement */}
        <button className="btn green">Envoyer</button>{/* bouton */}
      </form>
    </div>
  );
}
