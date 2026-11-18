import { useState } from 'react';
import { Bot, Send, Loader2 } from 'lucide-react';

export default function ColaboradorChatRAG({ nombreUsuario }) {
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [chat, setChat] = useState([
    { rol: 'assistant', texto: `Hola ${nombreUsuario || 'Colaborador'}, soy tu asistente de RRHH conectado a DeepSeek y Google Drive. ¿En qué te ayudo hoy con tus políticas o consultas laborales?` }
  ]);

  const enviarChat = async (e) => {
    e.preventDefault();
    if (!mensaje.trim() || cargando) return;

    const textoUsuario = mensaje;
    setMensaje('');
    
    // Añadimos la pregunta del usuario al chat inmediatamente
    setChat(prev => [...prev, { rol: 'user', texto: textoUsuario }]);
    setCargando(true);

    try {
      // Petición real a tu backend en el puerto 4000
      const response = await fetch('http://localhost:4000/api/chat/hr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: 'empleado-01', // O puedes usar el ID real del usuario si lo tienes en el contexto
          mensaje: textoUsuario
        })
      });

      const data = await response.json();

      if (data.exito && data.respuesta) {
        setChat(prev => [...prev, { rol: 'assistant', texto: data.respuesta }]);
      } else {
        setChat(prev => [...prev, { rol: 'assistant', texto: 'Lo siento, hubo un error al procesar tu consulta con el agente.' }]);
      }
    } catch (error) {
      console.error('Error conectando con el backend:', error);
      setChat(prev => [...prev, { rol: 'assistant', texto: 'Error de conexión con el servidor backend en el puerto 4000. Verifica que esté encendido.' }]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="ios-glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Bot size={20} color="#f97316" />
        <h2 style={{ fontSize: '1rem' }}>Asistente Inteligente de Políticas (RAG)</h2>
      </div>
      
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {chat.map((c, i) => (
          <div key={i} style={{ 
            alignSelf: c.rol === 'user' ? 'flex-end' : 'flex-start', 
            background: c.rol === 'user' ? '#f97316' : 'rgba(255,255,255,0.05)', 
            color: c.rol === 'user' ? '#000' : '#fff',
            padding: '12px 16px', 
            borderRadius: '14px', 
            maxWidth: '75%', 
            fontSize: '0.9rem',
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap'
          }}>
            {c.texto}
          </div>
        ))}
        {cargando && (
          <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <Loader2 className="animate-spin" size={16} color="#f97316" /> El agente analizando documentos en Drive...
          </div>
        )}
      </div>

      <form onSubmit={enviarChat} style={{ padding: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Ej. ¿Cuántos días de vacaciones me corresponden y cómo se solicitan?" 
          value={mensaje} 
          onChange={e => setMensaje(e.target.value)} 
          disabled={cargando}
          style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '10px 14px', borderRadius: '10px', color: '#fff', outline: 'none' }}
        />
        <button type="submit" disabled={cargando} style={{ background: '#f97316', border: 'none', padding: '0 16px', borderRadius: '10px', cursor: 'pointer', color: '#000', fontWeight: 'bold', opacity: cargando ? 0.6 : 1 }}>
          <Send size={16}/>
        </button>
      </form>
    </main>
  );
}