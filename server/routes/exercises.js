// Router Express
import { Router } from 'express';
// Modèle exercice
import Exercise from '../models/Exercise.js';
// Modèle utilisateur
import User from '../models/User.js';
// Middlewares de sécurité
import { requireAuth, requireSubscription, requireRole } from '../middleware/auth.js';
// Réception des fichiers (photo ou PDF)
import { uploadDoc } from '../middleware/upload.js';
// Rangement des fichiers (disque ou S3)
import { persist, removeStored, sendStored } from '../services/storage.js';

// Crée le groupe de routes
const r = Router();
// Connexion obligatoire ET abonnement actif pour un élève (un élève expiré est bloqué partout)
r.use(requireAuth, requireSubscription);

// Transforme un fichier reçu en description à stocker
const fileInfo = (f) => ({ name: f.filename, originalName: f.originalname, mime: f.mimetype });
// Ajoute les infos de l'élève et du professeur aux exercices trouvés
const populate = (q) => q.populate('student', 'fullName classe photo').populate('teacher', 'fullName subject photo').sort({ createdAt: -1 });

// POST /api/exercises : l'élève envoie une photo ou un PDF au professeur de son choix
r.post('/', requireRole('student'), uploadDoc.single('file'), persist('docs'), async (req, res) => {
  const { teacherId, subject } = req.body; // professeur et matière choisis
  const bad = (m) => { removeStored('docs', req.file?.filename); return res.status(400).json({ message: m }); }; // refuse et supprime le fichier
  if (!req.file) return bad('Fichier requis (photo ou PDF)'); // aucun fichier reçu
  const t = await User.findOne({ _id: teacherId, role: 'teacher', status: 'approved' }).catch(() => null); // professeur valide ?
  if (!t) return bad('Professeur introuvable'); // professeur inconnu
  if (subject && subject !== t.subject) return bad('Ce professeur n’enseigne pas cette matière'); // matière incohérente
  const ex = await Exercise.create({ student: req.user._id, teacher: t._id, subject: t.subject, file: fileInfo(req.file) }); // statut « pending » par défaut
  res.status(201).json(ex); // renvoie l'exercice créé
});

// GET /api/exercises/mine : exercices envoyés par l'élève et corrections reçues
r.get('/mine', requireRole('student'), async (req, res) => res.json(await populate(Exercise.find({ student: req.user._id }))));
// GET /api/exercises/todo : exercices que le professeur doit corriger
r.get('/todo', requireRole('teacher'), async (req, res) => res.json(await populate(Exercise.find({ teacher: req.user._id, status: 'pending' }))));
// GET /api/exercises/done : corrections déjà envoyées par le professeur
r.get('/done', requireRole('teacher'), async (req, res) => res.json(await populate(Exercise.find({ teacher: req.user._id, status: 'corrected' }))));

// POST /api/exercises/:id/correction : le professeur renvoie sa correction (photo ou PDF)
r.post('/:id/correction', requireRole('teacher'), uploadDoc.single('file'), persist('docs'), async (req, res) => {
  const ex = await Exercise.findOne({ _id: req.params.id, teacher: req.user._id }).catch(() => null); // seulement SES exercices
  if (!ex || !req.file) { removeStored('docs', req.file?.filename); return res.status(400).json({ message: 'Exercice introuvable ou fichier manquant' }); } // refus
  if (ex.correction?.file) removeStored('docs', ex.correction.file.name); // supprime une ancienne correction
  ex.correction = { file: fileInfo(req.file), comment: (req.body.comment || '').slice(0, 500), date: new Date() }; // enregistre la correction
  ex.status = 'corrected'; // l'exercice passe à « corrigé »
  await ex.save(); // enregistre
  res.json(ex); // renvoie l'exercice mis à jour
});

// Envoie un fichier (exercice ou correction) à la personne autorisée ; ?download=1 force le téléchargement
async function sendDoc(req, res, which) {
  const ex = await Exercise.findById(req.params.id).catch(() => null); // cherche l'exercice
  const ok = ex && (req.user.role === 'admin' || String(ex.student) === String(req.user._id) || String(ex.teacher) === String(req.user._id)); // droit d'accès
  const f = which === 'file' ? ex?.file : ex?.correction?.file; // quel fichier : exercice ou correction
  if (!ok || !f) return res.status(404).json({ message: 'Fichier introuvable' }); // interdit ou absent
  await sendStored(res, 'docs', f.name, { mime: f.mime, filename: f.originalName || f.name, download: !!req.query.download }); // envoie le fichier (disque ou S3)
}
// GET /api/exercises/:id/file : fichier de l'exercice
r.get('/:id/file', (req, res) => sendDoc(req, res, 'file'));
// GET /api/exercises/:id/correction/file : fichier de la correction
r.get('/:id/correction/file', (req, res) => sendDoc(req, res, 'correction'));

// Exporte le groupe de routes
export default r;
