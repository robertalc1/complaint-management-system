import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import {
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

function Dashboard() {
  const [name] = useOutletContext();
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/contestatii-stats');
        if (response.data) {
          setStats({
            total: response.data.total || 0,
            approved: response.data.approved || 0,
            rejected: response.data.rejected || 0,
            pending: response.data.pending || 0,
          });
        }
      } catch {
        setError('Nu s-au putut încărca statisticile.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const approvedPct = stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;
  const rejectedPct = stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0;
  const pendingPct = 100 - approvedPct - rejectedPct;

  const pct = (n) => stats.total > 0 ? Math.round((n / stats.total) * 100) : 0;

  const statCards = [
    { label: 'Total', value: stats.total, sub: 'contestații', accent: 'stat-card-blue', labelColor: 'var(--color-primary-500)' },
    { label: 'Admise', value: stats.approved, sub: `${pct(stats.approved)}% din total`, accent: 'stat-card-green', labelColor: 'var(--color-success)' },
    { label: 'Respinse', value: stats.rejected, sub: `${pct(stats.rejected)}% din total`, accent: 'stat-card-red', labelColor: 'var(--color-danger)' },
    { label: 'În așteptare', value: stats.pending, sub: `${pct(stats.pending)}% din total`, accent: 'stat-card-amber', labelColor: 'var(--color-primary-500)' },
  ];

  const quickLinks = [
    { path: '/dashboard/contract', icon: DocumentPlusIcon, title: 'Adaugă Contract', desc: 'Completează datele contractului' },
    { path: '/dashboard/contestatii-form', icon: DocumentPlusIcon, title: 'Adaugă Contestație', desc: 'Înregistrează o contestație nouă' },
    { path: '/dashboard/filter-contestatii', icon: MagnifyingGlassIcon, title: 'Caută Contestații', desc: 'Filtrează și gestionează contestațiile' },
    { path: '/dashboard/generare-raport', icon: DocumentTextIcon, title: 'Generare Raport', desc: 'Generează rapoarte PDF filtrate' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }} className="space-y-5">

      {/* Welcome bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Bun venit, {name}</h1>
          <p className="page-subtitle capitalize" style={{ marginTop: 2 }}>{currentDate}</p>
        </div>
        <Link
          to="/dashboard/contract"
          className="btn btn-primary"
        >
          <DocumentPlusIcon style={{ width: 15, height: 15 }} />
          Adaugă Contract
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger">
          <ExclamationCircleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div>
        <p className="section-header">Statistici generale</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((card) => (
            <div key={card.label} className={`card ${card.accent}`} style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: card.labelColor }}>
                {card.label}
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-neutral-900)', lineHeight: 1.1, margin: '4px 0 2px' }}>
                {loading ? '—' : card.value}
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-neutral-400)' }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Distribution bar */}
        {stats.total > 0 && (
          <div className="card" style={{ marginTop: 10, padding: '12px 16px' }}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ fontSize: 11, color: 'var(--color-neutral-400)' }}>Distribuție contestații</p>
              <p style={{ fontSize: 11, color: 'var(--color-neutral-400)' }}>{stats.total} total</p>
            </div>
            <div style={{ height: 4, width: '100%', backgroundColor: 'var(--color-neutral-100)', borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${approvedPct}%`, backgroundColor: 'var(--color-success)', transition: 'width 300ms' }} title={`Admise: ${stats.approved}`} />
              <div style={{ width: `${rejectedPct}%`, backgroundColor: 'var(--color-danger)', transition: 'width 300ms' }} title={`Respinse: ${stats.rejected}`} />
              <div style={{ width: `${pendingPct}%`, backgroundColor: 'var(--color-warning)', transition: 'width 300ms' }} title={`În așteptare: ${stats.pending}`} />
            </div>
            <div className="flex items-center gap-4 mt-2">
              {[
                { label: 'Admise', color: 'var(--color-success)' },
                { label: 'Respinse', color: 'var(--color-danger)' },
                { label: 'În așteptare', color: 'var(--color-warning)' },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--color-neutral-500)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: l.color, display: 'inline-block' }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <p className="section-header">Acțiuni rapide</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="card flex items-center justify-between"
              style={{ padding: '14px 16px', textDecoration: 'none', transition: 'border-color 150ms, background-color 150ms' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-primary-200)';
                e.currentTarget.style.backgroundColor = 'var(--color-primary-50)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.backgroundColor = 'var(--surface-primary)';
              }}
            >
              <div className="flex items-center gap-3">
                <item.icon style={{ width: 18, height: 18, color: 'var(--color-neutral-400)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-neutral-800)' }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-neutral-400)', marginTop: 1 }}>{item.desc}</p>
                </div>
              </div>
              <ArrowRightIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-300)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
