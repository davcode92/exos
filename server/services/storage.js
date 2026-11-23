// Stockage des fichiers : « local » (disque du serveur) ou « s3 » (Cloudflare R2, AWS S3, Backblaze B2…)
import fs from 'fs'; // lecture et suppression de fichiers
import path from 'path'; // chemins de fichiers
import { photoDir, docDir } from '../middleware/upload.js'; // dossiers locaux

const dirs = { photos: photoDir, docs: docDir }; // dossier local de chaque type de fichier
const driver = () => process.env.STORAGE_DRIVER || 'local'; // « local » ou « s3 »
const NAME = /^[a-f0-9]{24}\.(jpg|png|webp|pdf)$/; // seuls les noms créés par le serveur sont acceptés (sécurité)
const MIME = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' }; // type selon l'extension

let s3; // connexion S3 (créée une seule fois)
// Prépare la connexion au stockage S3 (la bibliothèque n'est chargée que si on en a besoin)
async function getS3() {
  if (!s3) {
    const sdk = await import('@aws-sdk/client-s3'); // charge la bibliothèque S3
    s3 = { sdk, client: new sdk.S3Client({
      region: process.env.S3_REGION || 'auto', // région (« auto » pour Cloudflare R2)
      endpoint: process.env.S3_ENDPOINT || undefined, // adresse du service (R2, B2…) ; vide pour AWS
      forcePathStyle: !!process.env.S3_ENDPOINT, // nécessaire pour les services compatibles S3
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY }, // clés d'accès
    }) };
  }
  return s3;
}

// Middleware à placer APRÈS multer : envoie le fichier reçu vers S3 puis supprime la copie locale
export const persist = (kind) => async (req, res, next) => {
  try {
    if (!req.file || driver() !== 's3') return next(); // mode local : le fichier est déjà bien rangé
    const { sdk, client } = await getS3(); // connexion S3
    await client.send(new sdk.PutObjectCommand({ // envoie le fichier
      Bucket: process.env.S3_BUCKET, // nom du « bucket » (espace de stockage)
      Key: `${kind}/${req.file.filename}`, // chemin dans le bucket
      Body: fs.createReadStream(req.file.path), // contenu du fichier
      ContentType: req.file.mimetype, // type du fichier
    }));
    fs.unlink(req.file.path, () => {}); // supprime la copie temporaire du serveur
    next(); // suite du traitement
  } catch (e) { fs.unlink(req.file?.path || '', () => {}); next(e); } // en cas d'erreur : nettoie et signale
};

// Supprime un fichier stocké (photo ou document)
export async function removeStored(kind, name) {
  if (!name || !NAME.test(name)) return; // nom invalide : rien à faire
  try {
    if (driver() === 's3') { // stockage S3
      const { sdk, client } = await getS3(); // connexion
      await client.send(new sdk.DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: `${kind}/${name}` })); // supprime
    } else fs.unlink(path.join(dirs[kind], name), () => {}); // stockage local
  } catch (e) { console.error('Suppression impossible :', e.message); } // erreur non bloquante
}

// Envoie un fichier stocké dans la réponse HTTP (affichage ou téléchargement)
export async function sendStored(res, kind, name, { mime, filename, download = false, cache = false } = {}) {
  try {
    if (!NAME.test(name)) return res.status(404).json({ message: 'Fichier introuvable' }); // nom suspect : refus
    res.setHeader('Content-Type', mime || MIME[path.extname(name)]); // type du fichier
    if (filename) res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(filename)}"`); // afficher ou télécharger
    res.setHeader('Cache-Control', cache ? 'public, max-age=86400' : 'private, no-store'); // photos : cache d'un jour ; documents : jamais
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // autorise l'affichage depuis le site React
    if (driver() === 's3') { // stockage S3 : on relaie le fichier
      const { sdk, client } = await getS3(); // connexion
      const out = await client.send(new sdk.GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: `${kind}/${name}` })); // télécharge depuis S3
      out.Body.pipe(res); // envoie au navigateur
    } else res.sendFile(path.join(dirs[kind], name)); // stockage local
  } catch { if (!res.headersSent) res.status(404).json({ message: 'Fichier introuvable' }); } // fichier absent
}
