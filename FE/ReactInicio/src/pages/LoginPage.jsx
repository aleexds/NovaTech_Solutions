import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const esAdmin = email.includes('admin');
    const usuarioMock = {
      id: 'usr-001',
      nombre: esAdmin ? 'Carlos Administrador' : 'Ana Colaboradora',
      email: email || 'colaborador@novatech.com',
      rol: esAdmin ? 'admin_rrhh' : 'colaborador',
      puesto: esAdmin ? 'Director de RRHH' : 'Desarrollador FullStack',
      departamento: 'Tecnología'
    };
    iniciarSesion(usuarioMock);
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh', padding: '20px' }}>
      <form onSubmit={handleLogin} className="ios-glass-card" style={{ padding: '36px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', textAlign: 'center' }}>Acceso NovaTech</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Correo Electrónico</label>
          <input type="email" className="ios-input" placeholder="tu.correo@novatech.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Contraseña</label>
          <input type="password" className="ios-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn-orange" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Entrar al Portal</button>
      </form>
    </div>
  );
}