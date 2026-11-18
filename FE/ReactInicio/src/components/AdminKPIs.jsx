import { Users, AlertTriangle, Clock, UserCheck } from 'lucide-react';

export default function AdminKPIs({ kpis }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
      
      <div className="ios-glass-card" style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
          <span>Plantilla Activa</span> 
          <UserCheck size={18} color="#ffffff"/>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff' }}>{kpis?.totalColaboradores ?? 0}</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>180 colaboradores objetivo</div>
      </div>

      <div className="ios-glass-card" style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
          <span>Incapacidades Activas</span> 
          <Users size={18} color="#ffffff"/>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff' }}>{kpis?.incapacidadesHoy ?? 0}</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Ausencias médicas vigentes</div>
      </div>

      <div className="ios-glass-card" style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
          <span>Solicitudes Pendientes</span> 
          <Clock size={18} color="#eab308"/>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff' }}>{kpis?.pendientes ?? 0}</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          {kpis?.pendientesMas3Dias ? `${kpis.pendientesMas3Dias} con >3 días sin respuesta` : 'Requieren gestión en portal'}
        </div>
      </div>

      <div className="ios-glass-card" style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
          <span>Riesgo de Pasivo Vacacional</span> 
          <AlertTriangle size={18} color="#f43f5e"/>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff' }}>{kpis?.riesgoPasivo ?? 0}</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Colaboradores con &gt;20 días pendientes</div>
      </div>

    </div>
  );
}
