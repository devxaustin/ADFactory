// 3D "specimen" stages for the About and Contact screens (desktop only).
// Each stage loads a .glb if the page gives it one, otherwise builds a stand-in out of primitives.
// It renders at low resolution and scales up with hard pixels, so it matches the CRT.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const PIXEL = 3; // CSS pixels per rendered pixel. Bigger is chunkier.
const FIT = 3.0; // models get scaled so their largest side is this big

const mat = {
  red: () => new THREE.MeshPhysicalMaterial({ color: 0xc4161c, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25 }),
  key: () => new THREE.MeshStandardMaterial({ color: 0x5f6d72, roughness: 0.6 }),
  chrome: () => new THREE.MeshStandardMaterial({ color: 0xc9d0e0, metalness: 1, roughness: 0.3 }),
  steel: () => new THREE.MeshStandardMaterial({ color: 0x5f78b8, metalness: 0.8, roughness: 0.4 }),
  dark: () => new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.8 }),
};

/* ---------- Stand-in: red wall telephone ---------- */
function buildPhone(): THREE.Group {
  const g = new THREE.Group();
  const red = mat.red();

  const body = new THREE.Mesh(new RoundedBoxGeometry(1.15, 2.1, 0.42, 4, 0.13), red);
  g.add(body);

  // recessed keypad panel
  const panel = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.86, 0.04, 2, 0.02), mat.dark());
  panel.position.set(-0.02, -0.1, 0.215);
  g.add(panel);
  const keyGeo = new RoundedBoxGeometry(0.15, 0.15, 0.07, 2, 0.02);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const k = new THREE.Mesh(keyGeo, mat.key());
      k.position.set(-0.2 + c * 0.18, 0.22 - r * 0.19, 0.25);
      g.add(k);
    }
  }
  // number card window
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.02), mat.chrome());
  card.position.set(-0.02, -0.66, 0.23);
  g.add(card);

  // hook switch
  const hook = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.2, 0.2, 2, 0.03), mat.chrome());
  hook.position.set(-0.08, 0.7, 0.28);
  g.add(hook);

  // handset: a curved grip with a cup at each end, resting in the cradle
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 0.78, 0.36),
    new THREE.Vector3(0.2, 0.42, 0.4),
    new THREE.Vector3(0.24, 0.0, 0.4),
    new THREE.Vector3(0.2, -0.46, 0.4),
    new THREE.Vector3(0.0, -0.78, 0.36),
  ]);
  const grip = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.1, 14, false), red);
  g.add(grip);
  for (const y of [0.8, -0.82]) {
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), red);
    cup.scale.set(1, 0.8, 0.9);
    cup.position.set(-0.04, y, 0.37);
    g.add(cup);
  }

  // cord
  const cord = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.04, -0.98, 0.3),
    new THREE.Vector3(-0.2, -1.25, 0.34),
    new THREE.Vector3(0.1, -1.5, 0.3),
    new THREE.Vector3(-0.1, -1.75, 0.26),
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(cord, 24, 0.022, 6, false), red));

  g.rotation.x = -0.05;
  return g;
}

/* ---------- Stand-in: pair of meshing gears ---------- */
function gearMesh(teeth: number, outer: number, depth: number, material: THREE.Material): THREE.Mesh {
  const inner = outer * 0.82;
  const s = new THREE.Shape();
  const n = teeth * 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = i % 4 === 1 || i % 4 === 2 ? outer : inner;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
  }
  s.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner * 0.3, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 });
  geo.translate(0, 0, -depth / 2);
  return new THREE.Mesh(geo, material);
}

function buildGears(): THREE.Group {
  const g = new THREE.Group();
  const big = gearMesh(14, 0.95, 0.3, mat.steel());
  big.position.x = -0.55;
  big.name = 'spin+';
  const small = gearMesh(8, 0.54, 0.3, mat.chrome());
  small.position.set(0.66, 0.44, 0);
  small.rotation.z = Math.PI / 8; // tooth lines up with the gap on the big gear
  small.name = 'spin-';
  g.add(big, small);
  return g;
}

/* ---------- Stand-in: game cartridge (Projects) ---------- */
function buildCartridge(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.7, 2.0, 0.34, 3, 0.07), new THREE.MeshStandardMaterial({ color: 0x8d93a6, roughness: 0.55 }));
  g.add(body);
  const label = new THREE.Mesh(new RoundedBoxGeometry(1.3, 1.05, 0.05, 2, 0.02), new THREE.MeshStandardMaterial({ color: 0xd8352a, roughness: 0.5 }));
  label.position.set(0, 0.2, 0.18);
  g.add(label);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 0.06), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 }));
  stripe.position.set(0, 0.05, 0.19);
  g.add(stripe);
  for (let i = 0; i < 7; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.06), mat.dark());
    rib.position.set(0, -0.62 - i * 0.07, 0.18);
    g.add(rib);
  }
  const pins = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.2), mat.chrome());
  pins.position.set(0, -1.02, 0);
  g.add(pins);
  g.rotation.z = 0.08;
  return g;
}

/* ---------- Stand-in: little CRT TV (Media) ---------- */
function buildTv(): THREE.Group {
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0xc9bfa6, roughness: 0.5 });
  g.add(new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.8, 1.5, 4, 0.16), shell));
  const screen = new THREE.Mesh(
    new RoundedBoxGeometry(1.45, 1.2, 0.1, 4, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x1a3cff, emissive: 0x1a3cff, emissiveIntensity: 0.9, roughness: 0.2 }),
  );
  screen.position.set(-0.28, 0.02, 0.73);
  g.add(screen);
  for (const y of [0.3, -0.25]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16), mat.dark());
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0.82, y, 0.74);
    g.add(knob);
  }
  for (const dx of [-0.5, 0.5]) {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), mat.chrome());
    ear.position.set(dx * 0.9, 1.45, 0);
    ear.rotation.z = -dx * 0.9;
    g.add(ear);
  }
  for (const dx of [-0.8, 0.8]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.3), mat.dark());
    foot.position.set(dx, -0.96, 0.4);
    g.add(foot);
  }
  g.rotation.y = -0.35;
  return g;
}

export type Kind = 'phone' | 'gear' | 'cartridge' | 'tv';
const builders: Record<Kind, () => THREE.Group> = { phone: buildPhone, gear: buildGears, cartridge: buildCartridge, tv: buildTv };

// Load a .glb or .fbx if one is given, otherwise (or if it fails) build the stand-in. Result is centered and sized.
type ObjectOpts = { rotate?: [number, number, number]; tint?: string; textures?: string };

function makeObject(kind: string, file: string | undefined, done: (o: THREE.Object3D) => void, opts: ObjectOpts = {}) {
  const standIn = () => {
    const o = (builders[kind as Kind] ?? buildPhone)();
    fit(o);
    done(o);
  };
  if (!file) return standIn();
  const isFbx = /\.fbx$/i.test(file);

  const finish = (root: THREE.Object3D) => {
    if (opts.rotate) root.rotation.set(...(opts.rotate.map((d) => (d * Math.PI) / 180) as [number, number, number]));
    if (opts.textures && !isFbx) {
      // A folder of web-sized maps (base, emissive, normal, orm) for a .glb that came without textures.
      const dir = opts.textures.replace(/\/?$/, '/');
      const loader = new THREE.TextureLoader();
      const load = (name: string, srgb: boolean) => {
        const t = loader.load(dir + name);
        t.flipY = true;
        t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        t.anisotropy = 4;
        return t;
      };
      const orm = load('orm.jpg', false); // R = occlusion, G = roughness, B = metallic
      const material = new THREE.MeshStandardMaterial({
        map: load('base.jpg', true),
        emissiveMap: load('emissive.jpg', true),
        emissive: 0xffffff,
        normalMap: load('normal.jpg', false),
        normalScale: new THREE.Vector2(1, -1), // Unreal-style (DirectX) normal map
        aoMap: orm,
        roughnessMap: orm,
        metalnessMap: orm,
        roughness: 1,
        metalness: 1,
      });
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.material = material;
      });
    } else if (opts.tint) {
      // Models exported without their textures come in as flat grey. Give those a plain colored plastic instead.
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && m.material && !(m.material as THREE.MeshStandardMaterial).map) {
          m.material = new THREE.MeshStandardMaterial({ color: opts.tint, roughness: 0.5 });
        }
      });
    }
    if (isFbx) {
      // FBX materials often come in see-through; the models here are solid.
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        for (const mt of Array.isArray(m.material) ? m.material : [m.material]) {
          mt.transparent = false;
          mt.opacity = 1;
          mt.alphaTest = 0.05;
          mt.side = THREE.DoubleSide;
        }
      });
    }
    fit(root);
    done(root);
  };
  const failed = () => {
    console.warn(`[models] could not load ${file}, using the stand-in`);
    standIn();
  };

  if (isFbx) {
    // For an .fbx, `textures` is the folder holding the image files it refers to.
    const loader = new FBXLoader();
    if (opts.textures) loader.setResourcePath(opts.textures.replace(/\/?$/, '/'));
    loader.load(file, finish, undefined, failed);
  } else {
    new GLTFLoader().load(file, (gltf) => finish(gltf.scene), undefined, failed);
  }
}

function spinParts(root: THREE.Object3D, dt: number) {
  root.traverse((o) => {
    if (o.name === 'spin+') o.rotation.z += dt * 0.5;
    if (o.name === 'spin-') o.rotation.z -= dt * 0.5 * (14 / 8);
  });
}

function makeRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(2, 3, 4);
  scene.add(key);
  // Two lights from behind catch the edges, so dark models (CRT, black phone) don't vanish into the blue.
  const rimA = new THREE.DirectionalLight(0x9bb8ff, 3.2);
  rimA.position.set(-3, 2, -5);
  const rimB = new THREE.DirectionalLight(0xffffff, 2.2);
  rimB.position.set(3, 1, -5);
  scene.add(rimA, rimB);
  return { renderer, scene };
}

/* ---------- Stage ---------- */
function fit(obj: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const k = FIT / Math.max(size.x, size.y, size.z || 1);
  obj.scale.multiplyScalar(k);
  const c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
  obj.position.sub(c);
}

function initStage(el: HTMLElement) {
  const canvas = el.querySelector<HTMLCanvasElement>('canvas')!;
  const kind = el.dataset.kind ?? 'phone';
  const file = el.dataset.model;

  const { renderer, scene } = makeRenderer(canvas);

  const camera = new THREE.PerspectiveCamera(32, 4 / 3, 0.1, 50);
  camera.position.set(0, 0.2, 6.6);

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minPolarAngle = Math.PI * 0.3;
  controls.maxPolarAngle = Math.PI * 0.7;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 1.6;
  canvas.addEventListener('pointerdown', () => (controls.autoRotate = false));
  canvas.addEventListener('pointerup', () => (controls.autoRotate = !reduce));

  const pivot = new THREE.Group();
  scene.add(pivot);
  makeObject(kind, file, (o) => pivot.add(o));

  let w = 0;
  let h = 0;
  let raf = 0;
  let last = performance.now();

  function frame() {
    raf = requestAnimationFrame(frame);
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw && ch && (cw !== w || ch !== h)) {
      w = cw;
      h = ch;
      renderer.setSize(Math.ceil(w / PIXEL), Math.ceil(h / PIXEL), false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!reduce) {
      spinParts(pivot, dt);
    }
    controls.update();
    renderer.render(scene, camera);
  }

  return {
    start() {
      if (!raf) {
        last = performance.now();
        frame();
      }
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

// Only render while a stage is actually on screen (panes start hidden, and phones hide the stage).
const stages = new WeakMap<Element, ReturnType<typeof initStage>>();
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    let s = stages.get(e.target);
    if (e.isIntersecting) {
      if (!s) {
        try {
          const el = e.target as HTMLElement;
          s = el.classList.contains('menu-stage') ? initMenuStage(el) : initStage(el);
        } catch (err) {
          console.warn('[models] WebGL unavailable', err);
          (e.target as HTMLElement).classList.add('no-gl');
          io.unobserve(e.target);
          continue;
        }
        stages.set(e.target, s);
      }
      s.start();
    } else {
      s?.stop();
    }
  }
});
document.querySelectorAll('.model-stage, .menu-stage').forEach((el) => io.observe(el));


/* ---------- Home menu: one object floats on the blue screen, swapped by the highlighted row ---------- */
function initMenuStage(el: HTMLElement) {
  const canvas = el.querySelector<HTMLCanvasElement>('canvas')!;
  const config: Record<string, { kind: string; file?: string; rotate?: [number, number, number]; tint?: string; textures?: string }> = JSON.parse(el.dataset.models ?? '{}');
  const { renderer, scene } = makeRenderer(canvas);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.1, 8);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const holders = new Map<string, { group: THREE.Group; s: number }>();
  for (const [key, c] of Object.entries(config)) {
    const group = new THREE.Group();
    group.scale.setScalar(0.001);
    group.visible = false;
    scene.add(group);
    holders.set(key, { group, s: 0 });
    makeObject(c.kind, c.file, (o) => group.add(o), { rotate: c.rotate, tint: c.tint, textures: c.textures });
  }

  let active = document.querySelector<HTMLElement>('.menu-row.is-sel')?.dataset.nav ?? [...holders.keys()][0];
  document.addEventListener('menu:select', (e) => {
    active = (e as CustomEvent).detail.key;
  });

  let w = 0;
  let h = 0;
  let raf = 0;
  let last = performance.now();
  let t = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw && ch && (cw !== w || ch !== h)) {
      w = cw;
      h = ch;
      renderer.setSize(Math.ceil(w / PIXEL), Math.ceil(h / PIXEL), false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!reduce) t += dt;

    for (const [key, hd] of holders) {
      const target = key === active ? 1 : 0;
      hd.s += (target - hd.s) * (1 - Math.exp(-dt * 11));
      hd.group.visible = hd.s > 0.02;
      hd.group.scale.setScalar(Math.max(hd.s, 0.001));
      hd.group.rotation.y = t * 0.45;
      hd.group.position.y = Math.sin(t * 1.1) * 0.12;
      if (!reduce) spinParts(hd.group, dt);
    }
    renderer.render(scene, camera);
  }

  return {
    start() {
      if (!raf) {
        last = performance.now();
        frame();
      }
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
