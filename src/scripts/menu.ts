// The home menu: ▲▼ moves the highlight bar, ▶ / Enter opens the line.
// Hovering or tapping a line works too.
const rows = Array.from(document.querySelectorAll<HTMLAnchorElement>('.menu-row'));

if (rows.length) {
  let sel = 0;

  const select = (i: number) => {
    sel = (i + rows.length) % rows.length;
    rows.forEach((r, n) => r.classList.toggle('is-sel', n === sel));
    document.dispatchEvent(new CustomEvent('menu:select', { detail: { key: rows[sel].dataset.nav } }));
  };

  rows.forEach((r, n) => {
    r.addEventListener('mouseenter', () => select(n));
    r.addEventListener('focus', () => select(n));
    r.addEventListener('click', () => select(n));
  });

  document.addEventListener('keydown', (e) => {
    if (document.documentElement.dataset.pane !== 'menu') return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      select(sel + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      select(sel - 1);
    } else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      rows[sel].click();
    }
  });

  select(0);
}
