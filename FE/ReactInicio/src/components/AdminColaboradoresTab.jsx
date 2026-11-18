import { useState, useEffect } from 'react';
import { Search, Loader2, Mail, Shield, UserCheck, Briefcase, Building2, Calendar } from 'lucide-react';

export default function AdminColaboradoresTab() {
  const [colaboradores, setColaboradores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/admin/colaboradores');
        const data = await res.json();
        if (data.exito) {
          setColaboradores(data.colaboradores);
        }
      } catch (error) {
        console.error('Error cargando colaboradores:', error);
      } finally {
        setCargando(false);
      }
    };
    fetchColaboradores();
  }, []);

  const getIniciales = (nombre = 'Colaborador') => {
    return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const partes = fechaStr.split('T')[0].split('-');
    if (partes.length < 3) return fechaStr;
    return `${partes[2]} ${meses[parseInt(partes[1]) - 1]} ${partes[0]}`;
  };

  const colaboradoresFiltrados = colaboradores.filter(c => 
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.departamento?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.puesto?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px', color: 'var(--accent-primary)', gap: '10px' }}>
        <Loader2 className="animate-spin" size={24} /> Sincronizando directorio desde Supabase...
      </div>
    );
  }

  return (
    <div className="ios-glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Cabecera y Buscador */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Directorio General de Colaboradores ({colaboradores.length})</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Información sincronizada en tiempo real con la base de datos de Supabase.</p>
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text"
            placeholder="Buscar por nombre, correo, puesto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="ios-input"
            style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Tabla Corporativa Organizada */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              <th style={{ padding: '12px 10px' }}>Colaborador</th>
              <th style={{ padding: '12px 10px' }}>Departamento</th>
              <th style={{ padding: '12px 10px' }}>Puesto</th>
              <th style={{ padding: '12px 10px' }}>Ingreso</th>
              <th style={{ padding: '12px 10px' }}>Rol</th>
              <th style={{ padding: '12px 10px' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {colaboradoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No se encontraron colaboradores con ese criterio de búsqueda.
                </td>
              </tr>
            ) : (
              colaboradoresFiltrados.map((c, index) => (
                <tr 
                  key={c.id || index}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Columna Colaborador (Nombre + Correo debajo) */}
                  <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar-initials">{getIniciales(c.nombre)}</div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{c.nombre || 'Sin nombre'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Mail size={12} style={{ opacity: 0.7 }} /> {c.email || 'Sin correo'}
                      </div>
                    </div>
                  </td>

                  {/* Departamento */}
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Building2 size={13} style={{ opacity: 0.6 }} /> {c.departamento || 'General'}
                    </span>
                  </td>

                  {/* Puesto */}
                  <td style={{ padding: '12px 10px', color: 'var(--text-main)', fontWeight: '500' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Briefcase size={13} style={{ opacity: 0.6, color: 'var(--accent-primary)' }} /> {c.puesto || 'Colaborador'}
                    </span>
                  </td>

                  {/* Fecha de Ingreso */}
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={13} style={{ opacity: 0.6 }} /> {formatearFecha(c.fecha_ingreso)}
                    </span>
                  </td>

                  {/* Rol */}
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-primary)', background: 'var(--accent-soft)', padding: '3px 8px', borderRadius: '6px' }}>
                      <Shield size={11} /> {c.rol || 'colaborador'}
                    </span>
                  </td>

                  {/* Estado */}
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.73rem', fontWeight: '600', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '3px 8px', borderRadius: '99px', textTransform: 'capitalize' }}>
                      <UserCheck size={11} /> {c.estado || 'activo'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}