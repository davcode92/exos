// Airtel Money (paiement par demande sur le téléphone de l'élève).
// ATTENTION : à vérifier avec la documentation officielle et le contrat marchand Airtel Gabon.
// Adresse de base de l'API Airtel (test ou production, selon le .env)
const base = () => process.env.AIRTEL_BASE_URL;
// Garde seulement les chiffres locaux du numéro (sans +241)
const local = (phone) => String(phone).replace(/^\+?241/, '').replace(/\D/g, '');

// Demande un jeton d'accès à Airtel avec nos identifiants
async function token() {
  const res = await fetch(`${base()}/auth/oauth2/token`, { // appel HTTP vers Airtel
    method: 'POST', // méthode POST
    headers: { 'Content-Type': 'application/json' }, // on envoie du JSON
    body: JSON.stringify({ client_id: process.env.AIRTEL_CLIENT_ID, client_secret: process.env.AIRTEL_CLIENT_SECRET, grant_type: 'client_credentials' }), // identifiants
  });
  const d = await res.json(); // réponse d'Airtel
  if (!d.access_token) throw new Error('Airtel : authentification refusée'); // identifiants faux
  return d.access_token; // jeton à utiliser pour payer
}

// Objet exporté : demande de paiement + lecture de la confirmation
export default {
  // Envoie la demande de paiement sur le téléphone de l'élève
  async collect({ phone, amount, reference }) {
    const res = await fetch(`${base()}/merchant/v1/payments/`, { // appel HTTP vers Airtel
      method: 'POST', // méthode POST
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}`, 'X-Country': 'GA', 'X-Currency': 'XAF' }, // en-têtes (Gabon, FCFA)
      body: JSON.stringify({
        reference: 'EXOS abonnement', // texte vu par l'élève
        subscriber: { country: 'GA', currency: 'XAF', msisdn: local(phone) }, // numéro de l'élève
        transaction: { amount, country: 'GA', currency: 'XAF', id: reference }, // montant et référence EXOS
      }),
    });
    const d = await res.json(); // réponse d'Airtel
    if (!d.status?.success) throw new Error('Airtel : demande de paiement refusée'); // refus
    return { providerRef: d.data?.transaction?.id || reference }; // référence de la transaction
  },
  // Lit la confirmation (webhook) envoyée par Airtel : référence + réussite (TS = Transaction Success)
  parse: (body) => ({ reference: body.transaction?.id, success: body.transaction?.status_code === 'TS' }),
};
