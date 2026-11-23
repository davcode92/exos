// React et son outil d'affichage dans la page
import React from 'react';
import { createRoot } from 'react-dom/client';
// Gère les adresses (/login, /dashboard…) sans recharger la page
import { BrowserRouter } from 'react-router-dom';
// Fournit l'utilisateur connecté à toute l'application
import { AuthProvider } from './AuthContext.jsx';
// Composant principal qui contient toutes les pages
import App from './App.jsx';
// Feuille de style globale
import './styles.css';

// Affiche l'application dans la balise « root » de index.html
createRoot(document.getElementById('root')).render(
  <React.StrictMode>{/* Active des vérifications utiles en développement */}
    <BrowserRouter>{/* Active la navigation entre pages */}
      <AuthProvider>{/* Donne accès à l'utilisateur connecté partout */}
        <App />{/* L'application */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
