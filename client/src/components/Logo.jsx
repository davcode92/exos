// Petit logo rond EXOS (crayons croisés)
export default function Logo({ size = 62, center = false }) {
  return (
    <img // l'image du logo
      src="/logo-round.jpg" // fichier rangé dans le dossier public
      alt="EXOS" // texte alternatif
      style={{ width: size, height: size, borderRadius: '50%', display: 'block', margin: center ? '8px auto' : 0 }} // rond, centré si demandé
    />
  );
}
