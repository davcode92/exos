// Moov Money : l'API dépend du contrat signé avec Moov Africa Gabon (ou un agrégateur).
// À ADAPTER avec la documentation fournie par Moov. Variables : MOOV_BASE_URL et MOOV_API_KEY.
export default {
  // Envoie la demande de paiement sur le téléphone de l'élève
  async collect({ phone, amount, reference }) {
    if (!process.env.MOOV_BASE_URL || !process.env.MOOV_API_KEY) throw new Error('Moov Money non configuré'); // clés absentes
    const res = await fetch(`${process.env.MOOV_BASE_URL}/collect`, { // TODO : vrai chemin selon la doc Moov
      method: 'POST', // méthode POST
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MOOV_API_KEY}` }, // clé d'accès
      body: JSON.stringify({ msisdn: phone, amount, currency: 'XAF', reference }), // TODO : champs selon la doc Moov
    });
    const d = await res.json(); // réponse de Moov
    if (!res.ok) throw new Error('Moov : demande de paiement refusée'); // refus
    return { providerRef: d.id || reference }; // référence de la transaction
  },
  // Lit la confirmation (webhook) de Moov — TODO : adapter aux champs réels
  parse: (body) => ({ reference: body.reference, success: body.status === 'success' }),
};
