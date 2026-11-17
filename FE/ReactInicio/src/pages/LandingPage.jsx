import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', padding: '20px', textAlign: 'center' }}>
      <div className="ios-glass-card" style={{ padding: '40px', maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <div style={{ padding: '8px 16px', background: 'rgba(249,115,22,0.15)', border: '1px solid var(--glass-border-orange)', borderRadius: '99px', color: '#fb923c', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} /> Portal Inteligente de Recursos Humanos
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1.2 }}>NovaTech HR Portal</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5 }}>
          Sistema unificado con DeepSeek y Google Drive para la gestión de políticas, consultas laborales y control de colaboradores.
        </p>
        <button className="btn-orange" onClick={() => navigate('/login')} style={{ marginTop: '10px', padding: '14px 28px', fontSize: '1rem' }}>
          Iniciar Sesión <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}