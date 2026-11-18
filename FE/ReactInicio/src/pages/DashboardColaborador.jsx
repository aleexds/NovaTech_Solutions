import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import { Send, Bot, User, Sparkles, ShieldAlert, FileText, ExternalLink, Calendar, CheckCircle2, Clock } from 'lucide-react';

export default function DashboardColaborador() {
  const { usuario } = useAuth();
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

  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // Carga inicial de métricas del colaborador
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        
        {/* Panel lateral: Perfil y Datos Rápidos del Colaborador */}
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
                <span style={{ color: '#fff', fontWeight: '500' }}>{usuario?.id || 'EMP-001'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Departamento:</span>
                <span style={{ color: '#fff', fontWeight: '500' }}>{usuario?.departamento || 'Tecnología'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rol:</span>
                <span className="badge-corp" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>Colaborador</span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Acceso Rápido de Vacaciones */}
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

          {/* Preguntas Frecuentes Sugeridas */}
          <div className="ios-glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> Preguntas de Prueba Rápida
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                "¿Cuántos días de vacaciones me corresponden al año?",
                "¿Cuántos días me quedan y puedo pasar los que sobren al otro año?",
                "¿Cuánto dura la licencia de maternidad y paternidad?",
                "¿Me incapacitaron 5 días, quién paga esos días y cuánto recibo?",
                "¿Cuál es el salario de Juan?"
              ].map((preg, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(preg)}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.73rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                >
                  {preg}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Panel Principal: Chatbot Multiagente RAG */}
        <section className="ios-glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
          {/* Cabecera del Chat */}
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

          {/* Historial de Mensajes */}
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

                  {/* Metadatos del Agente si están disponibles */}
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

          {/* Formulario de Entrada */}
          <form onSubmit={enviarPregunta} style={{ padding: '16px 20px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="ios-input"
              placeholder="Pregunta sobre vacaciones, permisos, pagos, teletrabajo o tus solicitudes..."
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
        </section>
      </main>
    </div>
  );
}
