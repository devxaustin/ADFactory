// Site intro, three acts: concept (blue wireframe on white) -> in production (concrete, red lights, caution
// tape) -> shipped (the CRT powers on and the polished metal logo drops in). Plays once per visit, Skip ends it.
import * as THREE from 'three';
import { buildLogo, makeRenderer } from './models';
import { burst } from './static';

const root = document.documentElement;
let el = document.getElementById('intro');
const tpl = el?.cloneNode(true) as HTMLElement | undefined; // kept so the intro can be replayed
const aboutPane = document.querySelector<HTMLElement>('.pane[data-pane="about"]');

const MOBILE = matchMedia('not all and (min-width: 1000px) and (min-height: 560px) and (pointer: fine)').matches;
const PIXEL = MOBILE ? 3 : 2;
const crt = document.getElementById('crt-static') as HTMLCanvasElement | null;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

function markDone(handoff = false) {
  try {
    sessionStorage.setItem('adf-intro', '1');
    sessionStorage.setItem('adf-booted', '1');
  } catch {}
  // handoff: the polished logo has already flown into place on the About screen.
  document.dispatchEvent(new CustomEvent('intro:done', { detail: { handoff } }));
}

// The intro tells the site's story, so it plays the first time About is opened in a visit.
let started = false;
function maybeStart() {
  if (!el || started || !aboutPane || aboutPane.hidden || reduce.matches) return;
  try {
    if (sessionStorage.getItem('adf-intro')) return;
  } catch {}
  // Never two overlays at once (they'd share element ids and fight over the canvas).
  document.querySelectorAll('.intro-screen').forEach((n) => n !== el && n.remove());
  started = true;
  root.classList.add('intro');
  try {
    run(el);
  } catch (err) {
    console.warn('[intro] skipped', err);
    root.classList.remove('intro', 'intro-hold');
    el.remove();
    if (!doneSent) {
      doneSent = true;
      markDone();
    }
  }
}
document.addEventListener('pane:change', (e) => {
  if ((e as CustomEvent).detail.name === 'about') maybeStart();
});
// "Reboot" on the About screen: build a fresh overlay and play it again.
document.addEventListener('intro:replay', () => {
  if (!tpl || root.classList.contains('intro') || root.classList.contains('intro-hold')) return;
  document.querySelectorAll('.intro-screen').forEach((n) => n.remove());
  el = tpl.cloneNode(true) as HTMLElement;
  started = false;
  maybeStart();
});
maybeStart(); // direct load on #about

function run(el: HTMLElement) {
  // The markup lives inside the page slot (under the monitor); lift it out so nothing clips or hides it.
  document.body.append(el);
  const canvas = el.querySelector<HTMLCanvasElement>('.intro-gl')!;
  const stat = el.querySelector<HTMLCanvasElement>('.intro-static')!;
  const cap = el.querySelector<HTMLElement>('.intro-cap')!;
  const skip = el.querySelector<HTMLElement>('.intro-skip')!;
  const monitor = document.getElementById('monitor');

  const { renderer, scene } = makeRenderer(canvas);
  if (!renderer.getContext() || renderer.getContext().isContextLost()) throw new Error('no WebGL context for the intro');
  const onLost = (e: Event) => {
    e.preventDefault();
    console.warn('[intro] WebGL context lost, ending early');
    end();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  renderer.localClippingEnabled = true;
  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 50);
  camera.position.set(0, 0.2, 6.6);

  // The logo: reuse the site's mesh and edges, give each act its own look.
  const logo = buildLogo();
  const mesh = logo.getObjectByName('logo-metal') as THREE.Mesh;
  const data = mesh.userData as { mats: THREE.Material[]; edges: THREE.LineSegments };
  const metal = data.mats[2];
  const edges = data.edges;
  edges.visible = true;
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x1f3dff });
  edges.material = edgeMat;
  const edgeCount = (edges.geometry.attributes.position as THREE.BufferAttribute).count;

  // Act 1: hidden-line blueprint. The fill only hides back edges; it draws no colour.
  const ghost = new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  mesh.material = ghost;

  // Act 2: concrete poured from the bottom up, via a clipping plane. Edges stay only above the pour line.
  const pour = new THREE.Plane(new THREE.Vector3(0, -1, 0), -2);
  const keepAbove = new THREE.Plane(new THREE.Vector3(0, 1, 0), 2);
  const concrete = new THREE.MeshStandardMaterial({ map: concreteTexture(), color: 0xb4b4b4, roughness: 1, metalness: 0, clippingPlanes: [pour] });
  edgeMat.clippingPlanes = [keepAbove];

  const pivot = new THREE.Group();
  pivot.add(logo);
  scene.add(pivot);
  const redLight = new THREE.PointLight(0xff1a1a, 0, 14);
  redLight.position.set(2.2, 1.6, 3.2);
  scene.add(redLight);

  const FLOOR = 0.2; // the camera looks at y = 0.2, so this is the middle of the screen
  let k = 1; // logo scale, fit to the window
  let W = 0;
  let H = 0;
  function fitSize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w === W && h === H) return;
    W = w;
    H = h;
    renderer.setSize(Math.ceil(w / PIXEL), Math.ceil(h / PIXEL), false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const viewW = 2 * Math.tan((32 * Math.PI) / 360) * 6.6 * camera.aspect;
    k = Math.min(1.2, (0.8 * viewW) / 3.2);
    pivot.scale.setScalar(act === 3 ? k * 0.55 : k);
  }

  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const ease = (x: number) => x * x * (3 - 2 * x);
  const T1 = 4.6; // act 2 starts
  const T2 = 9.4; // act 3 starts

  let act = 0;
  let raf = 0;
  let start = performance.now();
  let ended = false;
  let landed = false;
  let vy = 0;
  let timers: number[] = [];
  let paused = false;
  let flyStart = -1;
  let handed = false;
  let doneSent = false;
  const stageEl = () => document.querySelector<HTMLElement>('.pane[data-pane="about"] .model-stage');
  let removeKeys = () => {};

  function setAct(n: number) {
    act = n;
    el.dataset.act = String(n);
  }
  function flash(ms = 260) {
    burst(stat, ms);
  }
  const caption = (txt: string) => (cap.textContent = txt);

  function enterAct1() {
    setAct(1);
    caption('Fig. 001 / Concept');
  }
  function enterAct2() {
    setAct(2);
    flash();
    mesh.material = concrete;
    pivot.rotation.set(0, 0, 0);
    scene.environmentIntensity = 0.22;
    caption('In production');
  }
  function enterAct3() {
    setAct(3);
    flash(300);
    if (crt) burst(crt, 340);
    mesh.material = metal;
    edges.visible = false;
    redLight.intensity = 0;
    scene.environmentIntensity = 0.8;
    // The tube comes on (the site's own power-on) and the logo drops from above the screen.
    root.classList.remove('intro');
    root.classList.add('boot', 'intro-hold');
    timers.push(window.setTimeout(() => root.classList.remove('boot'), 1100));
    pivot.rotation.set(0.12, 0.5, 0);
    pivot.scale.setScalar(k * 0.55);
    pivot.position.y = 3.6;
    vy = 0;
    landed = false;
    caption('');
  }

  let flown = false;
  let fromX = 0;
  let fromS = 1;
  let rot0 = 0;
  let rotT = 0;
  function startFlight(t: number) {
    flown = true;
    fromX = pivot.position.x;
    fromS = pivot.scale.x;
    rot0 = pivot.rotation.y;
    rotT = (Math.ceil(rot0 / (Math.PI * 2)) + 1) * Math.PI * 2; // one more full turn on the way
    el.classList.add('flying');
    // The real logo must already be polished when we reveal it.
    const st = stageEl();
    if (st) {
      st.dataset.logoState = '2';
      st.dispatchEvent(new CustomEvent('logostate'));
    }
    void t;
  }
  function handoff() {
    if (handed) return;
    handed = true;
    const st = stageEl();
    // Start the real logo face-on, exactly where the flying one arrives, then fade the overlay out.
    st?.dispatchEvent(new CustomEvent('logoreset'));
    root.classList.remove('intro-hold');
    el.classList.add('out');
    if (!doneSent) {
      doneSent = true;
      markDone(true);
    }
    timers.push(window.setTimeout(() => end(), 650));
  }

  function frame(now: number) {
    try {
      tick(now);
    } catch (err) {
      console.warn('[intro] stopped', err);
      end();
    }
  }
  function tick(now: number) {
    raf = requestAnimationFrame(frame);
    fitSize();
    if (paused) start += now - last;
    const t = (now - start) / 1000;
    const dt = paused ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;

    if (act === 1) {
      const p = ease(clamp(t / 3.6));
      edges.geometry.setDrawRange(0, Math.floor((p * edgeCount) / 2) * 2);
      pivot.rotation.y = Math.sin(t * 0.7) * 0.55;
      pivot.rotation.x = Math.sin(t * 0.5) * 0.08;
      if (t >= T1) enterAct2();
    } else if (act === 2) {
      const u = ease(clamp((t - T1 - 0.6) / 3.2));
      const c = (-1.25 + u * 2.5) * k;
      pour.constant = c;
      keepAbove.constant = -c;
      if (u >= 1) edges.visible = false;
      pivot.rotation.y = Math.sin((t - T1) * 0.7) * 0.55;
      pivot.rotation.x = Math.sin((t - T1) * 0.5) * 0.08;
      // Production lights: hard on/off flashes.
      redLight.intensity = Math.floor((t - T1) * 2.4) % 2 ? 5 : 70;
      if (t >= T2) enterAct3();
    } else if (act === 3) {
      if (t > T2 + 0.9 && !landed) {
        // Drop with a couple of bounces.
        vy -= 26 * dt;
        pivot.position.y += vy * dt;
        if (pivot.position.y <= FLOOR) {
          pivot.position.y = FLOOR;
          if (Math.abs(vy) > 2.6) {
            vy = -vy * 0.34;
            monitor?.classList.remove('thud');
            void monitor?.offsetWidth;
            monitor?.classList.add('thud');
          } else {
            vy = 0;
            landed = true;
            caption('Shipped');
          }
        }
      }
      if (landed && flyStart < 0) {
        // Hold a beat on "Shipped", then carry the logo over to where it rests on the About screen.
        flyStart = t + 0.9;
      }
      if (flyStart >= 0 && t >= flyStart) {
        if (!flown) startFlight(t);
        const u = clamp((t - flyStart) / 1.3);
        const e = ease(u);
        const r = stageEl()?.getBoundingClientRect();
        if (r && r.width > 0) {
          const wh = 2 * Math.tan((16 * Math.PI) / 180) * 6.6; // world height seen by the camera
          const wpp = wh / window.innerHeight;
          const tx = (r.left + r.width / 2 - window.innerWidth / 2) * wpp;
          const ty = 0.2 - (r.top + r.height / 2 - window.innerHeight / 2) * wpp;
          const ts = (3.0 * r.height) / (3.2 * window.innerHeight); // same on-screen width as the stage logo
          pivot.position.x = fromX + (tx - fromX) * e;
          pivot.position.y = FLOOR + (ty - FLOOR) * e;
          pivot.scale.setScalar(fromS + (ts - fromS) * e);
        }
        pivot.rotation.y = rot0 + (rotT - rot0) * (1 - (1 - u) * (1 - u));
        pivot.rotation.x = 0.12 * (1 - e);
        if (u >= 1 && !handed) handoff();
      } else {
        pivot.rotation.y += dt * (landed ? 0.9 : 0.25);
      }
      // Safety net: never hang if the drop didn't finish.
      if (t >= T2 + 7 && !handed) handoff();
    }
    renderer.render(scene, camera);
  }

  function end(skipped = false) {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    removeKeys();
    root.classList.remove('intro', 'intro-hold');
    if (skipped && act < 3) {
      // Skipped early: still give the tube its power-on.
      root.classList.add('boot');
      timers.push(window.setTimeout(() => root.classList.remove('boot'), 1100));
    }
    if (crt && !handed) burst(crt, 240);
    canvas.removeEventListener('webglcontextlost', onLost);
    renderer.dispose();
    renderer.forceContextLoss();
    el.remove();
    markDone();
  }

  skip.addEventListener('click', () => end(true));
  // While the intro is up, nothing reaches the screens underneath (swipes, number keys, Esc).
  for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'click'] as const) el.addEventListener(type, (e) => e.stopPropagation());
  const onKey = (e: KeyboardEvent) => {
    e.stopImmediatePropagation();
    e.preventDefault();
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') end(true);
  };
  window.addEventListener('keydown', onKey, true);
  removeKeys = () => window.removeEventListener('keydown', onKey, true);

  // Dev only: window.__intro.seek(seconds) / .pause(true) to inspect a moment of the animation.
  if (import.meta.env.DEV) {
    (window as unknown as { __intro: unknown }).__intro = {
      seek: (t: number) => (start = performance.now() - t * 1000),
      pause: (b: boolean) => (paused = b),
    };
  }

  enterAct1();
  let last = performance.now();
  start = last;
  raf = requestAnimationFrame(frame);
}

// Poured concrete: grey, speckled, with a few darker stains and pits.
function concreteTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  x.fillStyle = '#8b8b8b';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 24; i++) {
    const g = 100 + Math.random() * 50;
    x.fillStyle = `rgba(${g},${g},${g},0.25)`;
    x.beginPath();
    x.arc(Math.random() * 256, Math.random() * 256, 12 + Math.random() * 30, 0, Math.PI * 2);
    x.fill();
  }
  for (let i = 0; i < 2600; i++) {
    const g = Math.random() < 0.5 ? 40 + Math.random() * 40 : 170 + Math.random() * 70;
    x.fillStyle = `rgba(${g},${g},${g},${0.15 + Math.random() * 0.35})`;
    x.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 1;
  return t;
}
