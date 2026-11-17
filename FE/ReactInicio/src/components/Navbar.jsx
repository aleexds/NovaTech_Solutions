import { useAuth } from '../context/useAuth';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="ios-glass" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px', margin: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', background: 'var(--orange-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>N</div>
        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>NovaTech HR</span>
      </div>
      {usuario && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{usuario.nombre} ({usuario.rol})</span>
          <button className="btn-orange" onClick={() => { cerrarSesion(); navigate('/login'); }}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      )}
    </header>
  );
}