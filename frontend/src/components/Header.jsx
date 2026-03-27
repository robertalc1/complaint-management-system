import React from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard/contract': 'Adaugă Contract',
  '/dashboard/contestatii-form': 'Adaugă Contestație',
  '/dashboard/filter-contestatii': 'Editează Contestații',
  '/dashboard/generare-raport': 'Generare Raport',
};

const Header = ({ name }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = (() => {
    if (location.pathname.startsWith('/dashboard/edit-contestatie')) return 'Editare Contestație';
    return ROUTE_TITLES[location.pathname] || 'SGC';
  })();

  const handleLogout = async () => {
    try {
      const res = await axios.get('/logout');
      if (res.data.Status === 'Success') navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-5"
      style={{
        left: 200,
        height: 52,
        backgroundColor: 'var(--surface-primary)',
        borderBottom: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Page title / breadcrumb */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-neutral-700)' }}>
          {pageTitle}
        </span>
      </div>

      {/* User + logout */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1"
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-neutral-50)',
          }}
        >
          <UserCircleIcon style={{ width: 14, height: 14, color: 'var(--color-neutral-400)' }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-neutral-600)' }}>
            {name || 'Utilizator'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-1"
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--surface-primary)',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--color-neutral-600)',
            cursor: 'pointer',
            transition: 'background-color 150ms',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-neutral-50)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--surface-primary)'}
          title="Deconectare"
        >
          <ArrowRightOnRectangleIcon style={{ width: 14, height: 14 }} />
          Deconectare
        </button>
      </div>
    </header>
  );
};

export default Header;
