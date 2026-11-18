import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import DashboardColaborador from '../pages/DashboardColaborador';
import DashboardAdmin from '../pages/DashboardAdmin';
import { useAuth } from '../context/useAuth';

// 1. Componente para proteger rutas privadas (si no hay usuario, va al login)
function RutaPrivada({ children }) {
  const { usuario } = useAuth();
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// 2. Componente para evitar que un usuario logueado vuelva al login o landing
function RutaPublica({ children }) {
  const { usuario } = useAuth();
  if (usuario) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// 3. Enrutador inteligente de dashboards según el rol del usuario
function DashboardRouter() {
  const { usuario } = useAuth();
  
  if (usuario?.rol === 'admin_rrhh') {
    return <DashboardAdmin />;
  }
  
  return <DashboardColaborador />;
}

// 4. Mapa principal de rutas de la aplicación
export default function AppRoutes() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<RutaPublica><LandingPage /></RutaPublica>} />
      <Route path="/login" element={<RutaPublica><LoginPage /></RutaPublica>} />

      {/* Ruta Protegida del Dashboard (Valida rol automáticamente) */}
      <Route 
        path="/dashboard" 
        element={
          <RutaPrivada>
            <DashboardRouter />
          </RutaPrivada>
        } 
      />

      {/* Redirección por defecto para cualquier otra URL */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}