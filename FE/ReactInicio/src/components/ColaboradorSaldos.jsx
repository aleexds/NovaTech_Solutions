import { Calendar } from 'lucide-react';

export default function ColaboradorSaldos() {
  return (
    <div className="ios-glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fb923c' }}>
        <Calendar size={18} /> Mis Saldos y Vacaciones
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Disponibles</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f97316' }}>12 Días</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tomados</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>3 Días</div>
        </div>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
        Próximo pago de planilla: <strong style={{ color: 'white' }}>15 del mes</strong>
      </div>
    </div>
  );
}