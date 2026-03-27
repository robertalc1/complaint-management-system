import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Parolele introduse nu coincid');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/register', { name, email, password });
      if (response.status === 201) {
        setSuccess('Înregistrare reușită! Veți fi redirecționat...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || 'A apărut o eroare la înregistrare');
      } else if (err.request) {
        setError('Nu s-a putut stabili conexiunea cu serverul');
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
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div className="text-center mb-7">
            <img src="/vite.svg" alt="OCPI Logo" style={{ height: 80, width: 'auto', margin: '0 auto 16px auto', display: 'block' }} />
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-neutral-900)', lineHeight: 1.2 }}>
              Creare Cont Nou
            </h1>
            <p style={{ fontSize: 12, color: 'var(--color-neutral-400)', marginTop: 4 }}>
              SGC — Sistem Gestionare Contestații
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-neutral-800)' }}>
                Înregistrare
              </h2>
              <Link
                to="/login"
                className="flex items-center gap-1"
                style={{ fontSize: 12, color: 'var(--color-neutral-400)', textDecoration: 'none' }}
              >
                <ArrowLeftIcon style={{ width: 13, height: 13 }} />
                Înapoi
              </Link>
            </div>

            <div style={{ padding: 20 }}>
              {error && (
                <div className="alert alert-danger mb-4">
                  <ExclamationCircleIcon style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success mb-4">
                  <CheckCircleIcon style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label htmlFor="name" className="field-label">Nume complet</label>
                  <input
                    id="name" name="name" type="text" autoComplete="name" required
                    value={name} onChange={e => setName(e.target.value)}
                    className="field-input" placeholder="Nume și prenume"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="field-label">Email</label>
                  <input
                    id="email" name="email" type="email" autoComplete="email" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="field-input" placeholder="adresa@ocpi.ro"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="field-label">Parolă</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password" name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password" required
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="field-input" style={{ paddingRight: 36 }}
                      placeholder="Minim 6 caractere"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-400)', display: 'flex' }}
                    >
                      {showPassword ? <EyeSlashIcon style={{ width: 16, height: 16 }} /> : <EyeIcon style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="field-label">Confirmare parolă</label>
                  <input
                    id="confirmPassword" name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password" required
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="field-input" placeholder="Repetați parola"
                  />
                </div>

                <button
                  type="submit" disabled={loading}
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
                  ) : 'Creare cont'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--color-neutral-400)' }}>
                Deja aveți cont?{' '}
                <Link to="/login" style={{ color: 'var(--color-primary-600)', fontWeight: 500, textDecoration: 'none' }}>
                  Autentificare
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

export default Register;
