import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

function Layout() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/verify')
      .then(res => {
        if (res.data.Status === 'Success') {
          setName(res.data.name);
          setLoading(false);
        } else {
          navigate('/login');
        }
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="animate-spin rounded-full border-2"
            style={{ width: 28, height: 28, borderColor: 'var(--color-primary-200)', borderTopColor: 'var(--color-primary-600)' }}
          />
          <p style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>Se încarcă...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <Sidebar />
      <Header name={name} />
      <main className="flex-1" style={{ marginLeft: 200, paddingTop: 52 }}>
        <div className="p-5">
          <Outlet context={[name, setName]} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
