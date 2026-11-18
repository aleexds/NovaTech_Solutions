import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '88vh', padding: '24px 16px', textAlign: 'center' }}>
      <div className="ios-glass-card" style={{ padding: '48px 36px', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '22px', alignItems: 'center' }}>
        
        {/* Badge superior minimalista */}
        <div className="badge-corp">
          <Shield size={13} /> Sistema de Gestión de Recursos Humanos
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: '#ffffff',
            color: '#000000',
            fontWeight: '800',
            width: '42px',
            height: '42px',
            borderRadius: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(255, 255, 255, 0.12)'
          }}>
            N
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '700', lineHeight: 1.15, letterSpacing: '-0.03em', color: '#fff' }}>
            NovaTech
          </h1>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.6, maxWidth: '500px' }}>
          Plataforma centralizada para la administración de talento, control de colaboradores y gestión de políticas corporativas.
        </p>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            180 Colaboradores
          </span>
          <span style={{ color: 'var(--glass-border)' }}>•</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Directorio Activo
          </span>
          <span style={{ color: 'var(--glass-border)' }}>•</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Políticas & Solicitudes
          </span>
        </div>

        <button 
          className="btn-primary" 
          onClick={() => navigate('/login')} 
          style={{ marginTop: '10px', padding: '12px 28px', fontSize: '0.92rem' }}
        >
          Acceder al Portal <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
