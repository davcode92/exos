// Fonction qui ouvre ou télécharge un fichier protégé
import { openFile } from '../api.js';

// Deux boutons : « Voir » (consulter) et « Télécharger » (enregistrer sur le téléphone)
export default function FileButtons({ path, name }) {
  return (
    <span className="filebtns">{/* conteneur des deux boutons */}
      <button className="pill ok" onClick={() => openFile(path, name, false)}>Voir</button>{/* consulter directement */}
      <button className="pill ok" onClick={() => openFile(path, name, true)}>⬇</button>{/* télécharger */}
    </span>
  );
}
