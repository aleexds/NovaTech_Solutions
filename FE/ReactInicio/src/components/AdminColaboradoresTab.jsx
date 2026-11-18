import { useState } from 'react';
import { Search, Loader2, Mail, Shield, UserCheck, Briefcase, Building2, Calendar } from 'lucide-react';

export default function AdminColaboradoresTab() {
  const [colaboradores, setColaboradores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const fetchColaboradores = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/admin/colaboradores');
      const data = await res.json();
      if (data.exito) {
        setColaboradores(data.colaboradores);
      }
    } catch (error) {
      console.error('Error cargando colaboradores desde MySQL:', error);
    } finally {
      setCargando(false);
    }
  };

  useState(() => {
    fetchColaboradores();
  });

  const getIniciales = (nombre = 'Colaborador') => {
    return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    const partes = fechaStr.split('T')[0].split('-');
    if (partes.length < 3) return fechaStr;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${partes[2]} ${meses[parseInt(partes[1]) - 1]} ${partes[0]}`;
  };

  const colaboradoresFiltrados = colaboradores.filter(c => 
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.departamento?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.puesto?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Buscador de Colaboradores en MySQL */}
      <div className="ios-glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="ios-input"
            placeholder="Buscar por nombre, puesto, departamento o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ paddingLeft: '38px', paddingRight: '14px' }}
          />
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Mostrando <strong>{colaboradoresFiltrados.length}</strong> de {colaboradores.length} colaboradores
        </div>
      </div>

      {/* Tabla de Directorio */}
      <div className="ios-glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600' }}>Colaborador</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600' }}>Departamento</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600' }}>Puesto</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600' }}>Ingreso</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600' }}>Días Vacaciones</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600' }}>Rol</th>
              </tr>
            </thead>
            <tbody>
              {colaboradoresFiltrados.map((c, i) => (
                <tr 
                  key={c.id || i}
                  style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar-initials">
                        {getIniciales(c.nombre)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{c.nombre}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>{c.departamento}</td>
                  <td style={{ padding: '12px 18px', color: '#fff' }}>{c.puesto}</td>
                  <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>{formatearFecha(c.fecha_ingreso)}</td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{ 
                      fontWeight: '600', 
                      color: c.diasVacaciones >= 20 ? '#f43f5e' : '#fff',
                      background: c.diasVacaciones >= 20 ? 'rgba(244, 63, 94, 0.1)' : 'transparent',
                      padding: c.diasVacaciones >= 20 ? '2px 8px' : '0',
                      borderRadius: '4px'
                    }}>
                      {c.diasVacaciones} días
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <span className="badge-corp" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>
                      {c.rol === 'admin_rrhh' ? 'Admin RRHH' : 'Colaborador'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
