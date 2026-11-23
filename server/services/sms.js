// Envoi de SMS : « console » (test, affiche dans le terminal) ou « twilio » (vrais SMS)

// Met un numéro au format international (+241…) attendu par les fournisseurs de SMS
export function toE164(phone) {
  let p = String(phone).replace(/[\s.-]/g, ''); // retire espaces, points et tirets
  if (p.startsWith('+')) return p; // déjà au format international
  if (p.startsWith('00')) return '+' + p.slice(2); // 00241… devient +241…
  const cc = process.env.SMS_COUNTRY_CODE || '241'; // indicatif du pays (Gabon : 241)
  if (p.startsWith(cc)) return '+' + p; // 241… devient +241…
  if (process.env.SMS_STRIP_LEADING_ZERO === 'true' && p.startsWith('0')) p = p.slice(1); // option : retire le 0 initial
  return '+' + cc + p; // numéro local : on ajoute l'indicatif
}

// Envoi via Twilio (API REST, sans bibliothèque supplémentaire)
async function viaTwilio(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID; // identifiant du compte Twilio
  const token = process.env.TWILIO_AUTH_TOKEN; // mot de passe secret Twilio
  if (!sid || !token) throw new Error('Twilio non configuré'); // clés absentes
  const params = new URLSearchParams({ To: to, Body: body }); // destinataire et texte
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) params.set('MessagingServiceSid', process.env.TWILIO_MESSAGING_SERVICE_SID); // service de messagerie (facultatif)
  else params.set('From', process.env.SMS_SENDER || 'EXOS'); // sinon nom d'expéditeur (ou numéro Twilio)
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, { // appel à Twilio
    method: 'POST', // méthode POST
    headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' }, // identification
    body: params, // contenu
  });
  const data = await res.json().catch(() => ({})); // réponse de Twilio
  if (!res.ok) throw new Error('SMS refusé : ' + (data.message || res.status)); // erreur renvoyée par Twilio
}

// Fonction utilisée par le reste du code : sendSms(téléphone, texte)
export async function sendSms(phone, text) {
  const provider = process.env.SMS_PROVIDER || 'console'; // « console » ou « twilio »
  if (provider === 'twilio') return viaTwilio(toE164(phone), text); // vrai envoi
  console.log(`[SMS de test -> ${phone}] ${text}`); // mode test : affiché dans le terminal
}
