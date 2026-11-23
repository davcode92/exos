// Limiteur simple en mémoire (valable pour un seul serveur) : évite les abus et les coûts de SMS inutiles
const hits = new Map(); // historique des appels par clé

// Renvoie true si la clé dépasse « max » appels pendant « windowMs » millisecondes
export function tooMany(key, max, windowMs) {
  const now = Date.now(); // heure actuelle
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs); // appels encore dans la fenêtre
  recent.push(now); // ajoute cet appel
  hits.set(key, recent); // enregistre
  return recent.length > max; // true = trop d'appels
}

// Nettoyage toutes les 10 minutes pour ne pas remplir la mémoire
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 3600000)) hits.delete(k); }, 600000).unref();
