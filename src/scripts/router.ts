// Switches between the screens without reloading. The URL hash follows along
// so every screen can be linked to. The menu is the home screen.
import { burst } from './static';

export const order = ['menu', 'about', 'projects', 'media', 'contact'] as const;
export type Screen = (typeof order)[number];

const legacy: Record<string, Screen> = {
  prototype: 'projects',
  production: 'projects',
  shipped: 'projects',
};

const root = document.documentElement;
const panes = Array.from(document.querySelectorAll<HTMLElement>('.pane'));
const navs = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav]'));
const canvas = document.getElementById('crt-static') as HTMLCanvasElement | null;
const dots = Array.from(document.querySelectorAll<HTMLElement>('[data-dot]'));

function fromHash(): Screen {
  const h = location.hash.slice(1);
  if ((order as readonly string[]).includes(h)) return h as Screen;
  return legacy[h] ?? 'menu';
}

let current: Screen | null = null;

function show(name: Screen, animate: boolean) {
  if (name === current) return;
  const prev = current;
  current = name;

  for (const p of panes) p.hidden = p.dataset.pane !== name;
  for (const a of navs) {
    if (a.dataset.nav === name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  root.dataset.pane = name;
  for (const d of dots) d.classList.toggle('on', d.dataset.dot === name);

  const pane = panes.find((p) => p.dataset.pane === name);
  if (pane) {
    pane.scrollTop = 0;
    if (animate) {
      pane.classList.remove('tune');
      void pane.offsetWidth; // restart the animation
      pane.classList.add('tune');
    }
  }
  if (animate && canvas) burst(canvas, 200);

  document.dispatchEvent(new CustomEvent('pane:change', { detail: { name, prev } }));
}

export function go(name: Screen) {
  show(name, true);
  history.replaceState(null, '', `#${name}`);
}

for (const a of navs) {
  a.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(a.dataset.nav as Screen);
  });
}

window.addEventListener('hashchange', () => show(fromHash(), true));

// 1 to 4 jump straight to a screen. Esc, 0 or M goes back to the menu (the "end" key).
document.addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if ((e.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable]')) return;
  if (e.key === 'Escape' || e.key === '0' || e.key.toLowerCase() === 'm') {
    if (current !== 'menu') go('menu');
    return;
  }
  const i = '1234'.indexOf(e.key);
  if (e.key.length === 1 && i >= 0) go(order[i + 1]);
});

show(fromHash(), false);
