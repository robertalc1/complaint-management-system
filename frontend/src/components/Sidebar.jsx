import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  FolderPlusIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: HomeIcon, title: 'Dashboard' },
    { path: '/dashboard/contract', icon: FolderPlusIcon, title: 'Adaugă Contract' },
    { path: '/dashboard/contestatii-form', icon: ClipboardDocumentListIcon, title: 'Adaugă Contestație' },
    { path: '/dashboard/filter-contestatii', icon: MagnifyingGlassIcon, title: 'Editează Contestații' },
    { path: '/dashboard/generare-raport', icon: DocumentTextIcon, title: 'Generare Raport' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex flex-col" style={{ width: 200, backgroundColor: '#f8f7f6', borderRight: '1px solid #e4e3e0' }}>
      {/* Logo area */}
      <div className="flex items-center gap-2.5 px-4 py-3.5" style={{ borderBottom: '1px solid #e4e3e0', minHeight: 52 }}>
        <img src="/vite.svg" alt="OCPI" style={{ height: 32, width: 'auto', flexShrink: 0 }} />
        <div>
          <p className="font-semibold leading-tight" style={{ fontSize: 12, color: '#221923' }}>SGC</p>
          <p style={{ fontSize: 9, color: 'rgba(34,25,35,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>OCPI Constanța</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(34,25,35,0.35)', padding: '0 8px', marginBottom: 6 }}>
          Navigare
        </p>
        <div className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: active ? '2px solid #1c3183' : '2px solid transparent',
                  backgroundColor: active ? 'rgba(28,49,131,0.08)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background-color 150ms',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(28,49,131,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Icon
                  style={{
                    width: 16,
                    height: 16,
                    flexShrink: 0,
                    color: active ? '#1c3183' : 'rgba(34,25,35,0.45)',
                  }}
                />
                <span style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#1c3183' : '#221923',
                }}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom version */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #e4e3e0' }}>
        <p style={{ fontSize: 9, color: 'rgba(34,25,35,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>v2.0 · 2026</p>
      </div>
    </aside>
  );
}

export default Sidebar;
