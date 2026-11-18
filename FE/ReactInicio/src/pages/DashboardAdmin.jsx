import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import AdminKPIs from '../components/AdminKPIs';
import AdminSolicitudesTable from '../components/AdminSolicitudesTable';
import AdminResumenEjecutivo from '../components/AdminResumenEjecutivo';
import AdminColaboradoresTab from '../components/AdminColaboradoresTab';
import AdminToast from '../components/AdminToast';
import { ShieldCheck, Loader2, LayoutDashboard, Users } from 'lucide-react';

export default function DashboardAdmin() {
  const { usuario } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('dashboard'); // 'dashboard' o 'colaboradores'
  const [toast, setToast] = useState({ mensaje: '', tipo: 'exito' });

  const [datos, setDatos] = useState({
    kpis: { totalColaboradores: 0, incapacidadesHoy: 0, pendientes: 0, riesgoPasivo: 0 },
    solicitudes: [],
    resumenEjecutivo: ''
  });

  const mostrarToast = (mensaje, tipo = 'exito') => {
    setToast({ mensaje, tipo });
    setTimeout(() => {
      setToast({ mensaje: '', tipo: 'exito' });
    }, 4000);
  };

  // Función reutilizable para refrescar los datos
  const cargarDatosReales = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/dashboard');
      const resultado = await response.json();
      if (resultado.exito) {
        setDatos(resultado);
      }
    } catch (error) {
      console.error('Error conectando con el backend para el dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // Definimos y llamamos la carga de forma asíncrona controlada para satisfacer a ESLint
    const obtenerDatosIniciales = async () => {
      await cargarDatosReales();
    };
    obtenerDatosIniciales();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        
        {/* Cabecera Corporativa */}
        <div className="ios-glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Panel Directivo de Recursos Humanos</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Datos en tiempo real sincronizados desde Supabase y Agente Analista.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="badge-corp">
              <ShieldCheck size={16} /> Rol: {usuario?.rol}
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación del Panel */}
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${vistaActiva === 'dashboard' ? 'active' : ''}`}
            onClick={() => setVistaActiva('dashboard')}
          >
            <LayoutDashboard size={16} /> Resumen General
          </button>
          <button 
            className={`nav-tab ${vistaActiva === 'colaboradores' ? 'active' : ''}`}
            onClick={() => setVistaActiva('colaboradores')}
          >
            <Users size={16} /> Directorio de Colaboradores
          </button>
        </div>

        {cargando ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px', color: 'var(--accent-primary)', gap: '10px' }}>
            <Loader2 className="animate-spin" size={28} /> Sincronizando con base de datos...
          </div>
        ) : (
          <>
            {vistaActiva === 'dashboard' ? (
              <>
                {/* KPIs con datos reales */}
                <AdminKPIs kpis={datos.kpis} />

                {/* Solicitudes y Resumen Ejecutivo */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                  <AdminSolicitudesTable 
                    solicitudes={datos.solicitudes} 
                    onActualizar={cargarDatosReales} 
                    onMostrarToast={mostrarToast}
                  />
                  <AdminResumenEjecutivo resumen={datos.resumenEjecutivo} />
                </div>
              </>
            ) : (
              <AdminColaboradoresTab />
            )}
          </>
        )}

      </div>

      {/* Sistema de Notificaciones Toast Flotantes */}
      <AdminToast 
        mensaje={toast.mensaje} 
        tipo={toast.tipo} 
        onClose={() => setToast({ mensaje: '', tipo: 'exito' })} 
      />
    </div>
  );
}