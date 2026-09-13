import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('Workspace render failed:', error); }
  render() {
    if (this.state.failed) return <div className="login-form-panel" style={{ minHeight: '100dvh' }}><div className="login-card"><h2>Halaman tidak dapat ditampilkan</h2><p>Terjadi kesalahan saat membaca data. Muat ulang untuk mencoba kembali.</p><button className="btn-primary" style={{ marginTop: 20 }} onClick={() => window.location.reload()}>Muat ulang</button></div></div>;
    return this.props.children;
  }
}
