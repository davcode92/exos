// Outil de configuration de Vite
import { defineConfig } from 'vite';
// Plugin qui permet à Vite de comprendre React (JSX)
import react from '@vitejs/plugin-react';

// Adresse du serveur EXOS en développement
const API = 'http://localhost:5000';

// Exporte la configuration
export default defineConfig({
  plugins: [react()], // active React
  server: {
    proxy: {
      '/api': API, // les appels /api partent vers le serveur
      '/photos': API, // les photos de profil aussi
      '/socket.io': { target: API, ws: true }, // le chat temps réel (WebSocket)
    },
  },
});
