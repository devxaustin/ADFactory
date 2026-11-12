// 3D "specimen" stages for the About and Contact screens (desktop only).
// Each stage loads a .glb if the page gives it one, otherwise builds a stand-in out of primitives.
// It renders at low resolution and scales up with hard pixels, so it matches the CRT.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LOGO_OUTER, LOGO_HOLE } from '../data/logo';

const PIXEL = 3; // CSS pixels per rendered pixel. Bigger is chunkier.
const FIT = 3.0; // models get scaled so their largest side is this big

// Phones and tablets (same test the stylesheet uses). They draw at 30 fps, take the low-power GPU, skip
// texture filtering, and keep only the visible screen's WebGL context alive.
const MOBILE_MQ = matchMedia('not all and (min-width: 1000px) and (min-height: 560px) and (pointer: fine)');
const MOBILE = MOBILE_MQ.matches;
const FRAME_MS = MOBILE ? 1000 / 30 : 0;
function makeGate() {
  let next = 0;
  return (now: number) => {
    if (!FRAME_MS) return true;
    if (now < next) return false;
    next = now + FRAME_MS - 2;
    return true;
  };
}
// Free the GPU side of a stage. A canvas can't get a fresh context after losing one, so it is swapped for a clone.
function teardown(canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer, ac?: AbortController, controls?: OrbitControls) {
  ac?.abort();
  controls?.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
  canvas.replaceWith(canvas.cloneNode(false));
}

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

/* ---------- The AD monogram (About): traced from the logo PNG, extruded, brushed aluminum ---------- */
function brushedTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const x = c.getContext('2d')!;
  x.fillStyle = '#9aa0aa';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const v = 120 + Math.random() * 110;
    x.strokeStyle = `rgba(${v},${v},${v + 6},${0.08 + Math.random() * 0.18})`;
    x.lineWidth = 1;
    const y = Math.random() * 256;
    x.beginPath();
    x.moveTo(0, y);
    x.lineTo(256, y + (Math.random() - 0.5) * 2);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 1;
  return t;
}

function setLogoState(root: THREE.Object3D, i: number) {
  root.traverse((o) => {
    if (o.name !== 'logo-metal') return;
    const m = o as THREE.Mesh;
    const d = m.userData as { mats: THREE.Material[]; edges: THREE.Object3D };
    m.material = d.mats[i] ?? d.mats[2];
    d.edges.visible = i === 0;
  });
}

export function buildLogo(): THREE.Group {
  const g = new THREE.Group();
  const shape = new THREE.Shape(LOGO_OUTER.map(([x, y]) => new THREE.Vector2(x, y)));
  shape.holes.push(new THREE.Path(LOGO_HOLE.map(([x, y]) => new THREE.Vector2(x, y))));
  const depth = 0.12;
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 1 });
  geo.translate(0, 0, -depth / 2);
  // ExtrudeGeometry UVs are world-space units; scale so the grain repeats nicely.
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * 3);
  const map = brushedTexture();
  const metal = new THREE.MeshStandardMaterial({ color: 0xffffff, map, roughnessMap: map, metalness: 0.85, roughness: 0.5, envMapIntensity: 2.4 });
  // The three stages the mark goes through: blueprint wireframe, flat grey cast, polished brushed metal.
  const blueprint = new THREE.MeshBasicMaterial({ color: 0x07156e, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const cast = new THREE.MeshStandardMaterial({ color: 0x8d9199, roughness: 0.95, metalness: 0, flatShading: true });
  const mesh = new THREE.Mesh(geo, metal);
  mesh.name = 'logo-metal';
  mesh.scale.setScalar(3.2);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), new THREE.LineBasicMaterial({ color: 0x7fe3ff }));
  edges.visible = false;
  mesh.add(edges);
  mesh.userData = { mats: [blueprint, cast, metal], edges };
  const pivot = new THREE.Group();
  pivot.name = 'spiny';
  pivot.add(mesh);
  g.add(pivot);
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


/* ---------- Stand-in: game controller (Projects > Games). Colour cues only, no console logos. ---------- */
function buildController(): THREE.Group {
  const g = new THREE.Group();
  const shell = () => new THREE.MeshStandardMaterial({ color: 0xe9ece8, roughness: 0.42 });
  const plate = () => new THREE.MeshStandardMaterial({ color: 0x2a2d30, roughness: 0.55 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.3, 1.1, 0.5, 4, 0.2), shell());
  g.add(body);
  for (const sx of [-1, 1]) {
    const grip = new THREE.Mesh(new RoundedBoxGeometry(0.85, 1.55, 0.5, 4, 0.3), shell());
    grip.position.set(sx * 1.0, -0.62, 0);
    grip.rotation.z = sx * 0.28;
    g.add(grip);
    const bumper = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.22, 0.34, 3, 0.09), plate());
    bumper.position.set(sx * 0.85, 0.58, -0.04);
    g.add(bumper);
  }
  const top = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.72, 0.06, 3, 0.03), plate());
  top.position.set(0, 0.06, 0.26);
  g.add(top);
  // sticks
  const stick = (x: number, y: number) => {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.3, 0.1, 16), plate());
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, y, 0.3);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 16), mat.dark());
    cap.rotation.x = Math.PI / 2;
    cap.position.set(x, y, 0.4);
    g.add(ring, cap);
  };
  stick(-0.78, 0.12);
  stick(0.38, -0.34);
  // d-pad
  const dpadA = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.1), mat.dark());
  const dpadB = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.1), mat.dark());
  dpadA.position.set(-0.38, -0.34, 0.32);
  dpadB.position.copy(dpadA.position);
  g.add(dpadA, dpadB);
  // face buttons, four colours in a diamond (unlabelled)
  const colours = [0x46d836, 0xd8352a, 0x2f7de1, 0xf2c21a];
  const spots: [number, number][] = [[0, -0.2], [0.2, 0], [-0.2, 0], [0, 0.2]];
  spots.forEach(([dx, dy], i) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.1, 12), new THREE.MeshStandardMaterial({ color: colours[i], roughness: 0.35, emissive: colours[i], emissiveIntensity: 0.25 }));
    b.rotation.x = Math.PI / 2;
    b.position.set(0.78 + dx, 0.12 + dy, 0.31);
    g.add(b);
  });
  // centre ring (a plain glowing ring)
  const glow = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 8, 20), new THREE.MeshStandardMaterial({ color: 0x9dff6a, emissive: 0x46d836, emissiveIntensity: 1.2 }));
  glow.position.set(0, 0.28, 0.3);
  g.add(glow);
  for (const sx of [-1, 1]) {
    const sm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8), mat.dark());
    sm.rotation.x = Math.PI / 2;
    sm.position.set(sx * 0.35, 0.02, 0.31);
    g.add(sm);
  }
  g.rotation.x = -0.35;
  const wrap = new THREE.Group();
  wrap.add(g);
  return wrap;
}

/* ---------- Stand-in: silver music player (Projects > Music) ---------- */
function buildIpod(): THREE.Group {
  const g = new THREE.Group();
  const silver = new THREE.Mesh(new RoundedBoxGeometry(1.5, 2.45, 0.3, 4, 0.14), new THREE.MeshStandardMaterial({ color: 0xd4d8de, metalness: 0.85, roughness: 0.28 }));
  g.add(silver);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(1.22, 0.96, 0.05, 3, 0.04), mat.dark());
  bezel.position.set(0, 0.62, 0.16);
  g.add(bezel);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.8, 0.04), new THREE.MeshStandardMaterial({ color: 0xcfe6ff, emissive: 0x9cc8ff, emissiveIntensity: 0.7, roughness: 0.2 }));
  screen.position.set(0, 0.62, 0.19);
  g.add(screen);
  for (let i = 0; i < 4; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.07, 0.02), new THREE.MeshStandardMaterial({ color: i === 1 ? 0x2a6fe0 : 0x6c7f9a }));
    line.position.set(-0.05, 0.86 - i * 0.18, 0.215);
    g.add(line);
  }
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.06, 28), new THREE.MeshStandardMaterial({ color: 0xf1f3f6, roughness: 0.35 }));
  wheel.rotation.x = Math.PI / 2;
  wheel.position.set(0, -0.58, 0.17);
  g.add(wheel);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 20), new THREE.MeshStandardMaterial({ color: 0xc3c8d0, metalness: 0.7, roughness: 0.3 }));
  hub.rotation.x = Math.PI / 2;
  hub.position.set(0, -0.58, 0.2);
  g.add(hub);
  g.rotation.z = -0.1;
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

export type Kind = 'phone' | 'gear' | 'logo' | 'cartridge' | 'tv' | 'controller' | 'ipod';
const builders: Record<Kind, () => THREE.Group> = { phone: buildPhone, gear: buildGears, logo: buildLogo, cartridge: buildCartridge, tv: buildTv, controller: buildController, ipod: buildIpod };

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
        t.anisotropy = MOBILE ? 1 : 4;
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
    else if (o.name === 'spiny') o.rotation.y += dt * 0.7;
    if (o.name === 'spin-') o.rotation.z -= dt * 0.5 * (14 / 8);
  });
}

export function makeRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: MOBILE ? 'low-power' : 'default' });
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
  return { renderer, scene, rimA, rimB };
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
  // Phones: sideways drags spin the model, up/down drags scroll the page.
  if (MOBILE) canvas.style.touchAction = 'pan-y';
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
  // The About logo can change finish ('logostate' events from about.ts); it remembers the last one.
  const ac = new AbortController();
  const logoApply = () => setLogoState(pivot, Number(el.dataset.logoState ?? 2));
  makeObject(kind, file, (o) => {
    pivot.add(o);
    if (kind === 'logo') logoApply();
  });
  if (kind === 'logo') {
    el.addEventListener('logostate', logoApply, { signal: ac.signal });
    // The intro hands its logo over face-on: reset the spin and the orbit.
    el.addEventListener(
      'logoreset',
      () => {
        pivot.traverse((o) => {
          if (o.name === 'spiny') o.rotation.y = 0;
        });
        camera.position.set(0, 0.2, 6.6);
        controls.update();
      },
      { signal: ac.signal },
    );
  }

  let w = 0;
  let h = 0;
  let raf = 0;
  const gate = makeGate();
  let last = performance.now();

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!gate(performance.now())) return;
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
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      teardown(canvas, renderer, ac, controls);
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
          s = el.classList.contains('menu-stage') ? initMenuStage(el) : el.classList.contains('proj-stage') ? initProjectsStage(el) : initStage(el);
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
      // Phones keep one WebGL context at a time: free it when its screen is hidden (not just scrolled away).
      if (MOBILE && s && e.target.closest('.pane')?.hasAttribute('hidden')) {
        s.dispose();
        stages.delete(e.target);
      }
    }
  }
});
document.querySelectorAll('.model-stage, .menu-stage, .proj-stage').forEach((el) => io.observe(el));


/* ---------- Home menu: one object floats on the blue screen, swapped by the highlighted row ---------- */
function initMenuStage(el: HTMLElement) {
  const canvas = el.querySelector<HTMLCanvasElement>('canvas')!;
  const config: Record<string, { kind: string; file?: string; rotate?: [number, number, number]; tint?: string; textures?: string }> = JSON.parse(el.dataset.models ?? '{}');
  const { renderer, scene } = makeRenderer(canvas);
  const ac = new AbortController();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.1, 8);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const holders = new Map<string, { group: THREE.Group; s: number; sway: boolean; o: number }>();
  for (const [key, c] of Object.entries(config)) {
    const group = new THREE.Group();
    group.scale.setScalar(0.001);
    group.visible = false;
    scene.add(group);
    holders.set(key, { group, s: 0, sway: !!c.sway, o: 0 });
    makeObject(c.kind, c.file, (o) => group.add(o), { rotate: c.rotate, tint: c.tint, textures: c.textures });
  }

  let fitK = 1; // a tall, narrow stage (phones) shrinks the object so it stays inside the width
  let active = document.querySelector<HTMLElement>('.menu-row.is-sel')?.dataset.nav ?? [...holders.keys()][0];
  document.addEventListener(
    'menu:select',
    (e) => {
      active = (e as CustomEvent).detail.key;
    },
    { signal: ac.signal },
  );

  let w = 0;
  let h = 0;
  let raf = 0;
  const gate = makeGate();
  let last = performance.now();
  let t = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!gate(performance.now())) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw && ch && (cw !== w || ch !== h)) {
      w = cw;
      h = ch;
      renderer.setSize(Math.ceil(w / PIXEL), Math.ceil(h / PIXEL), false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fitK = Math.min(1, 1.15 * camera.aspect);
    }
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!reduce) t += dt;

    for (const [key, hd] of holders) {
      const target = key === active ? 1 : 0;
      hd.s += (target - hd.s) * (1 - Math.exp(-dt * 11));
      hd.group.visible = hd.s > 0.02;
      hd.group.scale.setScalar(Math.max(hd.s * fitK, 0.001));
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
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      teardown(canvas, renderer, ac);
    },
  };
}


/* ---------- Projects screen: the category model glides between "browse" and "open" ----------
   projects.ts sends `proj:state` ({ level, cat, accent }). Position, size and spin are springs, so the
   model overshoots and settles. The rim lights take the category's accent colour. */
function initProjectsStage(el: HTMLElement) {
  const canvas = el.querySelector<HTMLCanvasElement>('canvas')!;
  const config: Record<string, { kind: string; file?: string; rotate?: [number, number, number]; tint?: string; textures?: string; accent?: string; sway?: boolean }> = JSON.parse(el.dataset.models ?? '{}');
  const pane = el.closest<HTMLElement>('.pane')!;
  const { renderer, scene, rimA, rimB } = makeRenderer(canvas);
  const ac = new AbortController();
  const FOV = 30;
  const DIST = 8;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.set(0, 0.1, DIST);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const holders = new Map<string, { group: THREE.Group; s: number; sway: boolean; o: number }>();
  for (const [key, c] of Object.entries(config)) {
    const group = new THREE.Group();
    group.scale.setScalar(0.001);
    group.visible = false;
    scene.add(group);
    holders.set(key, { group, s: 0, sway: !!c.sway, o: 0 });
    makeObject(c.kind, c.file, (o) => group.add(o), { rotate: c.rotate, tint: c.tint, textures: c.textures });
  }

  // Where the model sits, as a fraction of half the screen width (-1 is the left edge), and how big.
  // The model sits centred above the list on every screen size, and just shrinks when a category opens.
  const CAROUSEL_GAP = 0.64; // side models sit this far from the middle, as a fraction of half the stage width (see projects.ts)
  // Desktop has the room, so the models (and their orb, see global.css) are bigger there.
  const POSE_PHONE = { browse: { x: 0, y: 0, scale: 0.68 }, open: { x: 0, y: 0, scale: 0.55 }, pick: { x: 0, y: 0, scale: 0.8 } } as const;
  const POSE_DESK = { browse: { x: 0, y: 0, scale: 0.95 }, open: { x: 0, y: 0, scale: 0.75 }, pick: { x: 0, y: 0, scale: 1.08 } } as const;
  // Checked live (not once at load), so resizing or switching to a phone view changes the layout at once.
  const phone = () => MOBILE_MQ.matches;
  const POSE = () => (phone() ? POSE_PHONE : POSE_DESK);
  type Spring = { x: number; v: number };
  const spring = (x: number): Spring => ({ x, v: 0 });
  const step = (sp: Spring, target: number, dt: number, k = 62, damp = 9) => {
    sp.v += (target - sp.x) * k * dt;
    sp.v -= sp.v * Math.min(damp * dt, 1);
    sp.x += sp.v * dt;
  };

  let level: 'browse' | 'open' = (pane.dataset.level as 'browse' | 'open') ?? 'browse';
  let cat = pane.dataset.cat ?? [...holders.keys()][0];
  let picked = false; // phones: a project is chosen, so the model rides up into the small top stage
  const px = spring(POSE().browse.x);
  const py = spring(0);
  const ps = spring(POSE().browse.scale);
  let spin = 0; // extra spin speed (rad/s) that dies away: a whirl on every change
  let yaw = 0;
  let whirl = 0; // flat models spin once or twice on a change, then ease back to facing front
  let tiltX = 0;
  let tiltY = 0;
  let aimX = 0;
  let aimY = 0;
  const accent = new THREE.Color(0x9bb8ff);
  const accentTo = new THREE.Color(0x9bb8ff);
  const baseB = new THREE.Color(0xffffff);

  document.addEventListener('proj:state', (e) => {
    const d = (e as CustomEvent).detail as { level: 'browse' | 'open'; cat: string; accent?: string; pick?: boolean };
    if (!!d.pick !== picked) spin = Math.max(spin, reduce ? 0 : 8);
    picked = !!d.pick;
    if (d.level !== level) {
      spin = reduce ? 0 : 15;
      whirl = reduce ? 0 : Math.PI * 4;
    }
    level = d.level;
    if (d.cat && d.cat !== cat) {
      cat = d.cat;
      spin = Math.max(spin, reduce ? 0 : 7);
      whirl = reduce ? 0 : Math.PI * 2;
    }
    if (d.accent) accentTo.set(d.accent);
  }, { signal: ac.signal });
  // Coming back to the screen: the model pops in again from nothing.
  document.addEventListener('pane:change', (e) => {
    if ((e as CustomEvent).detail.name !== 'projects') return;
    for (const hd of holders.values()) hd.s = 0;
    px.x = POSE().browse.x - 0.5;
    px.v = 0;
    ps.x = 0.2;
    ps.v = 0;
    spin = reduce ? 0 : 12;
    whirl = reduce ? 0 : Math.PI * 4;
  }, { signal: ac.signal });
  pane.addEventListener('pointermove', (e) => {
    const r = pane.getBoundingClientRect();
    aimX = ((e.clientX - r.left) / r.width) * 2 - 1;
    aimY = ((e.clientY - r.top) / r.height) * 2 - 1;
  }, { signal: ac.signal });

  let w = 0;
  let h = 0;
  let raf = 0;
  const gate = makeGate();
  let last = performance.now();
  let t = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!gate(performance.now())) return;
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
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduce) t += dt;

    const pose = POSE()[level === 'open' && picked ? 'pick' : level];
    step(px, pose.x, dt);
    step(py, pose.y, dt);
    step(ps, pose.scale, dt, 70, 8);
    spin *= Math.exp(-dt * 1.7);
    yaw += (reduce ? 0 : 0.45 + spin) * dt;
    whirl *= Math.exp(-dt * 2.4);
    // The model leans toward the pointer a little.
    tiltX += ((reduce ? 0 : aimY * 0.28) - tiltX) * (1 - Math.exp(-dt * 5));
    tiltY += ((reduce ? 0 : aimX * 0.4) - tiltY) * (1 - Math.exp(-dt * 5));
    accent.lerp(accentTo, 1 - Math.exp(-dt * 4));
    rimA.color.copy(accent);
    rimB.color.copy(baseB).lerp(accent, 0.35);

    const halfH = Math.tan((FOV * Math.PI) / 360) * DIST;
    const halfW = halfH * camera.aspect;

    // Desktop: a carousel. The chosen model is big in the middle, the others sit smaller to its sides.
    // Phones show one at a time. An open category shows only its own model.
    const keys = [...holders.keys()];
    const n = keys.length;
    const si = Math.max(0, keys.indexOf(cat));
    keys.forEach((key, idx) => {
      const hd = holders.get(key)!;
      const target = key === cat ? 1 : !phone() && level === 'browse' ? 0.5 : 0;
      let d = idx - si;
      if (n > 2) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      if (phone()) d = 0;
      if (hd.s < 0.05) hd.o = d;
      hd.o += (d - hd.o) * (1 - Math.exp(-dt * 9));
      hd.s += (target - hd.s) * (1 - Math.exp(-dt * 9));
      hd.group.visible = hd.s > 0.02;
      hd.group.scale.setScalar(Math.max(hd.s * ps.x, 0.001));
      hd.group.position.set((px.x + hd.o * CAROUSEL_GAP) * halfW, py.x * halfH + (reduce ? 0 : Math.sin(t * 1.1 + idx) * 0.12), 0);
      hd.group.rotation.set(tiltX, (hd.sway ? Math.sin(t * 0.8) * 0.7 + whirl : yaw) + tiltY, 0);
      if (!reduce) spinParts(hd.group, dt);
    });
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
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      teardown(canvas, renderer, ac);
    },
  };
}
