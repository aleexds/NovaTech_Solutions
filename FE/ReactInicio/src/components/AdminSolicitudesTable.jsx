import { useState } from 'react';
import { ExternalLink, X, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminSolicitudesTable({ solicitudes = [], onActualizar, onMostrarToast }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [todasSolicitudes, setTodasSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const getIniciales = (nombre = 'Colaborador') => {
    return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) {
        const partes = fechaStr.split('T')[0].split('-');
        if (partes.length < 3) return fechaStr;
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${parseInt(partes[2])} ${meses[parseInt(partes[1]) - 1]}`;
      }
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${fecha.getUTCDate()} ${meses[fecha.getUTCMonth()]}`;
    } catch (e) {
      return fechaStr;
    }
  };

  const obtenerNombreColaborador = (s) => {
    return s?.colaborador_nombre || s?.colaboradores?.nombre || s?.nombre || `Colaborador (${s?.colaborador_id || 'ID'})`;
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
        if (onMostrarToast) onMostrarToast(`Solicitud #${id} marcada como ${nuevoEstado}`, 'exito');
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
      case 'aprobada': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
      case 'rechazada': return { bg: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' };
      default: return { bg: 'rgba(234, 179, 8, 0.1)', color: '#eab308' };
    }
  };

  const solicitudesFiltradas = solicitudes.filter(s => {
    if (filtroEstado === 'todas') return true;
    return s.estado === filtroEstado;
  });

  return (
    <>
      <div className="ios-glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Cabecera y Botón Ver Historial Completo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: '600', color: '#fff' }}>Solicitudes Recientes de Colaboradores</h3>
          <button 
            onClick={cargarTodas}
            className="badge-corp"
            style={{ cursor: 'pointer', fontSize: '0.74rem' }}
          >
            Ver historial completo <ExternalLink size={13} />
          </button>
        </div>

        {/* Filtros Rápidos */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
          {['todas', 'pendiente', 'aprobada', 'rechazada'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFiltroEstado(tab)}
              style={{
                background: filtroEstado === tab ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                border: filtroEstado === tab ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid transparent',
                color: filtroEstado === tab ? '#ffffff' : 'var(--text-secondary)',
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '500',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tabla Principal */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                <th style={{ padding: '10px' }}>Colaborador</th>
                <th style={{ padding: '10px' }}>Tipo</th>
                <th style={{ padding: '10px' }}>Periodo</th>
                <th style={{ padding: '10px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No hay solicitudes en este filtro.
                  </td>
                </tr>
              ) : (
                solicitudesFiltradas.map((s, index) => {
                  const estilo = getColorEstado(s.estado);
                  const nombreColab = obtenerNombreColaborador(s);
                  return (
                    <tr 
                      key={s.id || index} 
                      onClick={() => setSolicitudSeleccionada(s)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar-initials">{getIniciales(nombreColab)}</div>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{nombreColab}</div>
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {s.tipo?.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {formatearFecha(s.fecha_inicio)} – {formatearFecha(s.fecha_fin)}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600', textTransform: 'capitalize', background: estilo.bg, color: estilo.color }}>
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

      {/* Modal Historial Completo */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="ios-glass-card" style={{ width: '100%', maxWidth: '950px', maxHeight: '85vh', background: '#0d1015', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff' }}>Historial Completo de Solicitudes ({todasSolicitudes.length})</h3>
              <button onClick={() => setModalAbierto(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {cargando ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: '#fff', gap: '10px' }}>
                  <Loader2 className="animate-spin" size={24} /> Cargando registros desde MySQL...
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                      <th style={{ padding: '10px' }}>Colaborador</th>
                      <th style={{ padding: '10px' }}>Tipo</th>
                      <th style={{ padding: '10px' }}>Periodo</th>
                      <th style={{ padding: '10px' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todasSolicitudes.map((s, index) => {
                      const estilo = getColorEstado(s.estado);
                      const nombreColab = obtenerNombreColaborador(s);
                      return (
                        <tr 
                          key={s.id || index} 
                          onClick={() => setSolicitudSeleccionada(s)}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar-initials">{getIniciales(nombreColab)}</div>
                            <span style={{ fontWeight: '600', color: '#fff' }}>{nombreColab}</span>
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                            {s.tipo?.replace(/_/g, ' ')}
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {formatearFecha(s.fecha_inicio)} – {formatearFecha(s.fecha_fin)}
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600', textTransform: 'capitalize', background: estilo.bg, color: estilo.color }}>
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

      {/* Modal Pop-up: Detalles individuales para Aprobar o Rechazar */}
      {solicitudSeleccionada && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '20px' }}>
          <div className="ios-glass-card" style={{ width: '100%', maxWidth: '480px', background: '#0e1014', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden', padding: '24px', gap: '18px', boxShadow: '0 25px 50px rgba(0,0,0,0.7)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff' }}>Gestión de Solicitud #{solicitudSeleccionada.id}</h3>
              <button onClick={() => setSolicitudSeleccionada(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Colaborador</span>
                <strong style={{ fontSize: '0.98rem', color: '#fff' }}>{obtenerNombreColaborador(solicitudSeleccionada)}</strong>
                {solicitudSeleccionada.departamento && (
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block' }}>Departamento: {solicitudSeleccionada.departamento}</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Tipo</span>
                  <span style={{ textTransform: 'capitalize', fontWeight: '600', color: '#fff' }}>{solicitudSeleccionada.tipo?.replace(/_/g, ' ')}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Estado Actual</span>
                  <span style={{ textTransform: 'capitalize', fontWeight: '600', color: getColorEstado(solicitudSeleccionada.estado).color }}>
                    {solicitudSeleccionada.estado}
                  </span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Fechas</span>
                <span style={{ fontWeight: '500', color: '#fff' }}>
                  {formatearFecha(solicitudSeleccionada.fecha_inicio)} – {formatearFecha(solicitudSeleccionada.fecha_fin)}
                </span>
              </div>
            </div>

            {/* Acciones de Aprobación / Rechazo */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                disabled={procesando || solicitudSeleccionada.estado === 'aprobada'}
                onClick={() => cambiarEstadoSolicitud(solicitudSeleccionada.id, 'aprobada')}
                style={{
                  flex: 1,
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={16} /> Aprobar
              </button>
              <button
                disabled={procesando || solicitudSeleccionada.estado === 'rechazada'}
                onClick={() => cambiarEstadoSolicitud(solicitudSeleccionada.id, 'rechazada')}
                style={{
                  flex: 1,
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#f43f5e',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <XCircle size={16} /> Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
