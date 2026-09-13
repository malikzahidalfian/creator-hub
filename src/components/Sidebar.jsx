import { useEffect, useRef } from 'react';
import Icon from './Icon';

export const navigation = [
  { label: 'WORKSPACE', items: [['dashboard', 'Dashboard', 'grid'], ['bank_storyboard', 'Data Produk', 'box'], ['history', 'Database Konten', 'folder']] },
  { label: 'STUDIO KONTEN', items: [['bang_jenggot', 'Bang Jenggot AI', 'film'], ['storyboard', 'Storyboard Veo', 'film'], ['cooking_content', 'Konten Masak', 'spark'], ['ugc', 'UGC Studio', 'spark'], ['thread', 'Threads Affiliate', 'text'], ['gen_thread', 'Threads Artikel', 'news']] },
  { label: 'ALAT KREATIF', items: [['video_script', 'Script Video', 'film'], ['image_gen', 'AI Image', 'image'], ['bank_gambar', 'Bank Gambar', 'image'], ['tts', 'Text to Speech', 'audio'], ['tiktok', 'TikTok Scraper', 'link']] }
];
export function pageTitle(tab) {
  return navigation.flatMap(group => group.items).find(item => item[0] === tab)?.[1] || 'Pengaturan API';
}

export default function Sidebar({ activeTab, onNavigate, open, onClose, apiReady }) {
  const sidebar = useRef(null);
  const closeButton = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    closeButton.current?.focus();
    const keydown = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const buttons = [...sidebar.current.querySelectorAll('button')].filter(el => el.offsetParent !== null);
        const first = buttons[0], last = buttons.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [open]);
  return <>
    {open && <div className="mobile-overlay" onClick={onClose} aria-hidden="true" />}
    <aside id="workspace-navigation" className={`sidebar ${open ? 'open' : ''}`} ref={sidebar}>
      <div className="brand"><span className="brand-mark"><Icon name="film" size={23} /></span><span>Creator Hub<span className="brand-ai">AI</span><small>CREATOR WORKSPACE</small></span><button ref={closeButton} className="sidebar-close icon-button" aria-label="Tutup navigasi" onClick={onClose}><Icon name="close" /></button></div>
      <nav className="sidebar-nav" aria-label="Navigasi utama">
        {navigation.map(group => <div className="nav-group" key={group.label}><p className="nav-group-label">{group.label}</p>{group.items.map(([id, label, icon]) => <button key={id} className={`nav-item ${id === activeTab ? 'active' : ''}`} aria-current={id === activeTab ? 'page' : undefined} onClick={() => onNavigate(id)}><Icon name={icon} size={19} /><span>{label}</span>{id === activeTab && <span className="nav-active-dot" />}</button>)}</div>)}
      </nav>
      <div className="sidebar-bottom">
        <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => onNavigate('settings')} aria-current={activeTab === 'settings' ? 'page' : undefined}><Icon name="settings" size={19} />Pengaturan API<span className={`status-dot ${apiReady ? 'ready' : ''}`} /></button>
        <div className="workspace-profile"><div className="profile-avatar">C</div><div><strong>Creator Workspace</strong><small>Ruang kerja kreator</small></div></div>
      </div>
    </aside>
  </>;
}
