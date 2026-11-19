import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import { 
  Send, Bot, User, Sparkles, Calendar, CheckCircle2, 
  Clock, PlusCircle, AlertCircle, FileCheck, CalendarDays, MessageSquare
} from 'lucide-react';

export default function DashboardColaborador() {
  const { usuario } = useAuth();
  const [tabActiva, setTabActiva] = useState('chat'); // 'chat' o 'solicitudes'
  
  // Estado del Chat
  const [mensajes, setMensajes] = useState([
    {
      remitente: 'bot',
      texto: `Hola **${usuario?.nombre || 'Colaborador'}**. Soy tu asistente inteligente de Recursos Humanos de **NovaTech**. ¿En qué puedo orientarte hoy? Puedes consultarme sobre tus saldos de vacaciones, estados de solicitudes o cualquier política y beneficio de la empresa.`
    }
  ]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [misDatos, setMisDatos] = useState(null);
  const mensajesEndRef = useRef(null);

  // Estado del Formulario de Solicitudes de Feriados y Permisos
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorSolicitud, setErrorSolicitud] = useState('');
  
  const [formulario, setFormulario] = useState({
    tipo: 'feriado_laborado',
    fecha_inicio: '',
    fecha_fin: '',
    motivo: ''
  });

  const feriadosOficiales = [
    { fecha: '2026-01-01', nombre: 'Año Nuevo' },
    { fecha: '2026-04-02', nombre: 'Jueves Santo' },
    { fecha: '2026-04-03', nombre: 'Viernes Santo' },
    { fecha: '2026-05-01', nombre: 'Día Internacional del Trabajo' },
    { fecha: '2026-07-25', nombre: 'Anexión del Partido de Nicoya' },
    { fecha: '2026-08-02', nombre: 'Día de la Virgen de los Ángeles' },
    { fecha: '2026-08-15', nombre: 'Día de la Madre' },
    { fecha: '2026-09-15', nombre: 'Día de la Independencia' },
    { fecha: '2026-12-25', nombre: 'Navidad' }
  ];

  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (tabActiva === 'chat') {
      scrollToBottom();
    }
  }, [mensajes, tabActiva]);

  // Carga de saldo de vacaciones
  useEffect(() => {
    const consultarSaldos = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/chat/hr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: `session-${usuario?.id}`,
            mensaje: '¿Cuántos días de vacaciones me quedan disponibles?',
            usuario: usuario
          })
        });
        const data = await res.json();
        if (data.exito) {
          setMisDatos(data.respuesta);
        }
      } catch (err) {
        console.warn('No se pudo precargar saldo:', err.message);
      }
    };
    if (usuario?.id) consultarSaldos();
  }, [usuario]);

  // Carga de solicitudes del colaborador
  const cargarSolicitudesColaborador = async () => {
    if (!usuario?.id) return;
    setCargandoSolicitudes(true);
    try {
      const res = await fetch(`http://localhost:4000/api/colaborador/solicitudes?colaborador_id=${usuario.id}`);
      const data = await res.json();
      if (data.exito) {
        setMisSolicitudes(data.solicitudes);
      }
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
    } finally {
      setCargandoSolicitudes(false);
    }
  };

  useEffect(() => {
    cargarSolicitudesColaborador();
  }, [usuario]);

  // Enviar pregunta al chatbot
  const enviarPregunta = async (e) => {
    e.preventDefault();
    if (!input.trim() || enviando) return;

    const textoUsuario = input.trim();
    setInput('');
    setMensajes(prev => [...prev, { remitente: 'user', texto: textoUsuario }]);
    setEnviando(true);

    try {
      const res = await fetch('http://localhost:4000/api/chat/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `session-${usuario?.id || 'guest'}`,
          mensaje: textoUsuario,
          usuario: usuario
        })
      });

      const data = await res.json();
      if (data.exito) {
        setMensajes(prev => [
          ...prev, 
          { 
            remitente: 'bot', 
            texto: data.respuesta,
            agente: data.agente,
            intencion: data.intencion,
            documentosCitados: data.documentosCitados
          }
        ]);
      } else {
        setMensajes(prev => [...prev, { remitente: 'bot', texto: 'No pude obtener una respuesta en este momento. Por favor reintenta.' }]);
      }
    } catch (err) {
      setMensajes(prev => [...prev, { remitente: 'bot', texto: 'Error al conectar con el servidor de agentes.' }]);
    } finally {
      setEnviando(false);
    }
  };

  // Enviar solicitud de feriado o permiso
  const enviarSolicitudFeriado = async (e) => {
    e.preventDefault();
    setErrorSolicitud('');
    setMensajeExito('');

    if (!formulario.fecha_inicio) {
      setErrorSolicitud('Por favor selecciona la fecha del feriado o permiso.');
      return;
    }

    setEnviandoSolicitud(true);
    try {
      const res = await fetch('http://localhost:4000/api/colaborador/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colaborador_id: usuario.id,
          tipo: formulario.tipo,
          fecha_inicio: formulario.fecha_inicio,
          fecha_fin: formulario.fecha_fin || formulario.fecha_inicio,
          motivo: formulario.motivo
        })
      });

      const data = await res.json();
      if (data.exito) {
        setMensajeExito(`¡Solicitud #${data.solicitudId} enviada exitosamente a RRHH para su aprobación!`);
        setFormulario({
          tipo: 'feriado_laborado',
          fecha_inicio: '',
          fecha_fin: '',
          motivo: ''
        });
        await cargarSolicitudesColaborador();
      } else {
        setErrorSolicitud(data.error || 'Ocurrió un error al enviar la solicitud.');
      }
    } catch (err) {
      setErrorSolicitud('No se pudo conectar con el servidor.');
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <Navbar />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        
        {/* Panel lateral: Perfil Real del Colaborador */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="ios-glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="avatar-initials" style={{ width: '42px', height: '42px', fontSize: '1rem' }}>
                {usuario?.nombre?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff' }}>{usuario?.nombre}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{usuario?.puesto}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>ID Empleado:</span>
                <span style={{ color: '#fff', fontWeight: '500' }}>{usuario?.id || 'EMP-005'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Departamento:</span>
                <span style={{ color: '#fff', fontWeight: '500' }}>{usuario?.departamento || 'Tecnología'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Correo:</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{usuario?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rol:</span>
                <span className="badge-corp" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>Colaborador</span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Saldos */}
          <div className="ios-glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Calendar size={15} /> Vacaciones NovaTech
            </h4>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              {misDatos || 'Consultando tus días hábiles disponibles con el Agente de Datos...'}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Beneficio: 15 días anuales (+1 día por cada año tras cumplir 3 años).
            </div>
          </div>

          {/* Próximos Feriados del Calendario Oficial */}
          <div className="ios-glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <CalendarDays size={14} /> Calendario Oficial de Feriados
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {feriadosOficiales.map((f, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', padding: '6px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                  <span style={{ color: '#fff' }}>{f.nombre}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{f.fecha}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Panel Central con Pestañas: Chatbot Multiagente y Solicitudes de Feriados */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Navegación por pestañas */}
          <div className="nav-tabs" style={{ marginBottom: '0px' }}>
            <button 
              className={`nav-tab ${tabActiva === 'chat' ? 'active' : ''}`}
              onClick={() => setTabActiva('chat')}
            >
              <MessageSquare size={16} /> Asistente de RRHH (Chatbot RAG)
            </button>
            <button 
              className={`nav-tab ${tabActiva === 'solicitudes' ? 'active' : ''}`}
              onClick={() => setTabActiva('solicitudes')}
            >
              <CalendarDays size={16} /> Solicitud de Feriados & Permisos
            </button>
          </div>

          {/* Vista 1: Chatbot Multiagente */}
          {tabActiva === 'chat' ? (
            <div className="ios-glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
              
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffffff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={18} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '0.92rem', fontWeight: '600', color: '#fff' }}>Agente Multiagente de RRHH</h2>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Orquestador • RAG con Citas a Drive • Base de Datos MySQL</span>
                  </div>
                </div>

                <span className="badge-corp" style={{ fontSize: '0.7rem', padding: '3px 10px' }}>
                  <CheckCircle2 size={12} color="#10b981" /> Activo
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {mensajes.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      alignSelf: msg.remitente === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%'
                    }}
                  >
                    {msg.remitente === 'bot' && (
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                        <Bot size={15} color="#fff" />
                      </div>
                    )}

                    <div
                      style={{
                        background: msg.remitente === 'user' ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                        color: msg.remitente === 'user' ? '#000000' : 'var(--text-main)',
                        border: msg.remitente === 'user' ? 'none' : '1px solid var(--glass-border)',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        fontSize: '0.86rem',
                        lineHeight: 1.55,
                        whiteSpace: 'pre-wrap',
                        boxShadow: msg.remitente === 'user' ? '0 2px 8px rgba(255,255,255,0.1)' : 'none'
                      }}
                    >
                      {msg.texto}

                      {msg.agente && (
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            Atendido por: <strong>{msg.agente}</strong>
                          </span>
                          {msg.intencion && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              • Intención: <strong>{msg.intencion}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {msg.remitente === 'user' && (
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                        <User size={15} color="#fff" />
                      </div>
                    )}
                  </div>
                ))}
                {enviando && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Clock size={14} className="animate-spin" /> El orquestador está coordinando los agentes...
                  </div>
                )}
                <div ref={mensajesEndRef} />
              </div>

              <form onSubmit={enviarPregunta} style={{ padding: '16px 20px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="ios-input"
                  placeholder="Pregunta sobre vacaciones, feriados, permisos o tus saldos..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={enviando}
                  style={{ padding: '12px 16px' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={enviando || !input.trim()}
                  style={{ padding: '0 18px' }}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          ) : (
            /* Vista 2: Sección de Envío y Consulta de Solicitudes de Feriados */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Formulario de Envío */}
              <div className="ios-glass-card" style={{ padding: '26px' }}>
                <div style={{ marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlusCircle size={18} /> Nueva Solicitud de Feriado o Permiso
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Registra tu solicitud para goce de feriado nacional, guardia técnica remunerada al 100% o compensatorio según la Política POL-RRHH-001.
                  </p>
                </div>

                {mensajeExito && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '12px 16px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} /> {mensajeExito}
                  </div>
                )}

                {errorSolicitud && (
                  <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '12px 16px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} /> {errorSolicitud}
                  </div>
                )}

                <form onSubmit={enviarSolicitudFeriado} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  
                  {/* Tipo de Solicitud */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Tipo de Solicitud</label>
                    <select
                      className="ios-input"
                      value={formulario.tipo}
                      onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
                      style={{ background: '#121418', color: '#fff' }}
                    >
                      <option value="feriado_laborado">Guardia / Feriado Laborado (Pago doble 100%)</option>
                      <option value="feriado_descanso">Goce de Feriado Oficial</option>
                      <option value="dia_compensatorio">Día Compensatorio por Feriado</option>
                      <option value="permiso_especial">Permiso Especial</option>
                    </select>
                  </div>

                  {/* Selección de Feriado Rápido */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Autocompletar con Feriado Oficial</label>
                    <select
                      className="ios-input"
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormulario({ ...formulario, fecha_inicio: e.target.value, fecha_fin: e.target.value });
                        }
                      }}
                      style={{ background: '#121418', color: '#fff' }}
                    >
                      <option value="">-- Seleccionar fecha oficial 2026 --</option>
                      {feriadosOficiales.map((f, i) => (
                        <option key={i} value={f.fecha}>{f.nombre} ({f.fecha})</option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha Inicio */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Fecha Inicio / Feriado</label>
                    <input
                      type="date"
                      className="ios-input"
                      value={formulario.fecha_inicio}
                      onChange={(e) => setFormulario({ ...formulario, fecha_inicio: e.target.value })}
                      required
                    />
                  </div>

                  {/* Fecha Fin */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Fecha Fin</label>
                    <input
                      type="date"
                      className="ios-input"
                      value={formulario.fecha_fin || formulario.fecha_inicio}
                      onChange={(e) => setFormulario({ ...formulario, fecha_fin: e.target.value })}
                    />
                  </div>

                  {/* Motivo o Detalle */}
                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Justificación / Detalle de la guardia o feriado</label>
                    <textarea
                      className="ios-input"
                      rows={3}
                      placeholder="Indica el motivo de la guardia, turno asignado o detalle de la solicitud..."
                      value={formulario.motivo}
                      onChange={(e) => setFormulario({ ...formulario, motivo: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="submit"
                      disabled={enviandoSolicitud}
                      className="btn-primary"
                      style={{ padding: '10px 22px' }}
                    >
                      {enviandoSolicitud ? 'Registrando en MySQL...' : (
                        <>
                          Enviar Solicitud a RRHH <FileCheck size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Historial de Mis Solicitudes */}
              <div className="ios-glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} /> Mis Solicitudes Registradas
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Total: {misSolicitudes.length} solicitudes
                  </span>
                </div>

                {cargandoSolicitudes ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Cargando tus solicitudes desde MySQL...
                  </div>
                ) : misSolicitudes.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No has registrado solicitudes de feriados o permisos aún.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                          <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>ID</th>
                          <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Tipo</th>
                          <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Período</th>
                          <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Estado</th>
                          <th style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>Fecha Registro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {misSolicitudes.map((s, idx) => (
                          <tr key={s.id || idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <td style={{ padding: '10px 14px', fontWeight: '600', color: '#fff' }}>#{s.id}</td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-main)', textTransform: 'capitalize' }}>
                              {s.tipo.replace('_', ' ')}
                            </td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                              {new Date(s.fecha_inicio).toLocaleDateString()} al {new Date(s.fecha_fin).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span 
                                className="badge-corp" 
                                style={{ 
                                  padding: '2px 8px', 
                                  fontSize: '0.68rem',
                                  color: s.estado === 'aprobada' ? '#10b981' : (s.estado === 'rechazada' ? '#f43f5e' : '#eab308'),
                                  background: s.estado === 'aprobada' ? 'rgba(16, 185, 129, 0.1)' : (s.estado === 'rechazada' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)')
                                }}
                              >
                                {s.estado.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                              {new Date(s.creada_en).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </section>
      </main>
    </div>
  );
}
