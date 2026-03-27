import React from 'react';

function Footer({ fullWidth = false }) {
  return (
    <footer
      className={`py-3 px-6 flex items-center justify-between ${fullWidth ? '' : 'ml-[200px]'}`}
      style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border-default)',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-primary-50)' }}
        >
          <svg className="w-3.5 h-3.5" style={{ color: '#1c3183' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span style={{ fontSize: 13, color: 'var(--color-neutral-500)' }}>Sistem Gestionare Contestații</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>
        © 2026 Dezvoltat de{' '}
        <a href="https://alcaziurobert.ro/" target="_blank" rel="noopener noreferrer"
          style={{ color: '#1c3183', fontWeight: 500, textDecoration: 'none', transition: 'opacity 150ms' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Alcaziu Robert
        </a>
      </div>
    </footer>
  );
}

export default Footer;
