import { useEffect } from 'react';

// iOS keyboards shrink the visual viewport without always updating 100dvh.
// Preserve browser pinch zoom instead of resizing the layout while zoomed.
export function useMobileViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    let frame;
    let previousHeight = viewport?.height || window.innerHeight;
    const update = () => {
      if (viewport && Math.abs(viewport.scale - 1) > 0.05) return;
      const height = viewport?.height || window.innerHeight;
      const editing = document.activeElement?.matches('input, textarea, select, [contenteditable="true"]');
      document.documentElement.style.setProperty('--viewport-height', `${height}px`);
      document.documentElement.style.setProperty('--viewport-top', `${viewport?.offsetTop || 0}px`);
      document.body.classList.toggle('keyboard-open', Boolean(editing && (window.innerHeight - height > 120 || height < 500)));
      const shrunk = height < previousHeight - 80;
      previousHeight = height;
      if (editing && shrunk) document.activeElement.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', schedule); viewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', schedule); document.removeEventListener('focusout', schedule);
      document.documentElement.style.removeProperty('--viewport-height'); document.documentElement.style.removeProperty('--viewport-top');
      document.body.classList.remove('keyboard-open');
    };
  }, []);
}
