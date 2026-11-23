// Pour fabriquer des références aléatoires
import crypto from 'crypto';
// Router Express
import { Router } from 'express';
// Modèles
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
// Sécurité
import { requireAuth, requireRole } from '../middleware/auth.js';
// Opérateurs de paiement
import { requestPayment, providers } from '../services/payments/index.js';

// Crée le groupe de routes
const r = Router();

// Ajoute 30 jours d'abonnement (cumulés si l'abonnement est encore actif)
async function activate(userId) {
  const sub = await Subscription.findOne({ user: userId }); // abonnement actuel
  const start = sub && sub.endDate > new Date() ? sub.endDate : new Date(); // départ : fin actuelle ou maintenant
  const endDate = new Date(start.getTime() + 30 * 24 * 3600 * 1000); // +30 jours
  await Subscription.findOneAndUpdate({ user: userId }, { endDate }, { upsert: true }); // enregistre (crée si absent)
  return endDate; // nouvelle date de fin
}
// Marque un paiement réussi ou échoué (une seule fois)
async function settle(payment, success) {
  if (payment.status !== 'pending') return; // déjà traité : un callback répété ne prolonge pas deux fois
  payment.status = success ? 'success' : 'failed'; // nouveau statut
  await payment.save(); // enregistre
  if (success) await activate(payment.user); // paiement réussi : +30 jours
}

// POST /api/payments/initiate : l'élève choisit Airtel ou Moov et son numéro
r.post('/initiate', requireAuth, requireRole('student'), async (req, res) => {
  const { operator, phone } = req.body; // choix de l'élève
  if (!providers[operator] || !phone) return res.status(400).json({ message: 'Opérateur et numéro requis' }); // données manquantes
  const payment = await Payment.create({ // crée le paiement « en attente »
    user: req.user._id, amount: Number(process.env.PRICE_FCFA || 3000), operator, phone, // qui, combien, comment
    reference: 'EXOS-' + crypto.randomBytes(5).toString('hex').toUpperCase(), // référence unique
  });
  try {
    const { providerRef } = await requestPayment(operator, { phone, amount: payment.amount, reference: payment.reference }); // demande à l'opérateur
    payment.providerRef = providerRef; // garde la référence de l'opérateur
    await payment.save(); // enregistre
    res.status(201).json({ reference: payment.reference, amount: payment.amount, status: payment.status }); // renvoie la référence
  } catch (e) {
    await settle(payment, false); // échec : paiement marqué « failed »
    res.status(502).json({ message: e.message }); // message d'erreur
  }
});

// GET /api/payments/status/:reference : l'interface demande régulièrement si le paiement est confirmé
r.get('/status/:reference', requireAuth, async (req, res) => {
  const p = await Payment.findOne({ reference: req.params.reference, user: req.user._id }); // SON paiement seulement
  if (!p) return res.status(404).json({ message: 'Paiement introuvable' }); // inconnu
  res.json({ status: p.status }); // pending, success ou failed
});

// POST /api/payments/simulate/:reference : confirmation fictive (mode test uniquement)
r.post('/simulate/:reference', requireAuth, async (req, res) => {
  if (process.env.PAYMENT_MODE !== 'simulated') return res.status(404).end(); // interdit en mode réel
  const p = await Payment.findOne({ reference: req.params.reference, user: req.user._id }); // son paiement
  if (!p) return res.status(404).json({ message: 'Paiement introuvable' }); // inconnu
  await settle(p, true); // confirme le paiement
  res.json({ status: p.status }); // nouveau statut
});

// POST /api/payments/webhook/:provider : confirmation envoyée par Airtel ou Moov
// À FAIRE en production : vérifier la signature officielle de l'opérateur (le mot secret est un minimum)
r.post('/webhook/:provider', async (req, res) => {
  const prov = providers[req.params.provider]; // l'opérateur concerné
  if (!prov || req.headers['x-webhook-secret'] !== process.env.WEBHOOK_SECRET) return res.status(401).end(); // refuse les inconnus
  const { reference, success } = prov.parse(req.body); // lit la confirmation
  const p = await Payment.findOne({ reference }); // retrouve le paiement
  if (p) await settle(p, success); // le traite
  res.status(200).end(); // répond « reçu » à l'opérateur
});

// Exporte le groupe de routes
export default r;
