import * as THREE from 'three';
import { posterTexture, synthWindowTexture } from './textures';

const PAL = { floor: '#b98d64', wallB: '#ece4d8', wallL: '#e3d9cb', rug: '#c96a5a', desk: '#d8b48a' };

const mat = (color: string, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true, ...o });

function box(w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function shadowed<T extends THREE.Object3D>(g: T): T {
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

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
}

export function buildRoom(opts: { neonScale?: number; screenTexture?: THREE.Texture } = {}): Room {
  const g = new THREE.Group();
  const add = <T extends THREE.Object3D>(o: T) => { g.add(o); return o; };

  add(box(8, 0.3, 8, mat(PAL.floor), 0, -0.15, 0));
  add(box(8, 5, 0.3, mat(PAL.wallB), 0, 2.5, -4.15));
  add(box(0.3, 5, 8, mat(PAL.wallL), -4.15, 2.5, 0));

  const win = add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshBasicMaterial({ color: '#9fd8ff' })));
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
  add(box(1.2, 0.05, 0.4, mat('#333'), -1.4, 1.6, -2.7));
  const monitorLight = add(new THREE.PointLight('#5cf0ff', 0.8, 5));
  monitorLight.position.set(-1.4, 2.4, -2.3);

  const mug = new THREE.Group();
  mug.add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.3, 16), mat('#ffffff', { flatShading: false })));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 8, 16), mat('#ffffff'));
  handle.position.x = 0.16; mug.add(handle);
  mug.position.set(0.1, 1.73, -2.8);
  add(shadowed(mug));

  const chair = new THREE.Group();
  chair.add(box(1, 0.12, 1, mat('#2b2b3a'), 0, 0.9, 0)); chair.add(box(1, 1.1, 0.12, mat('#2b2b3a'), 0, 1.5, 0.48));
  chair.add(box(0.1, 0.9, 0.1, mat('#111'), 0, 0.45, 0));
  chair.position.set(-1.3, 0, -1.6); chair.rotation.y = 0.25;
  add(chair);

  const shelf = new THREE.Group();
  shelf.add(box(0.6, 3.4, 2.4, mat('#6b4a32'), 0, 1.7, 0));
  const bookColors = ['#ff6b6b', '#ffd93d', '#6bcbff', '#9b7bff', '#6bffb0', '#ff9f6b'];
  let seed = 3;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let s = 0; s < 3; s++) {
    shelf.add(box(0.62, 0.08, 2.3, mat('#8a6446'), 0.02, 0.6 + s, 0));
    let z = -1;
    while (z < 0.95) {
      const w = 0.12 + rnd() * 0.12, h = 0.55 + rnd() * 0.3;
      shelf.add(box(0.45, h, w, mat(bookColors[(rnd() * 6) | 0]), 0.1, 0.64 + s + h / 2, z + w / 2));
      z += w + 0.02;
    }
  }
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

  return { group: g, window: win, nightWindow, screen, monitorLight, lamp, bulb, mug, shelf, setNeon };
}
