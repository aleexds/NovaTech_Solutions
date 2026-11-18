import { useState } from 'react';
import { ExternalLink, X, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminSolicitudesTable({ solicitudes = [], onActualizar, onMostrarToast }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [todasSolicitudes, setTodasSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todas'); // Filtro rápido
  
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const getIniciales = (nombre = 'Colaborador') => {
    return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const partes = fechaStr.split('-');
    if (partes.length < 3) return fechaStr;
    const [ mes, dia] = partes;
    return `${parseInt(dia)} ${meses[parseInt(mes) - 1]}`;
  };

  const cargarTodas = async () => {
    setModalAbierto(true);
    setCargando(true);
    try {
      const res = await fetch('http://localhost:4000/api/admin/solicitudes');
      const data = await res.json();
      if (data.exito) {
        setTodasSolicitudes(data.solicitudes);
      }
    } catch (error) {
      console.error('Error cargando todas las solicitudes:', error);
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstadoSolicitud = async (id, nuevoEstado) => {
    setProcesando(true);
    try {
      const res = await fetch(`http://localhost:4000/api/admin/solicitudes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const data = await res.json();
      
      if (data.exito) {
        const actualizarLista = (lista) => lista.map(s => s.id === id ? { ...s, estado: nuevoEstado } : s);
        setTodasSolicitudes(actualizarLista(todasSolicitudes));
        setSolicitudSeleccionada(prev => prev ? { ...prev, estado: nuevoEstado } : null);
        
        if (onActualizar) onActualizar();
        if (onMostrarToast) onMostrarToast(`Solicitud #${id} ${nuevoEstado} exitosamente`, 'exito');
      } else {
        if (onMostrarToast) onMostrarToast(`Error al actualizar solicitud`, 'error');
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      if (onMostrarToast) onMostrarToast(`Error de conexión con el servidor`, 'error');
    } finally {
      setProcesando(false);
    }
  };

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'aprobada': return { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' };
      case 'rechazada': return { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' };
      default: return { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' };
    }
  };

  // Filtrado de solicitudes según el tab seleccionado
  const solicitudesFiltradas = solicitudes.filter(s => {
    if (filtroEstado === 'todas') return true;
    return s.estado === filtroEstado;
  });

  return (
    <>
      <div className="ios-glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Cabecera y Botón Ver Todas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Solicitudes Recientes de Colaboradores</h3>
          <button 
            onClick={cargarTodas}
            className="badge-corp"
            style={{ cursor: 'pointer', border: '1px solid var(--glass-border-accent)' }}
          >
            Ver historial completo <ExternalLink size={14} />
          </button>
        </div>

        {/* Filtros Rápidos (Pestañas internas de la tarjeta) */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
          {['todas', 'pendiente', 'aprobada', 'rechazada'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFiltroEstado(tab)}
              style={{
                background: filtroEstado === tab ? 'var(--accent-soft)' : 'transparent',
                border: filtroEstado === tab ? '1px solid var(--glass-border-accent)' : '1px solid transparent',
                color: filtroEstado === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                <th style={{ padding: '10px' }}>Colaborador</th>
                <th style={{ padding: '10px' }}>Tipo</th>
                <th style={{ padding: '10px' }}>Periodo</th>
                <th style={{ padding: '10px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    No hay solicitudes en este filtro.
                  </td>
                </tr>
              ) : (
                solicitudesFiltradas.map((s, index) => {
                  const estilo = getColorEstado(s.estado);
                  const nombreColab = s.colaboradores?.nombre || 'Colaborador';
                  return (
                    <tr 
                      key={s.id || index} 
                      onClick={() => setSolicitudSeleccionada(s)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar-initials">{getIniciales(nombreColab)}</div>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{nombreColab}</div>
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {s.tipo?.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {formatearFecha(s.fecha_inicio)} – {formatearFecha(s.fecha_fin)}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize', background: estilo.bg, color: estilo.color }}>
                          {s.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Historial Completo y Modal Detalle (Se mantienen igual de limpios) */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="ios-glass-card" style={{ width: '100%', maxWidth: '950px', maxHeight: '85vh', background: '#0d121d', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Historial Completo de Solicitudes</h3>
              <button onClick={() => setModalAbierto(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {cargando ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--accent-primary)', gap: '10px' }}><Loader2 className="animate-spin" size={24} /> Cargando registros...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      <th style={{ padding: '10px' }}>Colaborador</th>
                      <th style={{ padding: '10px' }}>Tipo</th>
                      <th style={{ padding: '10px' }}>Periodo</th>
                      <th style={{ padding: '10px' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todasSolicitudes.map((s, index) => {
                      const estilo = getColorEstado(s.estado);
                      const nombreColab = s.colaboradores?.nombre || 'Colaborador';
                      return (
                        <tr 
                          key={s.id || index} 
                          onClick={() => setSolicitudSeleccionada(s)}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                        >
                          <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar-initials">{getIniciales(nombreColab)}</div>
                            <span style={{ fontWeight: '600', color: '#fff' }}>{nombreColab}</span>
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s.tipo?.replace('_', ' ')}</td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{formatearFecha(s.fecha_inicio)} – {formatearFecha(s.fecha_fin)}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize', background: estilo.bg, color: estilo.color }}>
                              {s.estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Pop-up: Detalles individuales */}
      {solicitudSeleccionada && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '20px' }}>
          <div className="ios-glass-card" style={{ width: '100%', maxWidth: '500px', background: '#0f1522', border: '1px solid var(--glass-border-accent)', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden', padding: '24px', gap: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Detalle de Solicitud</h3>
              <button onClick={() => setSolicitudSeleccionada(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Colaborador</span>
                <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{solicitudSeleccionada.colaboradores?.nombre || 'Colaborador NovaTech'}</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Tipo</span>
                  <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{solicitudSeleccionada.tipo?.replace('_', ' ')}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Estado Actual</span>
                  <span style={{ textTransform: 'capitalize', fontWeight: '600', color: getColorEstado(solicitudSeleccionada.estado).color }}>{solicitudSeleccionada.estado}</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Fechas Solicitadas</span>
                <span style={{ fontWeight: '600' }}>Desde el {solicitudSeleccionada.fecha_inicio} hasta el {solicitudSeleccionada.fecha_fin}</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Motivo del Colaborador</span>
                <p style={{ fontSize: '0.9rem', color: '#fff', margin: '4px 0 0 0' }}>
                  {solicitudSeleccionada.motivo || 'Sin motivo especificado'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                disabled={procesando || solicitudSeleccionada.estado === 'aprobada'}
                onClick={() => cambiarEstadoSolicitud(solicitudSeleccionada.id, 'aprobada')}
                style={{ flex: 1, background: '#22c55e', color: '#000', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', opacity: solicitudSeleccionada.estado === 'aprobada' ? 0.5 : 1 }}
              >
                {procesando ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Aprobar
              </button>

              <button 
                disabled={procesando || solicitudSeleccionada.estado === 'rechazada'}
                onClick={() => cambiarEstadoSolicitud(solicitudSeleccionada.id, 'rechazada')}
                style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', opacity: solicitudSeleccionada.estado === 'rechazada' ? 0.5 : 1 }}
              >
                {procesando ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />} Rechazar
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}