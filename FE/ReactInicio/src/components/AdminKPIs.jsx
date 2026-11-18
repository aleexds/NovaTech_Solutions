import { Users, AlertTriangle, Clock, UserCheck } from 'lucide-react';

export default function AdminKPIs({ kpis }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
      
      <div className="ios-glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <span>Plantilla Activa</span> <UserCheck size={18} color="#f97316"/>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{kpis?.totalColaboradores ?? 0}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Colaboradores registrados en BD</div>
      </div>

      <div className="ios-glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <span>Incapacidades Activas</span> <Users size={18} color="#f97316"/>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{kpis?.incapacidadesHoy ?? 0}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reportadas en sistema</div>
      </div>

      <div className="ios-glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <span>Solicitudes Pendientes</span> <Clock size={18} color="#fb923c"/>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fb923c' }}>{kpis?.pendientes ?? 0}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Requieren revisión de RRHH</div>
      </div>

      <div className="ios-glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <span>Riesgo de Pasivo (Vacaciones)</span> <AlertTriangle size={18} color="#f97316"/>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{kpis?.riesgoPasivo ?? 0}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Colaboradores con &gt;20 días acumulados</div>
      </div>

    </div>
  );
}