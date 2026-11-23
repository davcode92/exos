// Session (pour pré-remplir le message avec le nom et le téléphone)
import { useAuth } from '../AuthContext.jsx';
// Numéro WhatsApp de réclamation
import { WHATSAPP_NUMBER } from '../constants.js';

// Noms des rôles pour le message
const ROLE = { student: 'élève', teacher: 'professeur', admin: 'admin' };

// Bouton « Réclamation WhatsApp » : variant="link" (texte) ou variant="float" (bulle flottante)
export default function WhatsAppButton({ variant = 'link', label }) {
  const { user } = useAuth(); // personne connectée (ou null)
  const who = user ? ` Nom : ${user.fullName}. Téléphone : ${user.phone}. Rôle : ${ROLE[user.role]}.` : ''; // informations ajoutées au message
  const text = `Bonjour EXOS, j'ai une réclamation.${who}`; // message pré-écrit (la personne peut le modifier avant d'envoyer)
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`; // lien qui ouvre WhatsApp avec le message
  if (variant === 'float') // bulle flottante
    return <a className="wa-float" href={href} target="_blank" rel="noopener noreferrer" aria-label="Réclamation sur WhatsApp">💬</a>; // ouvre WhatsApp dans un nouvel onglet
  return ( // lien texte
    <p className="center">{/* centré */}
      <a className="wa-link" href={href} target="_blank" rel="noopener noreferrer">💬 {label || 'Une réclamation ? Écris-nous sur WhatsApp'}</a>{/* ouvre WhatsApp */}
    </p>
  );
}
