// Lien vers l'accueil
import { Link } from 'react-router-dom';

// Écran affiché au professeur tant que l'admin n'a pas validé son compte
export default function Pending() {
  return (
    <div className="center">{/* conteneur centré */}
      <h1>Compte en attente ⏳</h1>{/* titre */}
      <p className="sub">Un administrateur doit valider ton compte professeur</p>{/* explication */}
      <p className="muted">Tu pourras te connecter dès que ton compte sera validé. Aucun abonnement n'est demandé aux professeurs.</p>{/* précision */}
      <Link to="/" className="btn" style={{ textDecoration: 'none' }}>Retour à l'accueil</Link>{/* retour */}
    </div>
  );
}
