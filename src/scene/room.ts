import * as THREE from 'three';
import { bookShadeTexture, moteTexture, posterTexture, waveTexture, skyTexture, spineTexture, steamTexture, synthWindowTexture } from './textures';

const PAL = { floor: '#b98d64', wallB: '#ece4d8', wallL: '#e3d9cb', rug: '#c96a5a', desk: '#d8b48a' };

const mat = (color: string, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true, ...o });

function box(w: number, h: number, d: number, m: THREE.Material | THREE.Material[], x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function shadowed<T extends THREE.Object3D>(g: T): T {
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/** icon: an SVG path in a 24×24 box, stamped on the spine under the title. */
export interface Book { name: string; color: string; ink: string; icon?: string }

export interface Room {
  group: THREE.Group;
  window: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  nightWindow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  screen: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  monitorLight: THREE.PointLight;
  lamp: THREE.PointLight;
  bulb: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  mug: THREE.Object3D;
  shelf: THREE.Object3D;
  setNeon(k: number): void;
  setBeam(k: number): void;
  /** 0..1: steam rising from the morning coffee. */
  setSteam(k: number): void;
  /** Slides a language's book out of the shelf (null puts it back). */
  focusBook(name: string | null): void;
  /** Eases the books towards their targets; true while one is still moving. */
  tickBooks(dt: number): boolean;
  /** Keyboard backlight, 0..1 with the night. */
  setKeyboard(night: number): void;
  /** The synth under the window: its screen glows with the night, and at night it plays a slow arpeggio (t in ms; 0 holds still). */
  setSynth(night: number, t: number): void;
  /** 0..1: green souls drifting past the window, after hours; t (ms) moves them. */
  setSouls(k: number, t: number): void;
}

export function buildRoom(opts: { neonScale?: number; screenTexture?: THREE.Texture; books?: readonly Book[] } = {}): Room {
  const g = new THREE.Group();
  const add = <T extends THREE.Object3D>(o: T) => { g.add(o); return o; };

  add(box(8, 0.3, 8, mat(PAL.floor), 0, -0.15, 0));
  add(box(8, 5, 0.3, mat(PAL.wallB), 0, 2.5, -4.15));
  add(box(0.3, 5, 8, mat(PAL.wallL), -4.15, 2.5, 0));

  const win = add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshBasicMaterial({ color: '#9fd8ff', map: skyTexture() })));
  win.position.set(1.6, 3, -3.99);
  const nightWindow = add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6),
    new THREE.MeshBasicMaterial({ map: synthWindowTexture(), transparent: true, opacity: 0 })));
  nightWindow.position.set(1.6, 3, -3.985);
  const fm = mat('#2b2233');
  add(box(2.36, 0.08, 0.38, fm, 1.6, 2.16, -4.1)); add(box(2.36, 0.08, 0.38, fm, 1.6, 3.84, -4.1));
  add(box(0.08, 1.68, 0.38, fm, 0.46, 3, -4.1)); add(box(0.08, 1.68, 0.38, fm, 2.74, 3, -4.1));
  add(box(0.04, 1.6, 0.06, fm, 1.6, 3, -3.97));

  const rug = add(new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.04, 32), mat(PAL.rug)));
  rug.position.set(0.6, 0.02, 0.6); rug.receiveShadow = true;

  add(box(3.4, 0.15, 1.5, mat(PAL.desk), -1.3, 1.5, -3.1));
  for (const [x, z] of [[-2.9, -3.7], [0.3, -3.7], [-2.9, -2.5], [0.3, -2.5]]) add(box(0.12, 1.5, 0.12, mat('#6e5038'), x, 0.75, z));

  const mon = new THREE.Group();
  mon.add(box(1.9, 1.15, 0.08, mat('#222'), 0, 0, 0));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.02), new THREE.MeshBasicMaterial({ map: opts.screenTexture ?? null, color: '#ffffff' }));
  screen.position.z = 0.045; mon.add(screen);
  mon.add(box(0.12, 0.5, 0.12, mat('#222'), 0, -0.75, -0.05));
  mon.position.set(-1.4, 2.4, -3.5);
  add(shadowed(mon));
  // A low-profile 75% keyboard: a case, a backlight plate showing between the keys, and instanced keycaps with a few
  // accent keys (Esc, Enter, the arrows).
  const kb = new THREE.Group();
  kb.add(box(1.22, 0.05, 0.44, mat('#26262e'), 0, 0, 0));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.37), new THREE.MeshBasicMaterial({ color: '#1a1a20' }));
  plate.rotation.x = -Math.PI / 2; plate.position.y = 0.026; kb.add(plate);
  const keyMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, flatShading: true });
  const rows = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1], [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 1],
    [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25, 1], [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75, 1, 1],
    [1.25, 1.25, 1.25, 6.25, 1, 1, 1, 1, 1, 1]];
  const U = 0.07, count = rows.flat().length;
  const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.03, 1), keyMat, count);
  const m4 = new THREE.Matrix4(), base = new THREE.Color('#e9e4da'), accent = new THREE.Color('#ff6a3d'), dark = new THREE.Color('#5b5b66');
  let k = 0;
  rows.forEach((row, r) => {
    let kx = -0.56;
    row.forEach((wu, c) => {
      const kw = wu * U - 0.012;
      m4.makeScale(kw, 1, U - 0.012).setPosition(kx + kw / 2 + 0.006, 0.042, -0.14 + r * U);
      caps.setMatrixAt(k, m4);
      const last = c === row.length - 1;
      const arrows = r >= 3 && c >= row.length - (r === 3 ? 2 : 3);
      caps.setColorAt(k++, (r === 0 && c === 0) || (r === 2 && c === row.length - 2) ? accent : arrows || last || wu > 1.2 ? dark : base);
      kx += wu * U;
    });
  });
  caps.castShadow = caps.receiveShadow = true;
  kb.add(caps);
  kb.position.set(-1.4, 1.6, -2.72); kb.rotation.y = 0.04;
  add(kb);
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), mat('#26262e', { flatShading: false }));
  mouse.scale.set(0.8, 0.45, 1.25); mouse.position.set(-0.5, 1.6, -2.66); mouse.castShadow = true;
  add(mouse);
  const kbOff = new THREE.Color('#1a1a20'), kbGlow = new THREE.Color('#8a6bff');
  const setKeyboard = (night: number) => {
    plate.material.color.copy(kbOff).lerp(kbGlow, night * 0.75);
    keyMat.emissive.copy(kbGlow).multiplyScalar(night * 0.14);
  };
  setKeyboard(0);

  // A two-octave synth on an X-stand under the window: walnut cheeks, a knob panel with a little screen, 25 keys.
  const synth = new THREE.Group();
  const legMat = mat('#1c1c22');
  for (const sz of [-0.14, 0.14]) for (const tilt of [-0.664, 0.664]) {
    const leg = box(1.39, 0.045, 0.045, legMat, 0, 0.42, sz); leg.rotation.z = tilt; synth.add(leg);
  }
  for (const sx of [-0.55, 0.55]) synth.add(box(0.05, 0.04, 0.44, legMat, sx, 0.83, 0));
  synth.add(box(1.48, 0.08, 0.5, mat('#2a2a31'), 0, 0.88, 0));
  for (const sx of [-0.77, 0.77]) synth.add(box(0.06, 0.15, 0.52, mat('#6b3e22'), sx, 0.9, 0));
  for (let i = 0; i < 8; i++) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.035, 12), mat(i === 3 ? '#ff6a3d' : '#d9d4c8'));
    knob.position.set(-0.12 + i * 0.1, 0.937, -0.13); synth.add(knob);
  }
  const synthScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.12), new THREE.MeshBasicMaterial({ color: '#203028', map: waveTexture() }));
  synthScreen.rotation.x = -Math.PI / 2; synthScreen.position.set(-0.45, 0.922, -0.13); synth.add(synthScreen);
  const WK = 1.3 / 15, WHITE = [0, 2, 4, 5, 7, 9, 11], BLACK = [1, 3, 6, 8, 10];
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, flatShading: true });
  const whites = new THREE.InstancedMesh(new THREE.BoxGeometry(WK - 0.006, 0.035, 0.24), whiteMat, 15);
  const blacks = new THREE.InstancedMesh(new THREE.BoxGeometry(WK * 0.56, 0.035, 0.15), whiteMat, 10);
  // Chromatic key c (0 = C) → which instanced mesh, which instance, and where it rests.
  const keys = Array.from({ length: 25 }, (_, c) => {
    const o = Math.floor(c / 12), n = c % 12, white = WHITE.includes(n);
    const wi = o * 7 + (white ? WHITE.indexOf(n) : WHITE.indexOf(n - 1));
    return white
      ? { mesh: whites, i: wi, x: -0.65 + (wi + 0.5) * WK, y: 0.935, z: 0.12, base: new THREE.Color('#f1ede4') }
      : { mesh: blacks, i: o * 5 + BLACK.indexOf(n), x: -0.65 + (wi + 1) * WK, y: 0.96, z: 0.075, base: new THREE.Color('#1d1d22') };
  });
  const lit = new THREE.Color('#ff5ac8'), tmp = new THREE.Color();
  const placeKey = (k: (typeof keys)[number], press: number) => {
    m4.makeTranslation(k.x, k.y - press * 0.014, k.z);
    k.mesh.setMatrixAt(k.i, m4);
    k.mesh.setColorAt(k.i, tmp.copy(k.base).lerp(lit, press * 0.8));
  };
  keys.forEach((k) => placeKey(k, 0));
  whites.castShadow = blacks.castShadow = true;
  synth.add(whites, blacks);
  synth.position.set(1.45, 0, -2.85); synth.scale.setScalar(1.25); synth.rotation.y = -0.12;
  add(shadowed(synth));
  // A-minor-seventh, up and down, with a C an octave up to finish the phrase every other bar.
  const ARP = [9, 12, 16, 19, 21, 19, 16, 12, 9, 12, 16, 19, 24, 19, 16, 12], STEP = 330;
  const screenOff = new THREE.Color('#203028'), screenOn = new THREE.Color('#9dffd6');
  let playing = -1;
  const setSynth = (night: number, t: number) => {
    synthScreen.material.color.copy(screenOff).lerp(screenOn, Math.min(1, 0.25 + night));
    const on = night > 0.5 && t > 0;
    const step = on ? Math.floor(t / STEP) : -1;
    const press = on ? 1 - (t % STEP) / STEP : 0;
    if (step === -1 && playing === -1) return;
    keys.forEach((k, c) => placeKey(k, on && c === ARP[step % ARP.length] ? press : 0));
    whites.instanceMatrix.needsUpdate = blacks.instanceMatrix.needsUpdate = true;
    if (whites.instanceColor) whites.instanceColor.needsUpdate = true;
    if (blacks.instanceColor) blacks.instanceColor.needsUpdate = true;
    playing = step;
  };
  const monitorLight = add(new THREE.PointLight('#5cf0ff', 0.8, 5));
  monitorLight.position.set(-1.4, 2.4, -2.3);

  const mug = new THREE.Group();
  mug.add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.3, 24), mat('#ffffff', { flatShading: false })));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 10, 20), mat('#ffffff', { flatShading: false }));
  handle.position.x = 0.16; mug.add(handle);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.128, 24), mat('#4a2a18', { roughness: 0.3, flatShading: false }));
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.125; mug.add(coffee);
  mug.position.set(0.1, 1.73, -2.8);
  add(shadowed(mug));
  const steam = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTexture(), transparent: true, opacity: 0, depthWrite: false })));
  steam.scale.set(0.3, 0.6, 1);
  steam.position.set(0.1, 2.2, -2.8);

  const chair = new THREE.Group();
  chair.add(box(1, 0.12, 1, mat('#2b2b3a'), 0, 0.9, 0)); chair.add(box(1, 1.1, 0.12, mat('#2b2b3a'), 0, 1.5, 0.48));
  chair.add(box(0.1, 0.9, 0.1, mat('#111'), 0, 0.45, 0));
  chair.position.set(-1.3, 0, -1.6); chair.rotation.y = 0.25;
  add(chair);

  // An open bookcase against the left wall (its front faces +x): back, sides, top, plinth and three shelves, with the
  // books standing inside it at slightly different depths.
  const shelf = new THREE.Group();
  const wood = mat('#6b4a32'), board = mat('#8a6446');
  shelf.add(box(0.04, 3.62, 2.4, mat('#5a3d29'), -0.28, 1.81, 0));
  for (const sz of [-1.175, 1.175]) shelf.add(box(0.6, 3.62, 0.05, wood, 0, 1.81, sz));
  shelf.add(box(0.64, 0.07, 2.48, wood, 0.01, 3.62, 0));
  shelf.add(box(0.6, 0.56, 2.3, wood, 0, 0.28, 0));
  const bookColors = ['#ff6b6b', '#ffd93d', '#6bcbff', '#9b7bff', '#6bffb0', '#ff9f6b'];
  let seed = 3;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  // Books: spine (+x) shaded towards its edges, cream page edges on top, covers in the book's colour.
  const pages = mat('#efe6d2', { roughness: 0.95 });
  const bookTex = bookShadeTexture();
  const plainMats = new Map<string, THREE.Material[]>();
  const plain = (color: string) => {
    if (!plainMats.has(color)) {
      const cover = mat(color), spine = new THREE.MeshStandardMaterial({ color, map: bookTex, roughness: 0.75, flatShading: true });
      plainMats.set(color, [spine, cover, pages, cover, cover, cover]);
    }
    return plainMats.get(color)!;
  };
  const BD = 0.42; // book depth
  const depth = () => 0.06 + rnd() * 0.04; // x of a book's centre: fronts stagger a little
  // Language books (opts.books) stand among the plain ones, a few per shelf, their titled spines facing the room.
  const titled = new Map<string, { mesh: THREE.Mesh; x: number; out: number; target: number }>();
  const LW = 0.26;
  for (let s = 0; s < 3; s++) {
    shelf.add(box(0.58, 0.06, 2.3, board, 0, 0.6 + s, 0));
    const mine = (opts.books ?? []).filter((_, i) => i % 3 === s);
    let z = -1.1, gap = 1 + ((rnd() * 2) | 0);
    while (z < 1.05) {
      const tight = mine.length > 0 && 1.05 - z <= mine.length * (LW + 0.02) + 0.06;
      if (mine.length && (gap <= 0 || tight)) {
        const b = mine.shift()!, h = 0.74 + rnd() * 0.04, x = depth();
        const cover = mat(b.color), spine = new THREE.MeshStandardMaterial({ map: spineTexture(b.name, b.color, b.ink, b.icon), roughness: 0.75, flatShading: true });
        const mesh = box(BD, h, LW, [spine, cover, pages, cover, cover, cover], x, 0.63 + s + h / 2, z + LW / 2);
        mesh.userData.book = b.name;
        shelf.add(mesh);
        titled.set(b.name, { mesh, x, out: 0, target: 0 });
        z += LW + 0.015; gap = 1 + ((rnd() * 2) | 0);
        continue;
      }
      const w = 0.1 + rnd() * 0.12, h = 0.55 + rnd() * 0.3;
      if (z + w > 1.12) break;
      shelf.add(box(BD, h, w, plain(bookColors[(rnd() * 6) | 0]), depth(), 0.63 + s + h / 2, z + w / 2));
      z += w + 0.015; gap--;
    }
  }
  // A couple of books lying on top of the case.
  for (const [h, w, c, rot] of [[0.07, 0.6, '#9b7bff', 0.12], [0.06, 0.52, '#ffd93d', -0.08]] as const) {
    const y = 3.655 + (c === '#ffd93d' ? 0.07 : 0) + h / 2;
    const lying = box(0.4, h, w, plain(c), 0.02, y, 0.55);
    lying.rotation.y = rot;
    shelf.add(lying);
  }
  const focusBook = (name: string | null) => { for (const [n, b] of titled) b.target = n === name ? 0.18 : 0; };
  const tickBooks = (dt: number) => {
    let moving = false;
    for (const b of titled.values()) {
      if (b.out === b.target) continue;
      b.out += (b.target - b.out) * (1 - Math.exp(-12 * dt));
      if (Math.abs(b.target - b.out) < 1e-3) b.out = b.target; else moving = true;
      b.mesh.position.x = b.x + b.out;
    }
    return moving;
  };
  shelf.position.set(-3.65, 0, 0.6);
  add(shelf);

  const poster = add(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.5), new THREE.MeshStandardMaterial({ map: posterTexture() })));
  poster.rotation.y = Math.PI / 2; poster.position.set(-3.98, 3.4, -1.8);

  const pot = add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.6, 12), mat('#e07a5f')));
  pot.position.set(3, 0.3, -3.2);
  for (const [x, y, z, s] of [[0, 1, 0, 0.55], [0.25, 1.35, 0.1, 0.4], [-0.2, 1.3, -0.1, 0.38]]) {
    const leaf = add(new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), mat('#4caf50')));
    leaf.position.set(3 + x, y, -3.2 + z); leaf.castShadow = true;
  }

  const lamp = add(new THREE.PointLight('#ffb36b', 0, 7));
  lamp.position.set(1.8, 3.6, -1);
  const bulb = add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), new THREE.MeshBasicMaterial({ color: '#bbbbbb' })));
  bulb.position.copy(lamp.position);
  add(box(0.02, 1.4, 0.02, mat('#222'), 1.8, 4.3, -1));

  const n1 = new THREE.MeshBasicMaterial({ color: '#3a3a44' }), n2 = new THREE.MeshBasicMaterial({ color: '#3a3a44' });
  const strips: [THREE.BoxGeometry, THREE.Material, [number, number, number]][] = [
    [new THREE.BoxGeometry(7.9, 0.06, 0.06), n1, [0, 4.85, -3.97]],
    [new THREE.BoxGeometry(0.06, 0.06, 7.9), n2, [-3.97, 4.85, 0]],
    [new THREE.BoxGeometry(3.2, 0.04, 0.04), n1, [-1.3, 1.4, -2.36]],
  ];
  for (const [geo, m, p] of strips) { const s = add(new THREE.Mesh(geo, m)); s.position.set(...p); }
  const nl1 = add(new THREE.PointLight('#ff2ad4', 0, 10)); nl1.position.set(0, 4.4, -3.3);
  const nl2 = add(new THREE.PointLight('#2af0ff', 0, 10)); nl2.position.set(-3.3, 4.4, 0);
  const off = new THREE.Color('#3a3a44'), c1 = new THREE.Color('#ff2ad4'), c2 = new THREE.Color('#2af0ff');
  const ns = opts.neonScale ?? 0.3;
  const setNeon = (k: number) => {
    n1.color.copy(off).lerp(c1, k); n2.color.copy(off).lerp(c2, k);
    nl1.intensity = k * 1.5 * ns; nl2.intensity = k * 1.2 * ns;
  };
  setNeon(0);

  // Morning sunbeam: a shadowless spot from outside the window (it passes through the wall) lays a warm patch on
  // the floor, and an additive shaft traces the light from the window to that patch.
  const beamDir = new THREE.Vector3(0, -1.6, 2.5);
  const sunbeam = add(new THREE.SpotLight('#ffd59a', 0, 0, 0.085, 0.5, 0));
  sunbeam.position.set(1.6, 3, -4).addScaledVector(beamDir, -6); // far back, so its cone matches the parallel shaft
  sunbeam.target.position.set(1.6, 0, 0.7);
  add(sunbeam.target);
  const corners = [[0.5, 2.2], [2.7, 2.2], [2.7, 3.8], [0.5, 3.8]].map(([x, y]) => {
    const top = new THREE.Vector3(x, y, -3.96);
    return [top, top.clone().addScaledVector(beamDir, (y - 0.03) / 1.6)];
  });
  const pos: number[] = [], col: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [a0, a1] = corners[i], [b0, b1] = corners[(i + 1) % 4];
    for (const [v, alpha] of [[a0, 1], [b0, 1], [b1, 0], [a0, 1], [b1, 0], [a1, 0]] as const) {
      pos.push(v.x, v.y, v.z); col.push(1, 0.82, 0.55, alpha);
    }
  }
  const shaftGeo = new THREE.BufferGeometry();
  shaftGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  shaftGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  const shaft = add(new THREE.Mesh(shaftGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })));
  // Dust motes drifting in the shaft: a fixed scatter (seeded, so every visit matches) inside the beam volume.
  const motePos: number[] = [];
  for (let i = 0; i < 90; i++) {
    const t = 0.08 + rnd() * 0.85;
    const top = new THREE.Vector3(0.5 + rnd() * 2.2, 2.2 + rnd() * 1.6, -3.96);
    const p = top.addScaledVector(beamDir, t * (top.y - 0.03) / 1.6);
    motePos.push(p.x + (rnd() - 0.5) * 0.1, p.y, p.z);
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.Float32BufferAttribute(motePos, 3));
  const motes = add(new THREE.Points(moteGeo, new THREE.PointsMaterial({ map: moteTexture(), color: '#ffe7bf', size: 0.05,
    transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })));

  const setBeam = (k: number) => {
    sunbeam.intensity = k * 5;
    shaft.material.opacity = k * 0.16;
    motes.material.opacity = k * 0.9;
    shaft.visible = sunbeam.visible = motes.visible = k > 0.001;
  };
  setBeam(0);
  const setSteam = (k: number) => { steam.material.opacity = k * 0.8; steam.visible = k > 0.001; };
  setSteam(0);

  // Souls: a few green wisps rising past the night window (on the glass, behind the mullion), each on its own loop.
  const soulMat = new THREE.SpriteMaterial({ map: moteTexture(), color: '#5dffa8', transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false });
  const souls = Array.from({ length: 7 }, (_, i) => {
    const sp = add(new THREE.Sprite(soulMat.clone()));
    const size = 0.14 + rnd() * 0.12;
    sp.scale.set(size, size, 1);
    return { sp, x: 0.7 + rnd() * 1.8, speed: 0.6 + rnd() * 0.7, phase: i / 7 };
  });
  const setSouls = (k: number, t: number) => {
    for (const s of souls) {
      s.sp.visible = k > 0.001;
      if (!s.sp.visible) continue;
      const rise = (s.phase + (t / 1000) * 0.045 * s.speed) % 1;
      s.sp.position.set(s.x + Math.sin(t / 1400 + s.phase * 9) * 0.07, 2.28 + rise * 1.46, -3.975);
      s.sp.material.opacity = k * Math.sin(rise * Math.PI) * 0.95;
    }
  };
  setSouls(0, 0);

  return { group: g, window: win, nightWindow, screen, monitorLight, lamp, bulb, mug, shelf, setNeon, setBeam, setSteam, focusBook, tickBooks, setKeyboard, setSynth, setSouls };
}
