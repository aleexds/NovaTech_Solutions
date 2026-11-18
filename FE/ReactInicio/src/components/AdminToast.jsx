import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

export default function AdminToast({ mensaje, tipo = 'exito', onClose }) {
  if (!mensaje) return null;

  const colores = {
    exito: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', color: '#22c55e', icon: <CheckCircle2 size={18} /> },
    error: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', icon: <XCircle size={18} /> },
    info: { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8', icon: <AlertCircle size={18} /> }
  };

  const estilo = colores[tipo] || colores.exito;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: '#0f1522',
      border: `1px solid ${estilo.border}`,
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
      padding: '14px 18px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 9999,
      animation: 'slideInUp 0.3s ease forwards',
      color: '#fff',
      fontSize: '0.9rem',
      maxWidth: '400px'
    }}>
      <span style={{ color: estilo.color, display: 'flex', alignItems: 'center' }}>{estilo.icon}</span>
      <span style={{ flex: 1, fontWeight: '500' }}>{mensaje}</span>
      <button 
        onClick={onClose} 
        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}