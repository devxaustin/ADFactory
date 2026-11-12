// Touch gestures for phones and tablets. Every gesture has exactly one owner, so they never fight:
//
//   on the 3D model (home, projects)  -> browse what it shows: next/previous menu line or category
//   on the TV picture (media)         -> change the channel
//   anywhere else                     -> flip pages: About, Projects, Media, Contact
//   in an open Projects category      -> swipe right (model or not) steps back: project, then list, then page
//
// Left swipe = next, right swipe = previous. Not handled here: the About/Contact models (they spin when
// dragged sideways, and scroll the page when dragged up or down) and sliders (they drag themselves).
// A swipe never opens whatever it ended on: the click that follows it is swallowed.
import { go, order } from './router';

const MOBILE = matchMedia('not all and (min-width: 1000px) and (min-height: 560px) and (pointer: fine)');
const root = document.documentElement;
const pages = order.slice(1); // about, projects, media, contact

const MIN_X = 56; // px of sideways travel
const MAX_MS = 900;

type Zone = 'stage' | 'tv' | 'body';
let start: { id: number; x: number; y: number; t: number; zone: Zone } | null = null;
let swallowUntil = 0;

function inside(el: Element | null, x: number, y: number) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function zoneAt(x: number, y: number): Zone {
  // The stages ignore pointer events (so the page behind keeps scrolling), so match by position instead.
  const pane = document.querySelector<HTMLElement>('.pane:not([hidden])');
  if (inside(pane?.querySelector('[data-swipe="stage"]') ?? null, x, y)) return 'stage';
  if (inside(pane?.querySelector('[data-swipe="tv"]') ?? null, x, y)) return 'tv';
  return 'body';
}

document.addEventListener(
  'pointerdown',
  (e) => {
    start = null;
    if (!MOBILE.matches || e.pointerType === 'mouse' || !e.isPrimary) return;
    if ((e.target as Element).closest('input, textarea, select, .model-stage, [data-no-swipe]')) return;
    start = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), zone: zoneAt(e.clientX, e.clientY) };
  },
  { passive: true },
);

document.addEventListener('pointercancel', () => (start = null), { passive: true });

document.addEventListener(
  'pointerup',
  (e) => {
    const s = start;
    start = null;
    if (!s || e.pointerId !== s.id) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < MIN_X || Math.abs(dx) < Math.abs(dy) * 1.5 || performance.now() - s.t > MAX_MS) return;

    const dir = dx < 0 ? 1 : -1; // 1 = next, -1 = previous
    const pane = root.dataset.pane ?? 'menu';
    let used = true;

    const inOpenCategory = pane === 'projects' && root.dataset.projLevel === 'open';
    if (s.zone === 'stage' && inOpenCategory) {
      // Nothing to browse on the model here, so a right swipe just steps back like it does anywhere else.
      if (dir === -1) document.querySelector<HTMLButtonElement>('[data-proj-back]')?.click();
      else used = false;
    } else if (s.zone === 'stage') {
      document.dispatchEvent(new CustomEvent('stage:swipe', { detail: { dir, pane } }));
    } else if (s.zone === 'tv') {
      document.querySelector<HTMLButtonElement>(`[data-tv-step="${dir}"]`)?.click();
    } else if (pane === 'menu') {
      used = false;
    } else if (inOpenCategory && dir === -1) {
      document.querySelector<HTMLButtonElement>('[data-proj-back]')?.click();
    } else {
      const i = pages.indexOf(pane as (typeof pages)[number]);
      const n = i + dir;
      if (i < 0) used = false;
      else if (n < 0) go('menu');
      else if (n < pages.length) go(pages[n]);
      else used = false;
    }
    if (used) swallowUntil = performance.now() + 400;
  },
  { passive: true },
);

window.addEventListener(
  'click',
  (e) => {
    if (performance.now() < swallowUntil) {
      e.preventDefault();
      e.stopPropagation();
    }
  },
  true,
);
