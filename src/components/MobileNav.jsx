import Icon from './Icon';

const items = [['dashboard', 'Beranda', 'grid'], ['bank_storyboard', 'Produk', 'box'], ['bang_jenggot', 'Buat', 'plus'], ['history', 'Riwayat', 'folder'], ['account', 'Akun', 'shield']];
export default function MobileNav({ activeTab, onNavigate }) {
  return <nav className="mobile-bottom-nav" aria-label="Navigasi cepat HP">{items.map(([tab, title, icon]) => <button key={tab} type="button" className={`${activeTab === tab ? 'active' : ''} ${tab === 'bang_jenggot' ? 'mobile-create' : ''}`} onClick={() => onNavigate(tab)} aria-current={activeTab === tab ? 'page' : undefined}><span><Icon name={icon} size={21} /></span><small>{title}</small></button>)}</nav>;
}
