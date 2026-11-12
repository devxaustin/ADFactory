// The home menu: ▲▼ moves the highlight bar, ▶ / Enter opens the line.
// Hovering or tapping a line works too.
const rows = Array.from(document.querySelectorAll<HTMLAnchorElement>('.menu-row'));

if (rows.length) {
  let sel = 0;

  const nameEl = document.querySelector<HTMLElement>('[data-menu-name]');
  const dots = Array.from(document.querySelectorAll<HTMLElement>('[data-menu-dot]'));

  const select = (i: number) => {
    sel = (i + rows.length) % rows.length;
    rows.forEach((r, n) => r.classList.toggle('is-sel', n === sel));
    if (nameEl) nameEl.textContent = rows[sel].textContent?.trim() ?? '';
    dots.forEach((d, n) => d.classList.toggle('on', n === sel));
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

  // Phones have no hover, so the highlight walks the list by itself and the model changes with it.
  // Touching anything, or swiping the model, holds it for a few seconds.
  const MOBILE = matchMedia('not all and (min-width: 1000px) and (min-height: 560px) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let holdUntil = 0;
  const hold = (ms = 9000) => (holdUntil = performance.now() + ms);
  document.addEventListener('pointerdown', () => hold(), { passive: true });
  // The object is the button: tap it to open the page it stands for.
  document.querySelector('.menu-stage')?.addEventListener('click', () => {
    if (MOBILE.matches) rows[sel].click();
  });
  document.addEventListener('stage:swipe', (e) => {
    const d = (e as CustomEvent).detail as { dir: number; pane: string };
    if (d.pane !== 'menu') return;
    hold(12000);
    select(sel + d.dir);
  });
  setInterval(() => {
    if (!MOBILE.matches || reduce.matches || document.hidden) return;
    if (document.documentElement.dataset.pane !== 'menu' || performance.now() < holdUntil) return;
    select(sel + 1);
  }, 3000);
}
