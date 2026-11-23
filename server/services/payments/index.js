// Les deux opérateurs disponibles
import airtel from './airtel.js';
import moov from './moov.js';
// Liste des opérateurs par leur nom
export const providers = { airtel, moov };

// Demande un paiement à l'opérateur choisi
export async function requestPayment(operator, data) {
  if (process.env.PAYMENT_MODE === 'simulated') return { providerRef: 'SIM-' + data.reference }; // mode test : aucun vrai débit
  return providers[operator].collect(data); // mode réel : appelle Airtel ou Moov
}
