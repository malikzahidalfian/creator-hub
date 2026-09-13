import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ children, label, onClose, busy = false }) {
  const container = useRef(null);
  const close = useRef(onClose);
  const locked = useRef(busy);
  close.current = onClose; locked.current = busy;
  useEffect(() => {
    const previous = document.activeElement;
    const root = document.getElementById('root');
    const wasInert = root.inert;
    root.inert = true;
    const controls = () => [...container.current.querySelectorAll('button, input, textarea, select, a[href], [tabindex="0"]')].filter(el => !el.disabled && el.offsetParent !== null);
    (controls()[0] || container.current).focus();
    const keydown = e => {
      if (e.key === 'Escape' && !locked.current) close.current();
      if (e.key === 'Tab') {
        const items = controls();
        const first = items[0], last = items.at(-1);
        if (!first) { e.preventDefault(); return; }
        if (e.shiftKey && (document.activeElement === first || document.activeElement === container.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); root.inert = wasInert; previous?.focus(); };
  }, []);
  return createPortal(<div className="dialog-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}><div className="dialog-shell" ref={container} role="dialog" aria-modal="true" aria-label={label} aria-busy={busy} tabIndex={-1}>{children}</div></div>, document.body);
}
