import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Shield, Mail, Lock, ArrowRight, Sparkles, Building2, User, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setCargando(true);

    setTimeout(() => {
      const esAdmin = email.toLowerCase().includes('admin');
      const usuarioMock = {
        id: esAdmin ? 'usr-admin-01' : 'usr-colab-02',
        nombre: esAdmin ? 'Carlos Valenzuela' : 'Ana Sofía Mendoza',
        email: email || (esAdmin ? 'admin.rrhh@novatech.com' : 'colaborador@novatech.com'),
        rol: esAdmin ? 'admin_rrhh' : 'colaborador',
        puesto: esAdmin ? 'Director de Personas & Cultura' : 'Senior Software Engineer',
        departamento: esAdmin ? 'Recursos Humanos' : 'Ingeniería'
      };

      iniciarSesion(usuarioMock);
      navigate('/dashboard', { replace: true });
    }, 400);
  };

  const seleccionarDemo = (rol) => {
    if (rol === 'admin') {
      setEmail('admin.rrhh@novatech.com');
      setPassword('••••••••••••');
    } else {
      setEmail('ana.mendoza@novatech.com');
      setPassword('••••••••••••');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative'
    }}>
      {/* Luz ambiental sutil (Monocromática, cero azul) */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        width: '100%',
        maxWidth: '430px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Identidad de Marca Minimalista */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#ffffff',
            color: '#000000',
            fontWeight: '800',
            fontSize: '1.2rem',
            boxShadow: '0 4px 20px rgba(255, 255, 255, 0.12)',
            marginBottom: '16px'
          }}>
            N
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <span className="badge-corp">
              <Shield size={12} /> ENTERPRISE PLATFORM
            </span>
          </div>

          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '600',
            letterSpacing: '-0.03em',
            color: '#ffffff',
            lineHeight: 1.2
          }}>
            NovaTech
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.86rem',
            marginTop: '6px'
          }}>
            Inicia sesión para continuar en el portal
          </p>
        </div>

        {/* Card Glassmorphic Limpia */}
        <div className="ios-glass-card" style={{ padding: '32px 28px' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Input Correo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{
                fontSize: '0.78rem',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Mail size={13} style={{ color: 'var(--text-muted)' }} /> Correo electrónico
              </label>
              <input
                type="email"
                className="ios-input"
                placeholder="nombre@novatech.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Input Contraseña */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{
                  fontSize: '0.78rem',
                  fontWeight: '500',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Lock size={13} style={{ color: 'var(--text-muted)' }} /> Contraseña
                </label>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="ios-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Selector Demo Sutil */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--glass-border)',
              borderRadius: '9px',
              padding: '10px 12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={11} /> Accesos directos:
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => seleccionarDemo('admin')}
                  style={{
                    background: email.includes('admin') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: email.includes('admin') ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid var(--glass-border)',
                    color: email.includes('admin') ? '#ffffff' : 'var(--text-secondary)',
                    borderRadius: '7px',
                    padding: '6px 8px',
                    fontSize: '0.74rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Building2 size={12} /> Admin RRHH
                </button>
                <button
                  type="button"
                  onClick={() => seleccionarDemo('colaborador')}
                  style={{
                    background: !email.includes('admin') && email ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: !email.includes('admin') && email ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid var(--glass-border)',
                    color: !email.includes('admin') && email ? '#ffffff' : 'var(--text-secondary)',
                    borderRadius: '7px',
                    padding: '6px 8px',
                    fontSize: '0.74rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <User size={12} /> Colaborador
                </button>
              </div>
            </div>

            {/* Botón Principal Blanco/Monocromo de alto contraste */}
            <button
              type="submit"
              className="btn-primary"
              disabled={cargando}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '11px 16px',
                marginTop: '4px',
                opacity: cargando ? 0.7 : 1
              }}
            >
              {cargando ? 'Verificando...' : (
                <>
                  Continuar <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Pie de Card */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Link
              to="/"
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              ← Volver
            </Link>

            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Acceso seguro
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            NovaTech Solutions S.A.
          </p>
        </div>
      </div>
    </div>
  );
}
