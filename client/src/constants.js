// Classes proposées à l'inscription, de la 6e à la Terminale
export const CLASSES = ['6e', '5e', '4e', '3e', '2nde', '1ère', 'Terminale'];
// Matières enseignées
export const SUBJECTS = ['Maths', 'Français', 'Physique', 'Chimie', 'SVT', 'Anglais', 'Histoire-Géo'];
// Prix de l'abonnement affiché (le vrai prix est fixé côté serveur)
export const PRICE = '3 000 FCFA';
// Numéro WhatsApp pour les réclamations, au format international SANS « + » ni espaces
// (Gabon : 241 + numéro local). Peut être remplacé dans le fichier .env avec VITE_WHATSAPP_NUMBER
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '24174044999';
