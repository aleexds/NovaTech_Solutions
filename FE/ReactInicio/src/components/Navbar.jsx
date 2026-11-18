import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/useAuth';

export default function Navbar() {
  const { cerrarSesion, logout } = useAuth();
  const navigate = useNavigate();

  const handleSalir = () => {
    // 1. Limpiamos el estado en el contexto de autenticación
    if (cerrarSesion) {
      cerrarSesion();
    } else if (logout) {
      logout();
    }

    // 2. Limpiamos cualquier rastro de la sesión en localStorage y sessionStorage
    localStorage.removeItem('novatech_user');
    localStorage.removeItem('usuario'); 
    localStorage.removeItem('token');
    sessionStorage.clear();

    // 3. Redirigimos fluidamente al login mediante react-router
    navigate('/login', { replace: true });
  };

  return (
    <header className="ios-glass" style={{ padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ 
          background: '#ffffff', 
          color: '#000000', 
          fontWeight: '700', 
          width: '34px', 
          height: '34px', 
          borderRadius: '9px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '0.95rem'
        }}>
          N
        </div>
        <div>
          <h1 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', letterSpacing: '-0.01em' }}>
            NovaTech <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>HR Portal</span>
          </h1>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>180 Colaboradores • Plataforma Directiva</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button 
          onClick={handleSalir}
          style={{ 
            background: 'rgba(255, 255, 255, 0.04)', 
            border: '1px solid var(--glass-border)', 
            color: 'var(--text-secondary)', 
            padding: '7px 14px', 
            borderRadius: '9px', 
            fontSize: '0.8rem', 
            fontWeight: '500', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '7px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)';
            e.currentTarget.style.color = '#f43f5e';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <LogOut size={15} /> Salir
        </button>
      </div>
    </header>
  );
}
