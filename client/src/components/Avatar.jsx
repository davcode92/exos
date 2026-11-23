// Adresse complète d'une photo de profil
import { photoUrl } from '../api.js';

// Rond avec la photo (ou l'initiale) et, si demandé, un point vert « en ligne »
export default function Avatar({ user, size = 48, dot = false }) {
  const src = photoUrl(user?.photo); // adresse de la photo (ou null)
  const initial = (user?.fullName || '?').trim()[0]?.toUpperCase(); // première lettre du nom
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size / 2.4 }}>{/* conteneur rond */}
      {src ? <img src={src} alt="" /> : initial}{/* photo si elle existe, sinon l'initiale */}
      {dot && <i className={'dot' + (user?.online ? ' on' : '')} />}{/* point vert si la personne est en ligne */}
    </span>
  );
}
