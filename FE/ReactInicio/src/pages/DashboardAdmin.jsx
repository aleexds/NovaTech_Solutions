import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import AdminKPIs from '../components/AdminKPIs';
import AdminSolicitudesTable from '../components/AdminSolicitudesTable';
import AdminResumenEjecutivo from '../components/AdminResumenEjecutivo';
import AdminGraficosReportes from '../components/AdminGraficosReportes';
import AdminColaboradoresTab from '../components/AdminColaboradoresTab';
import AdminToast from '../components/AdminToast';
import { ShieldCheck, Loader2, LayoutDashboard, Users, RefreshCw } from 'lucide-react';

export default function DashboardAdmin() {
  const { usuario } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [ejecutandoAnalista, setEjecutandoAnalista] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  const [toast, setToast] = useState({ mensaje: '', tipo: 'exito' });

  const [datos, setDatos] = useState({
    kpis: { totalColaboradores: 0, incapacidadesHoy: 0, pendientes: 0, riesgoPasivo: 0 },
    solicitudes: [],
    resumenEjecutivo: '',
    reporteActual: null,
    historialReportes: []
  });

  const mostrarToast = (mensaje, tipo = 'exito') => {
    setToast({ mensaje, tipo });
    setTimeout(() => {
      setToast({ mensaje: '', tipo: 'exito' });
    }, 4000);
  };

  const cargarDatosReales = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/dashboard');
      const resultado = await response.json();
      if (resultado.exito) {
        setDatos(resultado);
      }
    } catch (error) {
      console.error('Error conectando con el backend para el dashboard:', error);
      mostrarToast('Error conectando con el servidor', 'error');
    } finally {
      setCargando(false);
    }
  };

  const forzarReporteAnalista = async () => {
    setEjecutandoAnalista(true);
    try {
      const res = await fetch('http://localhost:4000/api/admin/ejecutar-reporte-analista', {
        method: 'POST'
      });
      const resJson = await res.json();
      if (resJson.exito) {
        mostrarToast('¡Nuevo reporte diario redactado por el Agente Analista!');
        await cargarDatosReales();
      }
    } catch (err) {
      mostrarToast('Error ejecutando agente analista', 'error');
    } finally {
      setEjecutandoAnalista(false);
    }
  };

  useEffect(() => {
    cargarDatosReales();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      <Navbar />

      <div style={{ padding: '24px 20px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        
        {/* Cabecera Corporativa Monocromática */}
        <div className="ios-glass-card" style={{ padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>
              Panel Directivo de Recursos Humanos
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Métricas ejecutivas en tiempo real desde MySQL • Reportes redactados por el Agente Analista
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={forzarReporteAnalista}
              disabled={ejecutandoAnalista}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            >
              <RefreshCw size={14} className={ejecutandoAnalista ? "animate-spin" : ""} /> 
              {ejecutandoAnalista ? 'Analizando...' : 'Generar Reporte Diario'}
            </button>
            <div className="badge-corp">
              <ShieldCheck size={15} /> Rol: {usuario?.rol || 'admin_rrhh'}
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación del Panel */}
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${vistaActiva === 'dashboard' ? 'active' : ''}`}
            onClick={() => setVistaActiva('dashboard')}
          >
            <LayoutDashboard size={16} /> Resumen Ejecutivo & Gráficos
          </button>
          <button 
            className={`nav-tab ${vistaActiva === 'colaboradores' ? 'active' : ''}`}
            onClick={() => setVistaActiva('colaboradores')}
          >
            <Users size={16} /> Directorio de Colaboradores (MySQL)
          </button>
        </div>

        {cargando ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px', color: '#fff', gap: '10px' }}>
            <Loader2 className="animate-spin" size={26} /> Sincronizando con base de datos MySQL...
          </div>
        ) : (
          <>
            {vistaActiva === 'dashboard' ? (
              <>
                {/* 4 Indicadores Numéricos Obligatorios */}
                <AdminKPIs kpis={datos.kpis} />

                {/* 2 Gráficos (Tendencia de 30 días y Ausencias) + Historial de Reportes */}
                <AdminGraficosReportes 
                  reporteActual={datos.reporteActual}
                  reportesHistorial={datos.historialReportes}
                  onSeleccionarReporte={(rep) => {
                    setDatos(prev => ({
                      ...prev,
                      reporteActual: rep,
                      resumenEjecutivo: rep.resumen_texto
                    }));
                    mostrarToast(`Viendo reporte del ${rep.fecha}`);
                  }}
                />

                {/* Tabla de Solicitudes Pendientes + Resumen Ejecutivo del LLM */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px' }}>
                  <AdminSolicitudesTable 
                    solicitudes={datos.solicitudes} 
                    onActualizar={cargarDatosReales} 
                    mostrarToast={mostrarToast} 
                  />
                  <AdminResumenEjecutivo 
                    resumen={datos.resumenEjecutivo} 
                    datosReporte={datos.reporteActual?.datos_json} 
                  />
                </div>
              </>
            ) : (
              <AdminColaboradoresTab />
            )}
          </>
        )}
      </div>

      <AdminToast mensaje={toast.mensaje} tipo={toast.tipo} />
    </div>
  );
}
