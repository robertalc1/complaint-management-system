import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer';
import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('/login', { email, password });
      if (response.data.Status === 'Success') {
        navigate('/dashboard');
      } else {
        setError(response.data.Error || 'Autentificare eșuată');
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.Error || 'Email sau parolă invalidă');
      } else if (err.request) {
        setError('Nu s-a primit răspuns de la server. Verificați conexiunea.');
      } else {
        setError('Eroare: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--surface-secondary)' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Card */}
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Institution header */}
          <div className="text-center mb-7">
            <img src="/vite.svg" alt="OCPI Logo" style={{ height: 80, width: 'auto', margin: '0 auto 16px auto', display: 'block' }} />
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-neutral-900)', lineHeight: 1.2 }}>
              SGC — Sistem Gestionare Contestații
            </h1>
            <p style={{ fontSize: 12, color: 'var(--color-neutral-400)', marginTop: 4 }}>
              Oficiul de Cadastru și Publicitate Imobiliară
            </p>
          </div>

          {/* Form card */}
          <div
            style={{
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-neutral-800)' }}>
                Autentificare
              </h2>
            </div>

            <div style={{ padding: '20px' }}>
              {error && (
                <div className="alert alert-danger mb-4">
                  <ExclamationCircleIcon style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-field mb-0">
                  <label htmlFor="email" className="field-label">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="field-input"
                    placeholder="adresa@ocpi.ro"
                  />
                </div>

                <div className="form-field mb-0">
                  <label htmlFor="password" className="field-label">
                    Parolă
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="field-input"
                      style={{ paddingRight: 36 }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-neutral-400)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showPassword
                        ? <EyeSlashIcon style={{ width: 16, height: 16 }} />
                        : <EyeIcon style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', height: 38, marginTop: 4 }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" style={{ width: 14, height: 14 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Se procesează...
                    </>
                  ) : 'Autentificare'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--color-neutral-400)' }}>
                Nu aveți cont?{' '}
                <Link to="/register" style={{ color: 'var(--color-primary-600)', fontWeight: 500, textDecoration: 'none' }}>
                  Înregistrare
                </Link>
              </p>
            </div>
          </div>

        </div>
      </div>
      <Footer fullWidth />
    </div>
  );
}

export default Login;
