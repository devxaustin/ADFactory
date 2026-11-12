// About screen: the factory boot sequence, the output odometers, and the logo's three finishes.
// Boot plays once per visit (sessionStorage). Every other visit just rolls the counters.
import { burst } from './static';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');

const pane = document.querySelector<HTMLElement>('.pane[data-pane="about"]')!;
const stage = pane.querySelector<HTMLElement>('.model-stage')!;
const log = pane.querySelector<HTMLElement>('.boot-log')!;
const texts = [...pane.querySelectorAll<HTMLElement>('.bt')];
const cells = [...pane.querySelectorAll<HTMLButtonElement>('.out-cell')];
const crt = document.getElementById('crt-static') as HTMLCanvasElement | null;
const KEY = 'adf-boot';

const digits = (n: number) => Math.max(2, String(n).length);

// Odometer: each digit is a strip of 0-9 slid up with a CSS variable.
for (const c of cells) {
  const n = Number(c.dataset.count ?? 0);
  const odo = c.querySelector<HTMLElement>('.odo')!;
  for (let i = 0; i < digits(n); i++) {
    const reel = document.createElement('span');
    reel.className = 'reel';
    const strip = document.createElement('span');
    strip.className = 'strip';
    strip.textContent = '0\n1\n2\n3\n4\n5\n6\n7\n8\n9';
    reel.append(strip);
    odo.append(reel);
  }
}
function roll(c: HTMLElement, to: number, ms = 900) {
  const n = String(to).padStart(c.querySelectorAll('.reel').length, '0');
  c.querySelectorAll<HTMLElement>('.strip').forEach((s, i) => {
    s.style.transitionDuration = `${reduce.matches ? 0 : ms + i * 160}ms`;
    s.style.setProperty('--d', n[i]);
  });
}
const total = (c: HTMLElement) => Number(c.dataset.count ?? 0);

let look = 2;
function setLook(i: number, flash = true) {
  if (i === look && stage.dataset.logoState === String(i)) return;
  look = i;
  stage.dataset.logoState = String(i);
  stage.dispatchEvent(new CustomEvent('logostate'));
  cells.forEach((c, k) => c.classList.toggle('on', k === i));
  if (flash && crt && !reduce.matches) burst(crt, 140);
}

// Timers for the current run, so leaving the screen cancels a half-finished boot.
let timers: number[] = [];
const at = (ms: number, fn: () => void) => void timers.push(window.setTimeout(fn, ms));
function clear() {
  timers.forEach(clearTimeout);
  timers = [];
}
function typeInto(el: HTMLElement, ms: number) {
  const full = el.dataset.full ?? (el.dataset.full = el.textContent ?? '');
  const steps = full.length;
  for (let i = 1; i <= steps; i++) at((ms * i) / steps, () => (el.textContent = full.slice(0, i)));
}
function settle() {
  // Everything final: all text visible, logo polished, counters at their totals.
  clear();
  pane.classList.remove('booting');
  log.replaceChildren();
  texts.forEach((t) => {
    t.classList.add('on');
    if (t.dataset.full) t.textContent = t.dataset.full;
  });
  stage.classList.add('stamped');
  cells.forEach((c) => roll(c, total(c), 500));
  setLook(2, false);
}

function boot(afterIntro = false) {
  pane.classList.add('booting');
  texts.forEach((t) => t.classList.remove('on'));
  cells.forEach((c) => roll(c, 0, 0));
  cells.forEach((c) => c.classList.remove('on'));
  if (afterIntro) {
    // The polished logo already flew in from the intro: it stays as it is.
    stage.classList.add('stamped', 'landed');
    stage.dataset.logoState = '2';
    stage.dispatchEvent(new CustomEvent('logostate'));
    look = 2;
  } else {
    stage.classList.remove('stamped', 'landed');
    stage.dataset.logoState = '0';
    stage.dispatchEvent(new CustomEvent('logostate'));
  }

  const lines = ['> MOUNT PROTOTYPE LINE ..... OK', '> MOUNT PRODUCTION LINE .... OK', '> MOUNT SHIPPING DOCK ..... OK', '> RENDER AD.MARK'];
  log.replaceChildren();
  lines.forEach((l, i) =>
    at(i * 340, () => {
      const li = document.createElement('li');
      li.textContent = l;
      log.append(li);
    }),
  );
  const textAt = afterIntro ? 1300 : 1650;
  at(afterIntro ? 1250 : 1500, () => {
    log.replaceChildren();
    if (!afterIntro) {
      stage.classList.add('stamped');
      if (crt) burst(crt, 260);
      setLook(0, false);
    }
  });
  texts.forEach((t, i) => {
    at(textAt + i * 150, () => {
      t.classList.add('on');
      if (t.dataset.type != null) typeInto(t, 500);
    });
  });
  if (afterIntro) {
    // Counters roll up; the logo is already finished, so only the readouts change.
    at(2300, () => roll(cells[0], total(cells[0])));
    at(2800, () => roll(cells[1], total(cells[1])));
    at(3300, () => {
      roll(cells[2], total(cells[2]));
      cells[2].classList.add('on');
    });
    at(4300, () => {
      pane.classList.remove('booting');
      sessionStorage.setItem(KEY, '1');
    });
    return;
  }
  at(2700, () => {
    roll(cells[0], total(cells[0]));
    cells[0].classList.add('on');
  });
  at(3300, () => {
    setLook(1);
    roll(cells[1], total(cells[1]));
  });
  at(3900, () => {
    setLook(2);
    roll(cells[2], total(cells[2]));
  });
  at(4800, () => {
    pane.classList.remove('booting');
    sessionStorage.setItem(KEY, '1');
  });
}

let waiting = false;
function introSeen() {
  try {
    return sessionStorage.getItem('adf-intro') === '1';
  } catch {
    return true;
  }
}
function enter(afterIntro = false) {
  clear();
  // First time here this visit: the site intro plays first, then the boot starts.
  if (!reduce.matches && !introSeen()) {
    if (!waiting) {
      waiting = true;
      document.addEventListener(
        'intro:done',
        (e) => {
          waiting = false;
          if (!pane.hidden) enter(!!(e as CustomEvent).detail?.handoff);
        },
        { once: true },
      );
    }
    return;
  }
  let seen = false;
  try {
    seen = sessionStorage.getItem(KEY) === '1';
  } catch {}
  if (seen || reduce.matches) {
    settle();
    return;
  }
  boot(afterIntro);
}

// Skip the boot with a tap, click or key.
const skip = () => {
  if (pane.classList.contains('booting')) {
    settle();
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {}
  }
};
pane.addEventListener('pointerdown', skip);
document.addEventListener('keydown', () => pane.hidden || skip());

// Reboot: play the whole thing again (site intro, then the boot).
pane.querySelector('[data-reboot]')?.addEventListener('click', () => {
  try {
    sessionStorage.removeItem('adf-intro');
    sessionStorage.removeItem(KEY);
  } catch {}
  enter();
  document.dispatchEvent(new CustomEvent('intro:replay'));
});

for (const c of cells) {
  const i = Number(c.dataset.look);
  c.addEventListener('click', () => setLook(i));
  c.addEventListener('pointerenter', (e) => {
    if ((e as PointerEvent).pointerType === 'mouse' && !pane.classList.contains('booting')) setLook(i);
  });
}

document.addEventListener('pane:change', (e) => {
  const { name, prev } = (e as CustomEvent).detail as { name: string; prev: string | null };
  if (name === 'about') enter();
  else if (prev === 'about') {
    clear();
    pane.classList.remove('booting');
  }
});
// Direct load on #about: the router has already shown it before this script ran.
if (!pane.hidden) enter();
