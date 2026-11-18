import { FileBarChart } from 'lucide-react';

export default function AdminResumenEjecutivo() {
  return (
    <div className="ios-glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileBarChart size={18} color="#f97316" /> Resumen Ejecutivo
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        La operación de la semana se mantiene estable con un 92% de efectividad en el chat RAG. Se registra una alerta por acumulación de vacaciones en 7 colaboradores que requiere plan de mitigación. Las solicitudes de permisos se encuentran al día a excepción de una pendiente en el área técnica.
      </p>
      <div style={{ marginTop: 'auto', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        Top tema consultado hoy: <strong style={{ color: 'white' }}>Cálculo de aguinaldo y feriados</strong>
      </div>
    </div>
  );
}