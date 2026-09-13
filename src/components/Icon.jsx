const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  film: 'M4 3h16v18H4z M4 8h16 M4 16h16 M8 3v18 M16 3v18',
  box: 'm3 7 9-4 9 4-9 4-9-4z M3 7v10l9 4 9-4V7 M12 11v10 M7 5l10 4',
  text: 'M4 5h16 M12 5v14 M8 19h8',
  news: 'M5 3h16v18H5z M5 7H2v12a2 2 0 0 0 2 2 M9 7h8 M9 11h8 M9 15h3 M9 18h8',
  folder: 'M3 7V4h6l2 3h10v13H3z',
  settings: 'M4 7h16 M4 17h16 M9 4v6 M15 14v6',
  arrow: 'M5 12h14 m-5-5 5 5-5 5',
  plus: 'M12 5v14 M5 12h14',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z',
  clock: 'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  image: 'M3 3h18v18H3z m0 14 6-6 5 5 3-3 4 4 M16 7h.01',
  audio: 'M4 9v6 M8 5v14 M12 2v20 M16 5v14 M20 9v6',
  link: 'm10 13 4-4 M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0 M16 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
  logout: 'M9 4H3v16h6 M9 12h12 m-4-4 4 4-4 4',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  close: 'm6 6 12 12 M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3z m-4 9 3 3 5-6',
  refresh: 'M20 7a9 9 0 1 0 1 8 M20 3v5h-5',
  eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  eyeOff: 'm3 3 18 18 M10 5c7-2 12 7 12 7s-1 3-4 5 M6 6C3 8 2 12 2 12s3 7 10 7c2 0 4-1 5-2 M9 9a4 4 0 0 0 6 6'
};
export default function Icon({ name = 'spark', size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.spark} /></svg>;
}
