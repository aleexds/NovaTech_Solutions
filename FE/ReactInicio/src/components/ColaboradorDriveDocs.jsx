import { FileText } from 'lucide-react';

export default function ColaboradorDriveDocs() {
  return (
    <div className="ios-glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
      <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileText size={18} color="#f97316" /> Documentos y Políticas
      </h3>
      <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
        📖 Manual de Vacaciones 2026
      </div>
      <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
        ⚖️ Reglamento de Teletrabajo
      </div>
      <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
        🛡️ Código de Ética y Conducta
      </div>
    </div>
  );
}