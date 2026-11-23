// Outils React
import { useEffect, useState } from 'react';
// Navigation
import { useNavigate } from 'react-router-dom';
// Appel API
import { api } from '../api.js';
// Session
import { useAuth } from '../AuthContext.jsx';
// Contact WhatsApp pour les réclamations
import WhatsAppButton from '../components/WhatsAppButton.jsx';
// Prix affiché
import { PRICE } from '../constants.js';

// Paiement de l'abonnement mensuel par Airtel Money ou Moov Money
export default function Pay() {
  const { active, refresh, logout } = useAuth(); // état de l'abonnement et fonctions de session
  const nav = useNavigate(); // changement de page
  const [operator, setOperator] = useState('airtel'); // opérateur choisi
  const [phone, setPhone] = useState(''); // numéro Mobile Money
  const [ref, setRef] = useState(null); // référence du paiement en cours
  const [err, setErr] = useState(''); // erreur
  const [busy, setBusy] = useState(false); // demande en cours

  // Si l'abonnement est déjà actif, on va directement au tableau de bord
  useEffect(() => { if (active) nav('/dashboard', { replace: true }); }, [active]);

  // Tant qu'un paiement est en attente, demande son statut toutes les 3 secondes
  useEffect(() => {
    if (!ref) return undefined; // pas de paiement en cours
    const started = Date.now(); // heure de départ
    const id = setInterval(async () => {
      try {
        const { status } = await api('/payments/status/' + ref); // statut du paiement
        if (status === 'success') { clearInterval(id); await refresh(); } // payé : on recharge le profil (l'effet ci-dessus redirige)
        else if (status === 'failed' || Date.now() - started > 120000) { // échec ou plus de 2 minutes
          clearInterval(id); setRef(null); setErr('Paiement non confirmé. Réessaie.'); // on arrête
        }
      } catch { /* erreur réseau passagère : on réessaie au prochain tour */ }
    }, 3000);
    return () => clearInterval(id); // arrête la vérification en quittant la page
  }, [ref]);

  // Lance la demande de paiement
  async function pay(e) {
    e.preventDefault(); // pas de rechargement
    setErr(''); setBusy(true); // prépare
    try { setRef((await api('/payments/initiate', { method: 'POST', body: { operator, phone } })).reference); } // reçoit la référence
    catch (e2) { setErr(e2.message); } // affiche l'erreur
    finally { setBusy(false); } // débloque le bouton
  }

  return (
    <form onSubmit={pay}>{/* formulaire */}
      <h1>Abonnement</h1>{/* titre */}
      <p className="sub">Active ton compte pour accéder à EXOS</p>{/* explication */}
      <div className="card center"><div className="muted">Abonnement mensuel</div><div className="stat">{PRICE}</div><div className="muted small">par mois • profs, corrections et chat inclus</div></div>{/* prix */}
      <label>Moyen de paiement</label>{/* choix de l'opérateur */}
      <select value={operator} onChange={(e) => setOperator(e.target.value)} disabled={!!ref}>
        <option value="airtel">Airtel Money</option>{/* Airtel */}
        <option value="moov">Moov Money</option>{/* Moov */}
      </select>
      <label>Numéro Mobile Money</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+241 07 00 00 00" inputMode="tel" required disabled={!!ref} />{/* numéro */}
      {err && <p className="error">{err}</p>}{/* erreur éventuelle */}
      {ref ? (
        <>{/* paiement en attente */}
          <p className="ok-msg">Valide le paiement sur ton téléphone avec ton code secret. Référence : {ref}</p>{/* consigne */}
          {import.meta.env.VITE_SIMULATE === 'true' && ( // bouton de test, caché en production
            <button type="button" className="btn outline" onClick={() => api('/payments/simulate/' + ref, { method: 'POST' })}>Démo : simuler la confirmation</button>
          )}
        </>
      ) : <button className="btn green" disabled={busy}>{busy ? 'Envoi…' : `Payer ${PRICE}`}</button>}{/* bouton payer */}
      <WhatsAppButton label="Problème de paiement ? Écris-nous sur WhatsApp" />{/* aide en cas de souci de paiement */}
      <p className="center"><a onClick={() => { logout(); nav('/'); }}>← Quitter</a></p>{/* déconnexion */}
    </form>
  );
}
