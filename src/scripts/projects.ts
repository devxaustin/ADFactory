// Projects screen: a category menu that opens into a project list on the same page.
//   browse: pick a category (the 3D model floats beside the list)
//   open:   the model slides aside, that category's projects and a detail panel animate in
// Keys: up/down select, right/enter open or go, left/esc/backspace back. Esc from "browse" still
// returns to the home menu, because the router handles it.
// The 3D side listens for the `proj:state` event this script sends (see models.ts).
import { burst } from './static';

const pane = document.querySelector<HTMLElement>('.pane[data-pane="projects"]');

if (pane) {
  const crt = document.getElementById('crt-static') as HTMLCanvasElement | null;
  const catList = pane.querySelector<HTMLElement>('.proj-cats');
  const catRows = Array.from(pane.querySelectorAll<HTMLButtonElement>('.proj-cats .proj-row'));
  const views = Array.from(pane.querySelectorAll<HTMLElement>('.proj-view'));
  const back = pane.querySelector<HTMLButtonElement>('[data-proj-back]');
  const crumb = pane.querySelector<HTMLElement>('[data-crumb]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  let level: 'browse' | 'open' = 'browse';
  let ci = 0; // selected category
  let gi = 0; // selected project in the open category

  const rgb = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return `${n >> 16} ${(n >> 8) & 255} ${n & 255}`;
  };
  const games = (i = ci) => Array.from(views[i]?.querySelectorAll<HTMLButtonElement>('.proj-glist .proj-row') ?? []);
  const details = (i = ci) => Array.from(views[i]?.querySelectorAll<HTMLElement>('.proj-detail') ?? []);

  // Slide a list's highlight bar behind a row (measured on the row's <li>, whose parent is the list).
  function placeRow(list: Element | null | undefined, row: HTMLElement | undefined) {
    const li = row?.parentElement;
    if (!list || !li || !li.offsetHeight) return;
    (list as HTMLElement).style.setProperty('--hl-y', `${li.offsetTop}px`);
    (list as HTMLElement).style.setProperty('--hl-h', `${li.offsetHeight}px`);
  }
  function placeAll() {
    placeRow(catList, catRows[ci]);
    const v = views[ci];
    placeRow(v?.querySelector('.proj-glist'), games()[gi]);
  }

  function applyTheme(i: number) {
    const d = catRows[i]?.dataset;
    if (!d || !d.accent) return;
    const s = document.documentElement.style; // the colour field sits outside the pane, so the theme lives on <html>
    s.setProperty('--accent', d.accent);
    s.setProperty('--accent-rgb', rgb(d.accent));
    s.setProperty('--accent2', d.accent2 ?? d.accent);
    s.setProperty('--accent2-rgb', rgb(d.accent2 ?? d.accent));
    s.setProperty('--on-accent', d.on ?? '#000');
    if (d.bgA) s.setProperty('--bg-a', d.bgA);
    if (d.bgB) s.setProperty('--bg-b', d.bgB);
    const root = document.documentElement;
    const changed = root.dataset.projCat !== d.cat;
    root.dataset.projCat = d.cat ?? '';
    root.dataset.projTheme = d.theme ?? 'xbox';
    if (changed && crt && !reduce.matches && root.dataset.pane === 'projects') burst(crt, 60);
  }

  function emit() {
    const d = catRows[ci]?.dataset;
    document.dispatchEvent(new CustomEvent('proj:state', { detail: { level, cat: d?.cat, accent: d?.accent } }));
  }

  function selectCat(i: number) {
    if (!catRows.length) return;
    ci = (i + catRows.length) % catRows.length;
    catRows.forEach((r, n) => {
      r.classList.toggle('is-sel', n === ci);
      if (n === ci) r.setAttribute('aria-current', 'true');
      else r.removeAttribute('aria-current');
    });
    applyTheme(ci);
    placeRow(catList, catRows[ci]);
    emit();
  }

  function selectGame(i: number, animate = true) {
    const rows = games();
    if (!rows.length) return;
    const next = (i + rows.length) % rows.length;
    const changed = next !== gi;
    gi = next;
    rows.forEach((r, n) => {
      r.classList.toggle('is-sel', n === gi);
      if (n === gi) r.setAttribute('aria-current', 'true');
      else r.removeAttribute('aria-current');
    });
    details().forEach((d, n) => {
      d.classList.toggle('is-on', n === gi);
      d.classList.remove('swap');
      if (n === gi && changed && animate && !reduce.matches) {
        void d.offsetWidth; // restart the glitch
        d.classList.add('swap');
      }
    });
    placeRow(views[ci].querySelector('.proj-glist'), rows[gi]);
  }

  function setLevel(next: 'browse' | 'open', animate: boolean) {
    level = next;
    pane!.dataset.level = next;
    document.documentElement.dataset.projLevel = next;
    pane!.dataset.cat = catRows[ci]?.dataset.cat ?? '';
    views.forEach((v, n) => v.classList.toggle('is-open', next === 'open' && n === ci));
    if (back) back.hidden = next !== 'open';
    if (crumb) crumb.textContent = next === 'open' ? (catRows[ci]?.dataset.label ?? '') : 'Pick a line';
    if (next === 'open') {
      gi = 0;
      details().forEach((d) => d.classList.remove('swap'));
      selectGame(0, false);
    }
    if (animate && crt && !reduce.matches) burst(crt, 140);
    // Measure after the layout has changed.
    requestAnimationFrame(() => requestAnimationFrame(placeAll));
    emit();
  }

  const open = () => level === 'browse' && catRows.length && setLevel('open', true);
  const close = () => level === 'open' && setLevel('browse', true);

  /* ---- pointer ---- */
  catRows.forEach((r, n) => {
    r.addEventListener('mouseenter', () => level === 'browse' && selectCat(n));
    r.addEventListener('focus', () => level === 'browse' && selectCat(n));
    r.addEventListener('click', () => {
      selectCat(n);
      open();
    });
  });
  views.forEach((v, vi) => {
    games(vi).forEach((r, n) => {
      r.addEventListener('mouseenter', () => level === 'open' && vi === ci && selectGame(n));
      r.addEventListener('focus', () => level === 'open' && vi === ci && selectGame(n));
      r.addEventListener('click', () => level === 'open' && vi === ci && selectGame(n));
    });
  });
  back?.addEventListener('click', close);

  /* ---- keyboard: runs before the router's own handler so Esc can step back first ---- */
  window.addEventListener(
    'keydown',
    (e) => {
      if (document.documentElement.dataset.pane !== 'projects') return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if ((e.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable]')) return;
      let handled = true;
      switch (e.key) {
        case 'ArrowDown':
          level === 'browse' ? selectCat(ci + 1) : selectGame(gi + 1);
          break;
        case 'ArrowUp':
          level === 'browse' ? selectCat(ci - 1) : selectGame(gi - 1);
          break;
        case 'ArrowRight':
          if (level === 'browse') open();
          break;
        case 'Enter':
        case ' ':
          if (level === 'browse') open();
          else details()[gi]?.querySelector<HTMLElement>('.btn')?.click();
          break;
        case 'ArrowLeft':
        case 'Backspace':
          close();
          break;
        case 'Escape':
          if (level === 'open') close();
          else handled = false; // let the router take us back to the menu
          break;
        default:
          handled = false;
      }
      if (handled) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );

  /* ---- coming and going ---- */
  document.addEventListener('pane:change', (e) => {
    if ((e as CustomEvent).detail.name !== 'projects') {
      pane.classList.remove('intro');
      return;
    }
    // Every visit starts at the category list, with the rows sliding in.
    ci = 0;
    selectCat(0);
    setLevel('browse', false);
    pane.classList.remove('intro');
    void pane.offsetWidth;
    if (!reduce.matches) pane.classList.add('intro');
  });
  window.addEventListener('resize', () => requestAnimationFrame(placeAll));
  if (document.fonts) document.fonts.ready.then(() => requestAnimationFrame(placeAll));

  document.documentElement.dataset.projLevel = 'browse';
  selectCat(0);
}
