import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import ColaboradorSaldos from '../components/ColaboradorSaldos';
import ColaboradorDriveDocs from '../components/ColaboradorDriveDocs';
import ColaboradorFormSolicitud from '../components/ColaboradorFormSolicitud';
import ColaboradorChatRAG from '../components/ColaboradorChatRAG';

export default function DashboardColaborador() {
  const { usuario } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', flex: 1 }}>
        
        {/* Columna Izquierda: Saldos, Documentos y Formulario de Solicitudes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ColaboradorSaldos />
          <ColaboradorFormSolicitud usuarioId={usuario?.id} />
          <ColaboradorDriveDocs />
        </div>

        {/* Columna Derecha: Chatbot RAG Inteligente */}
        <div>
          <ColaboradorChatRAG nombreUsuario={usuario?.nombre} />
        </div>

      </div>
    </div>
  );
}