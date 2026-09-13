import { useRef, useState } from 'react';
import { appFetch } from '../lib/client';
import PasswordField from './PasswordField';
import Icon from './Icon';

export default function AccountSettings({ onOpenApi }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const submitting = useRef(false);
  const validLength = newPassword.length >= 12 && newPassword.length <= 128 && newPassword.trim().length > 0;
  const matches = Boolean(confirmation) && newPassword === confirmation;
  const canSubmit = currentPassword && validLength && matches && newPassword !== currentPassword;
  const submit = async e => {
    e.preventDefault();
    if (!canSubmit || submitting.current) return;
    submitting.current = true; setBusy(true); setFeedback(null);
    try {
      const response = await appFetch('/api/auth', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword, confirmPassword: confirmation }) });
      const result = await response.json();
      setCurrentPassword(''); setNewPassword(''); setConfirmation('');
      setFeedback({ success: true, message: result.message });
    } catch (error) { setFeedback({ success: false, message: error.message }); }
    finally { submitting.current = false; setBusy(false); }
  };
  return <div className="content-wrapper fade-in"><section className="content-panel account-panel">
    <span className="eyebrow">WORKSPACE PRIBADI</span><h2 className="desktop-title">Akun & Keamanan</h2><p className="subtitle">Kelola akses workspace Anda, langsung dari perangkat ini.</p>
    <div className="account-grid">
      <section className="glass-panel password-card" aria-labelledby="password-heading">
        <div className="settings-card-heading"><span className="icon-tile indigo"><Icon name="shield" size={23} /></span><div><h3 id="password-heading">Ganti password</h3><p>Gunakan password yang unik dan sulit ditebak.</p></div></div>
        <form onSubmit={submit} className="password-form">
          <PasswordField id="current-password" label="Password saat ini" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Masukkan password yang digunakan sekarang" maxLength={1024} required disabled={busy} />
          <PasswordField id="new-password" label="Password baru" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimal 12 karakter" minLength={12} maxLength={128} required disabled={busy} aria-describedby="password-rules" />
          <ul className="password-rules" id="password-rules"><li className={validLength ? 'satisfied' : ''}><Icon name="check" size={16} />12–128 karakter; boleh menggunakan frasa panjang.</li><li className={newPassword && newPassword !== currentPassword ? 'satisfied' : ''}><Icon name="check" size={16} />Berbeda dari password saat ini.</li></ul>
          <PasswordField id="confirm-password" label="Konfirmasi password baru" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="Ketik ulang password baru" maxLength={128} required disabled={busy} aria-invalid={Boolean(confirmation && !matches)} aria-describedby={confirmation && !matches ? 'password-mismatch' : undefined} />
          {confirmation && !matches && <p className="field-error" id="password-mismatch">Konfirmasi password belum sama.</p>}
          {feedback && <div className={feedback.success ? 'form-success' : 'form-error'} role={feedback.success ? 'status' : 'alert'}><Icon name={feedback.success ? 'check' : 'shield'} size={19} /><p>{feedback.message}</p></div>}
          <button type="submit" className="btn-primary" disabled={!canSubmit || busy}>{busy ? <><span className="loading-spinner" />Menyimpan password...</> : <><Icon name="shield" size={18} />Simpan password baru</>}</button>
          <p className="help-text">Anda tetap masuk di perangkat ini. Perangkat lain harus login kembali dengan password baru.</p>
        </form>
      </section>
      <aside className="account-info">
        <section className="glass-panel"><span className="icon-tile teal"><Icon name="shield" size={22} /></span><h3>Akses tetap terlindungi</h3><p>Password disimpan sebagai hash, bukan teks asli. Perubahan tetap berlaku setelah server dinyalakan ulang.</p><p>Jangan gunakan password yang sama dengan akun email atau layanan lain. Simpan di pengelola password Anda.</p></section>
        <button className="account-shortcut glass-panel" onClick={onOpenApi}><span className="icon-tile violet"><Icon name="settings" size={22} /></span><span><strong>Pengaturan API</strong><small>Kelola kunci layanan AI Anda</small></span><Icon name="arrow" size={18} /></button>
      </aside>
    </div>
  </section></div>;
}
