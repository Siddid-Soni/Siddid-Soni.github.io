import * as THREE from 'three';
import { buildRoom } from './room';
import { createLights, applyLighting } from './lighting';
import { damp, frameOffset, sampleTimeline } from './timeline';

export interface StartOptions { projects: unknown[]; still?: number }

export function start(host: HTMLElement, opts: StartOptions) {
  const narrow = innerWidth < 760;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parallax = !reduced && !narrow && matchMedia('(pointer: fine)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, failIfMajorPerformanceCaveat: false });
  if (!renderer.getContext()) throw new Error('WebGL unavailable');
  renderer.setPixelRatio(Math.min(devicePixelRatio, narrow ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  host.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  const lights = createLights(scene, narrow ? 1024 : 2048);
  const room = buildRoom({ neonScale: 0.3 });
  scene.add(room.group);

  let target = opts.still ?? 0;
  let current = target;
  let mouse = { x: 0, y: 0 }, smoothMouse = { x: 0, y: 0 };
  let dirty = true, raf = 0, last = performance.now(), lastIdle = 0, lastIndex = -1;
  let w = 0, h = 0;

  const resize = () => {
    w = host.clientWidth; h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    dirty = true;
  };
  resize();

  const onProgress = (e: Event) => { if (opts.still == null) { target = (e as CustomEvent<{ f: number }>).detail.f; dirty = true; } };
  const onPointer = (e: PointerEvent) => { mouse = { x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }; dirty = true; };
  addEventListener('portfolio:progress', onProgress);
  addEventListener('resize', resize);
  if (parallax) addEventListener('pointermove', onPointer, { passive: true });
  if (opts.still == null && window.__portfolio) target = current = window.__portfolio.f;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    current = reduced ? target : damp(current, target, dt);
    smoothMouse = { x: damp(smoothMouse.x, mouse.x, dt), y: damp(smoothMouse.y, mouse.y, dt) };
    const settling = Math.abs(current - target) > 1e-4 || Math.abs(smoothMouse.x - mouse.x) + Math.abs(smoothMouse.y - mouse.y) > 1e-3;
    const s = sampleTimeline(current, undefined, { reducedMotion: reduced });
    const idle = !reduced && s.lighting.night > 0.5 && now - lastIdle > 1000 / 30;
    if (!dirty && !settling && !idle) { host.dataset.settled = 'true'; return; }
    if (idle) lastIdle = now;
    dirty = false;
    host.dataset.settled = 'false';

    if (reduced && s.index !== lastIndex && lastIndex !== -1) {
      host.classList.remove('cut'); void host.offsetWidth; host.classList.add('cut');
    }
    lastIndex = s.index;

    camera.position.set(s.position[0] + smoothMouse.x * 0.25, s.position[1] + smoothMouse.y * 0.15, s.position[2]);
    camera.lookAt(s.lookAt[0], s.lookAt[1], s.lookAt[2]);
    const o = frameOffset(s.viewOffset, w, h);
    camera.setViewOffset(w, h, o.x, o.y, w, h);
    camera.updateProjectionMatrix();
    applyLighting(scene, lights, room, s.lighting, idle ? Math.sin(now / 180) * 0.5 + 0.5 : 0);
    renderer.render(scene, camera);
    host.dataset.scene = 'ready';
  };
  raf = requestAnimationFrame(frame);

  const onVisibility = () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else { last = performance.now(); dirty = true; raf = requestAnimationFrame(frame); }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    renderer, room, scene,
    markDirty() { dirty = true; },
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener('portfolio:progress', onProgress);
      removeEventListener('resize', resize);
      removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.dispose();
      canvas.remove();
    },
  };
}
