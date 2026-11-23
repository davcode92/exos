// Multer : lit les fichiers envoyés par les formulaires
import multer from 'multer';
// Outils pour manipuler les chemins de dossiers
import path from 'path';
// Outils pour créer/supprimer des fichiers
import fs from 'fs';
// Pour fabriquer des noms de fichiers aléatoires
import crypto from 'crypto';

// Dossier racine des fichiers envoyés
const root = path.resolve(process.env.UPLOAD_DIR || 'uploads');
// Photos de profil : dossier public
export const photoDir = path.join(root, 'photos');
// Exercices et corrections : dossier privé (jamais servi directement)
export const docDir = path.join(root, 'docs');
// Crée les deux dossiers s'ils n'existent pas
[photoDir, docDir].forEach((d) => fs.mkdirSync(d, { recursive: true }));

// Extension choisie d'après le type du fichier (évite les extensions dangereuses)
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf' };
// Fabrique un « récepteur de fichiers » pour un dossier, des types autorisés et une taille max (Mo)
const make = (dir, types, mb) => multer({
  storage: multer.diskStorage({
    destination: dir, // où ranger le fichier
    filename: (req, f, cb) => cb(null, crypto.randomBytes(12).toString('hex') + EXT[f.mimetype]), // nom aléatoire
  }),
  limits: { fileSize: mb * 1024 * 1024 }, // taille maximale
  fileFilter: (req, f, cb) => (types.includes(f.mimetype) ? cb(null, true) : cb(new Error('Type de fichier non autorisé'))), // refuse les autres types
});
// Photos de profil : images seulement, 3 Mo maximum
export const uploadPhoto = make(photoDir, ['image/jpeg', 'image/png', 'image/webp'], 3);
// Exercices et corrections : images ou PDF, 10 Mo maximum
export const uploadDoc = make(docDir, ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], 10);
