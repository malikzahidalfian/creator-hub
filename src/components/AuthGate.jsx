import { useEffect, useState } from 'react';
import { appFetch } from '../lib/client';
import Icon from './Icon';

export default function AuthGate({ children }) {
  const [status, setStatus] = useState('loading');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let mounted = true;
    appFetch('/api/auth').then(r => r.json()).then(data => {
      if (!mounted) return;
      setStatus(data.authenticated ? 'ready' : 'login');
      if (!data.configured) setError('Server belum dikonfigurasi. Atur APP_PASSWORD dan SESSION_SECRET sesuai README.');
    }).catch(e => { if (mounted) { setError(e.message); setStatus('login'); } });
    const expire = () => { setStatus('login'); setError('Sesi berakhir. Silakan masuk kembali.'); };
    window.addEventListener('session-expired', expire);
    return () => { mounted = false; window.removeEventListener('session-expired', expire); };
  }, []);
  const logout = async () => {
    await appFetch('/api/auth', { method: 'DELETE' });
    setPassword(''); setError(''); setStatus('login');
  };
  const login = async e => {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true); setError('');
    try {
      await appFetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      setPassword(''); setStatus('ready');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  if (status === 'ready') return children(logout);
  return <div className="login-layout">
    <section className="login-brand-panel">
      <div className="brand"><span className="brand-mark"><Icon name="film" size={24} /></span><span>Creator Hub<span className="brand-ai">AI</span></span></div>
      <div className="login-intro"><span className="eyebrow">YOUR CREATIVE WORKSPACE</span><h1>Ide yang hebat.<br />Konten yang<br /><span>berdampak.</span></h1><p>Dari produk menjadi cerita. Kelola aset, susun storyboard, dan kembangkan konten dalam satu ruang kerja.</p>
        <div className="login-features"><span><Icon name="film" /> Storyboard AI</span><span><Icon name="text" /> Threads & naskah</span><span><Icon name="folder" /> Aset terorganisir</span></div>
      </div>
      <p className="login-footer">Creator Hub AI · Ruang kerja kreator</p>
    </section>
    <section className="login-form-panel">
      <div className="login-card">
        <span className="login-symbol"><Icon name="shield" size={28} /></span>
        <span className="eyebrow">SELAMAT DATANG KEMBALI</span>
        <h2>Masuk ke workspace</h2><p>Lanjutkan ide dan karya Anda berikutnya.</p>
        {status === 'loading' ? <div className="loading-state" role="status"><span className="loading-spinner" /> Memeriksa sesi...</div> : <form onSubmit={login}>
          <div className="input-group"><label htmlFor="login-password">Password workspace</label><input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password Anda" autoComplete="current-password" required autoFocus aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} /></div>
          {error && <p className="form-error" id="login-error" role="alert">{error}</p>}
          <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Memverifikasi...' : 'Masuk ke workspace'}<Icon name="arrow" size={18} /></button>
        </form>}
        <p className="login-security"><Icon name="shield" size={15} /> Sesi aman · Akses khusus pemilik workspace</p>
      </div>
    </section>
  </div>;
}
