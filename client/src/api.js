// Adresse du serveur : vide en développement (le proxy Vite s'en charge), complète en ligne
export const BASE = import.meta.env.VITE_API_URL || '';
// Lit le jeton de connexion gardé dans le navigateur
export const getToken = () => localStorage.getItem('token');

// Fonction unique pour appeler l'API : api('/chemin', { method, body })
export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}; // en-têtes de la requête
  const token = getToken(); // jeton de la personne connectée
  if (token) headers.Authorization = 'Bearer ' + token; // on le joint à chaque appel
  let payload = body; // contenu envoyé
  if (body && !(body instanceof FormData)) { // si ce n'est pas un formulaire avec fichier
    headers['Content-Type'] = 'application/json'; // on envoie du JSON
    payload = JSON.stringify(body); // transformé en texte
  }
  const res = await fetch(`${BASE}/api${path}`, { method, headers, body: payload }); // appel au serveur
  const data = await res.json().catch(() => ({})); // lit la réponse (objet vide si illisible)
  if (!res.ok) { // le serveur a répondu par une erreur
    const err = new Error(data.message || 'Erreur'); // message à afficher
    err.code = data.code; // code spécial éventuel (PENDING, REJECTED)
    err.status = data.status || res.status; // numéro d'erreur HTTP
    throw err; // remonte l'erreur à l'écran
  }
  return data; // réponse en cas de succès
}

// Transforme « /photos/abc.jpg » en adresse complète utilisable dans <img>
export const photoUrl = (p) => (p ? BASE + p : null);

// Affiche ou télécharge un fichier protégé (exercice ou correction)
export async function openFile(path, name = 'fichier', download = false) {
  const win = download ? null : window.open('', '_blank'); // ouvre l'onglet tout de suite (évite le blocage mobile)
  try {
    const res = await fetch(`${BASE}/api${path}${download ? '?download=1' : ''}`, { headers: { Authorization: 'Bearer ' + getToken() } }); // demande le fichier avec le jeton
    if (!res.ok) throw new Error('Fichier introuvable'); // fichier absent ou interdit
    const url = URL.createObjectURL(await res.blob()); // fichier converti en adresse temporaire
    if (download) { // mode téléchargement
      const a = document.createElement('a'); // lien invisible
      a.href = url; // adresse du fichier
      a.download = name; // nom proposé au téléchargement
      a.click(); // déclenche le téléchargement
    } else win.location = url; // mode consultation : affiche dans l'onglet ouvert
  } catch (e) {
    win?.close(); // referme l'onglet vide
    alert(e.message); // prévient la personne
  }
}

// Récupère un fichier protégé et renvoie une adresse temporaire pour l'afficher (image ou PDF)
export async function blobUrl(path) {
  const res = await fetch(`${BASE}/api${path}`, { headers: { Authorization: 'Bearer ' + getToken() } }); // demande avec le jeton
  if (!res.ok) throw new Error('Fichier introuvable'); // absent ou interdit
  return URL.createObjectURL(await res.blob()); // adresse temporaire du fichier
}
