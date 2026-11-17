import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import { Bot, FileText, Send } from 'lucide-react';
import { useState } from 'react';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin_rrhh';
  const [mensaje, setMensaje] = useState('');
  const [chat, setChat] = useState([
    { rol: 'assistant', texto: `Hola ${usuario?.nombre}, soy tu asistente de RRHH conectado a DeepSeek. ¿En qué te ayudo hoy?` }
  ]);

  const enviar = (e) => {
    e.preventDefault();
    if (!mensaje.trim()) return;
    setChat(prev => [...prev, { rol: 'user', texto: mensaje }, { rol: 'assistant', texto: 'Respuesta simulada del agente DeepSeek basada en las políticas de Google Drive.' }]);
    setMensaje('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <aside className="ios-glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: 'calc(100vh - 110px)' }}>
          <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18} color="#f97316"/> Políticas Oficiales</h3>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Manual de Vacaciones 2026</span>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Versión 1.2 • Google Drive</div>
          </div>
          {esAdmin && (
            <div style={{ marginTop: 'auto', padding: '12px', background: 'rgba(249,115,22,0.1)', borderRadius: '12px', border: '1px solid var(--glass-border-orange)' }}>
              <span style={{ fontSize: '0.8rem', color: '#fb923c', fontWeight: '600' }}>Panel Admin Activo</span>
            </div>
          )}
        </aside>

        <main className="ios-glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot size={20} color="#f97316" />
            <h2 style={{ fontSize: '1rem' }}>Asistente Inteligente RRHH</h2>
          </div>
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chat.map((c, i) => (
              <div key={i} style={{ alignSelf: c.rol === 'user' ? 'flex-end' : 'flex-start', background: c.rol === 'user' ? 'var(--orange-primary)' : 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '14px', maxWidth: '75%', fontSize: '0.9rem' }}>
                {c.texto}
              </div>
            ))}
          </div>
          <form onSubmit={enviar} style={{ padding: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
            <input type="text" className="ios-input" placeholder="Consulta sobre normativas o beneficios..." value={mensaje} onChange={e => setMensaje(e.target.value)} />
            <button type="submit" className="btn-orange"><Send size={16}/></button>
          </form>
        </main>
      </div>
    </div>
  );
}