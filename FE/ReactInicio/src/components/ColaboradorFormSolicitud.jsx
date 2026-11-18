import { useState } from 'react';
import { Send, Loader2, FileText } from 'lucide-react';

export default function ColaboradorFormSolicitud({ usuarioId, onSolicitudEnviada }) {
  const [tipo, setTipo] = useState('vacaciones');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin || !motivo.trim()) {
      setMensajeFeedback({ exito: false, texto: 'Por favor completa las fechas y el motivo.' });
      return;
    }

    setEnviando(true);
    setMensajeFeedback(null);

    try {
      const res = await fetch('http://localhost:4000/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colaborador_id: usuarioId || '6adb49c6-be83-451d-b8a4-6980e156bf70', // ID de respaldo o real del usuario logueado
          tipo,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          motivo
        })
      });

      const data = await res.json();
      if (data.exito) {
        setMensajeFeedback({ exito: true, texto: '¡Solicitud enviada con éxito a RRHH!' });
        setMotivo('');
        setFechaInicio('');
        setFechaFin('');
        if (onSolicitudEnviada) onSolicitudEnviada();
      } else {
        setMensajeFeedback({ exito: false, texto: data.error || 'Error al enviar solicitud.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMensajeFeedback({ exito: false, texto: 'Error de conexión con el servidor.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="ios-glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fb923c' }}>
        <FileText size={18} /> Nueva Solicitud de Permiso / Vacaciones
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Tipo de Solicitud</label>
          <select 
            value={tipo} 
            onChange={e => setTipo(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '10px', color: '#fff', outline: 'none' }}
          >
            <option value="vacaciones" style={{ background: '#121212' }}>Vacaciones</option>
            <option value="permiso_estudio" style={{ background: '#121212' }}>Permiso de Estudio</option>
            <option value="incapacidad" style={{ background: '#121212' }}>Incapacidad</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Desde</label>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={e => setFechaInicio(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '9px', borderRadius: '10px', color: '#fff', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Hasta</label>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={e => setFechaFin(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '9px', borderRadius: '10px', color: '#fff', outline: 'none' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Motivo de la Solicitud</label>
          <textarea 
            placeholder="Ej. Viaje familiar programado / Cita médica / Trámite personal..." 
            value={motivo} 
            onChange={e => setMotivo(e.target.value)}
            rows={3}
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '10px', color: '#fff', outline: 'none', resize: 'none' }}
          />
        </div>

        {mensajeFeedback && (
          <div style={{ fontSize: '0.8rem', color: mensajeFeedback.exito ? '#22c55e' : '#ef4444', textAlign: 'center' }}>
            {mensajeFeedback.texto}
          </div>
        )}

        <button 
          type="submit" 
          disabled={enviando}
          style={{ background: '#f97316', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', color: '#000', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          {enviando ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Enviar a RRHH
        </button>
      </form>
    </div>
  );
}