// Définition des routes (adresses → pages)
import { Routes, Route, Navigate } from 'react-router-dom';
// Protection des pages
import Guard from './components/Guard.jsx';
// Pages communes
import Welcome from './pages/Welcome.jsx';
import Login from './pages/Login.jsx';
import Reset from './pages/Reset.jsx';
import Profile from './pages/Profile.jsx';
import Chat from './pages/Chat.jsx';
// Pages élève
import Signup from './pages/Signup.jsx';
import Pay from './pages/Pay.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import CorrectionView from './pages/CorrectionView.jsx';
// Pages professeur
import TeacherSignup from './pages/TeacherSignup.jsx';
import Pending from './pages/Pending.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import Correct from './pages/Correct.jsx';
// Page administrateur
import AdminDashboard from './pages/AdminDashboard.jsx';

// Liste de toutes les pages de l'application
export default function App() {
  return (
    <div className="app">{/* conteneur centré de largeur « téléphone » */}
      <Routes>
        <Route path="/" element={<Welcome />} />{/* accueil */}
        <Route path="/signup" element={<Signup />} />{/* inscription élève */}
        <Route path="/login" element={<Login role="student" />} />{/* connexion élève */}
        <Route path="/reset" element={<Reset />} />{/* mot de passe oublié (tous les rôles) */}
        <Route path="/pay" element={<Guard roles={['student']}><Pay /></Guard>} />{/* abonnement */}
        <Route path="/dashboard" element={<Guard roles={['student']} needSub><StudentDashboard /></Guard>} />{/* tableau de bord élève */}
        <Route path="/correction/:id" element={<Guard roles={['student']} needSub><CorrectionView /></Guard>} />{/* écran de correction */}
        <Route path="/chat/:userId" element={<Guard needSub><Chat /></Guard>} />{/* chat avec une personne */}
        <Route path="/profile" element={<Guard><Profile /></Guard>} />{/* profil : nom et photo */}
        <Route path="/prof/signup" element={<TeacherSignup />} />{/* inscription professeur */}
        <Route path="/prof/login" element={<Login role="teacher" />} />{/* connexion professeur */}
        <Route path="/prof/pending" element={<Pending />} />{/* attente de validation */}
        <Route path="/prof" element={<Guard roles={['teacher']} login="/prof/login"><TeacherDashboard /></Guard>} />{/* tableau de bord professeur */}
        <Route path="/prof/correct/:id" element={<Guard roles={['teacher']} login="/prof/login"><Correct /></Guard>} />{/* correction d'un exercice */}
        <Route path="/admin/login" element={<Login role="admin" />} />{/* connexion admin */}
        <Route path="/admin" element={<Guard roles={['admin']} login="/admin/login"><AdminDashboard /></Guard>} />{/* tableau de bord admin */}
        <Route path="*" element={<Navigate to="/" replace />} />{/* adresse inconnue : retour à l'accueil */}
      </Routes>
    </div>
  );
}
