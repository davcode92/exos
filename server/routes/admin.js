// Router Express
import { Router } from 'express';
// Modèles
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
// Sécurité : connecté ET administrateur
import { requireAuth, requireRole } from '../middleware/auth.js';

// Crée le groupe de routes
const r = Router();
// Toutes ces routes sont réservées à l'admin
r.use(requireAuth, requireRole('admin'));

// GET /api/admin/teachers : liste des professeurs (?status=pending|approved|rejected)
r.get('/teachers', async (req, res) => {
  const q = { role: 'teacher' }; // seulement les professeurs
  if (req.query.status) q.status = req.query.status; // filtre éventuel
  res.json(await User.find(q).sort({ createdAt: -1 })); // du plus récent au plus ancien
});

// PATCH /api/admin/teachers/:id/status : accepter ou refuser un professeur
r.patch('/teachers/:id/status', async (req, res) => {
  const { status } = req.body; // « approved » ou « rejected »
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Statut invalide' }); // valeur interdite
  const t = await User.findOneAndUpdate({ _id: req.params.id, role: 'teacher' }, { status }, { new: true }); // met à jour
  if (!t) return res.status(404).json({ message: 'Professeur introuvable' }); // inconnu
  res.json(t); // renvoie le professeur mis à jour
});

// GET /api/admin/students : élèves et état de leur abonnement
r.get('/students', async (req, res) => {
  const students = await User.find({ role: 'student' }).sort({ createdAt: -1 }); // tous les élèves
  const subs = await Subscription.find({ user: { $in: students.map((s) => s._id) } }); // leurs abonnements
  const end = Object.fromEntries(subs.map((s) => [String(s.user), s.endDate])); // table « élève → date de fin »
  res.json(students.map((s) => { // pour chaque élève
    const endDate = end[String(s._id)] || null; // sa date de fin
    return { ...s.toJSON(), endDate, subscriptionActive: !!endDate && endDate > new Date() }; // + état actif ou expiré
  }));
});

// GET /api/admin/online : élèves et professeurs connectés en ce moment
r.get('/online', async (req, res) => res.json(await User.find({ online: true, role: { $in: ['student', 'teacher'] } })));

// GET /api/admin/overview : chiffres clés et montant généré par les abonnements
r.get('/overview', async (req, res) => {
  const [students, teachers, pending, activeSubs, online] = await Promise.all([ // 5 comptages en parallèle
    User.countDocuments({ role: 'student' }), // nombre d'élèves
    User.countDocuments({ role: 'teacher', status: 'approved' }), // professeurs validés
    User.countDocuments({ role: 'teacher', status: 'pending' }), // professeurs en attente
    Subscription.countDocuments({ endDate: { $gt: new Date() } }), // abonnements actifs
    User.countDocuments({ online: true, role: { $ne: 'admin' } }), // personnes en ligne
  ]);
  const ok = { $match: { status: 'success' } }; // ne compte que les paiements réussis
  const [total] = await Payment.aggregate([ok, { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }]); // total général
  const byMonth = await Payment.aggregate([ok, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, amount: { $sum: '$amount' } } }, { $sort: { _id: 1 } }]); // par mois
  const byOperator = await Payment.aggregate([ok, { $group: { _id: '$operator', amount: { $sum: '$amount' } } }]); // par opérateur
  res.json({ students, teachers, pendingTeachers: pending, activeSubscriptions: activeSubs, online, // renvoie tout
    revenue: { total: total?.amount || 0, payments: total?.count || 0, byMonth, byOperator } });
});

// GET /api/admin/payments : 100 derniers paiements
r.get('/payments', async (req, res) => res.json(await Payment.find().populate('user', 'fullName phone').sort({ createdAt: -1 }).limit(100)));

// Exporte le groupe de routes
export default r;
