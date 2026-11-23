// Outils React pour partager des données dans toute l'application
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
// Client Socket.io : chat et présence en temps réel
import { io } from 'socket.io-client';
// Appels API et adresse du serveur
import { api, BASE, getToken } from './api.js';

// « Boîte » qui contiendra l'utilisateur connecté
const Ctx = createContext(null);
// Raccourci pour lire cette boîte dans n'importe quelle page : const { user } = useAuth()
export const useAuth = () => useContext(Ctx);
// Page d'accueil de chaque rôle après connexion
export const homeOf = (u) => (u.role === 'teacher' ? '/prof' : u.role === 'admin' ? '/admin' : '/dashboard');

// Composant qui fournit l'utilisateur à toute l'application
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // personne connectée (null = personne)
  const [active, setActive] = useState(false); // abonnement actif ? (élèves)
  const [endDate, setEndDate] = useState(null); // date de fin de l'abonnement
  const [loading, setLoading] = useState(true); // true pendant la vérification au démarrage
  const [socket, setSocket] = useState(null); // connexion temps réel

  // Recharge le profil depuis le serveur (utile après un paiement ou un changement de photo)
  const refresh = useCallback(async () => {
    if (!getToken()) { setLoading(false); return null; } // pas de jeton : personne n'est connecté
    try {
      const d = await api('/auth/me'); // demande « qui suis-je ? »
      setUser(d.user); // mémorise la personne
      setActive(d.subscriptionActive); // mémorise l'état de l'abonnement
      setEndDate(d.endDate); // mémorise la date de fin
      return d; // renvoie la réponse
    } catch {
      localStorage.removeItem('token'); // jeton invalide : on l'efface
      setUser(null); // personne n'est connecté
      return null;
    } finally { setLoading(false); } // fin du chargement dans tous les cas
  }, []);

  useEffect(() => { refresh(); }, [refresh]); // au démarrage, vérifie si une session existe

  // Ouvre la connexion temps réel quand quelqu'un est connecté, la ferme quand il part
  useEffect(() => {
    if (!user) { setSocket(null); return undefined; } // personne : pas de connexion
    const s = io(BASE || undefined, { auth: { token: getToken() } }); // connexion avec le jeton
    setSocket(s); // la partage avec les pages
    return () => s.disconnect(); // à la déconnexion, la personne passe « hors ligne »
  }, [user?._id]);

  // Enregistre la session après une connexion ou une inscription réussie
  const login = (data) => {
    localStorage.setItem('token', data.token); // garde le jeton dans le navigateur
    setUser(data.user); // mémorise la personne
    setActive(data.subscriptionActive); // mémorise l'abonnement
  };
  // Termine la session
  const logout = () => {
    localStorage.removeItem('token'); // efface le jeton
    setUser(null); // plus personne de connecté
    setActive(false); // plus d'abonnement actif en mémoire
  };

  // Met tout cela à disposition des pages
  return <Ctx.Provider value={{ user, active, endDate, loading, socket, login, logout, refresh }}>{children}</Ctx.Provider>;
}
