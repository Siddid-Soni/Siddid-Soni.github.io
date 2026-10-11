import * as THREE from 'three';
import { buildRoom, type Book } from './room';
import { createLights, applyLighting } from './lighting';
import { createFrameSampler, damp, frameOffset, sampleTimeline } from './timeline';
import { createMonitor, type MonitorProject } from './monitor';

export interface StartOptions { projects: MonitorProject[]; books?: Book[]; still?: number }

const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));

/** Waits for the GPU to drain queued work without blocking the main thread (WebGL2 fence, polled). */
async function gpuIdle(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  if (!('fenceSync' in gl)) return yieldToMain();
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (!sync) return yieldToMain();
  gl.flush();
  while (gl.clientWaitSync(sync, 0, 0) === gl.TIMEOUT_EXPIRED) await new Promise((r) => setTimeout(r, 4));
  gl.deleteSync(sync);
}

/**
 * Links shader programs one at a time: renders a single representative mesh per distinct material
 * setup, yielding between renders, so program linking is spread over many short tasks instead of
 * one long first frame (KHR_parallel_shader_compile isn't available everywhere). With a software GPU the
 * real cost lands in the GPU process, so each step waits on a fence instead of blocking.
 */
async function warmUp(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const meshes: THREE.Mesh[] = [];
  scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });
  const groups = new Map<string, THREE.Mesh>();
  for (const m of meshes) {
    const mat = m.material as THREE.MeshStandardMaterial;
    const key = [mat.type, mat.flatShading, !!mat.map, mat.transparent, m.castShadow, !!(m as THREE.InstancedMesh).isInstancedMesh].join('|');
    if (!groups.has(key)) groups.set(key, m);
  }
  const gl = renderer.getContext();
  const visible = meshes.map((m) => m.visible);
  const culled = meshes.map((m) => m.frustumCulled);
  meshes.forEach((m) => (m.frustumCulled = false)); // the warm-up camera isn't placed yet; draw everything
  for (const rep of groups.values()) {
    meshes.forEach((m) => (m.visible = m === rep));
    renderer.render(scene, camera);
    await gpuIdle(gl);
  }
  meshes.forEach((m, i) => { m.visible = visible[i]; m.frustumCulled = culled[i]; });
  renderer.render(scene, camera); // full scene once, so the first visible frame finds everything uploaded
  await gpuIdle(gl);
}

/** Boots in stages that yield to the main thread so no single task blocks input for long. */
export async function start(host: HTMLElement, opts: StartOptions) {
  const narrow = innerWidth < 760;
  const reduced = opts.still != null || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parallax = !reduced && !narrow && matchMedia('(pointer: fine)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, failIfMajorPerformanceCaveat: false });
  if (!renderer.getContext()) throw new Error('WebGL unavailable');
  renderer.setPixelRatio(Math.min(devicePixelRatio, narrow ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // three r18x dropped PCFSoft and falls back to this anyway
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  const canvas = renderer.domElement;
  await yieldToMain();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  const lights = createLights(scene, narrow ? 1024 : 2048);
  await document.fonts?.load('800 40px "Inter Tight"').catch(() => {}); // the book spines are lettered in it
  const room = buildRoom({ neonScale: 0.3, books: opts.books });
  scene.add(room.group);
  await yieldToMain();
  // Website recordings play on the monitor, except with reduced motion or when saving data.
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const monitor = createMonitor(opts.projects, { cycle: !reduced, animate: !reduced, video: !reduced && !saveData });
  room.screen.material.map = monitor.texture;
  room.screen.material.needsUpdate = true;
  const onFocus = (e: Event) => { monitor.focus((e as CustomEvent<{ slug: string | null }>).detail.slug); dirty = true; };
  addEventListener('portfolio:project-focus', onFocus);
  const onSkill = (e: Event) => { room.focusBook((e as CustomEvent<{ name: string | null }>).detail.name); dirty = true; };
  addEventListener('portfolio:skill-focus', onSkill);

  let target = opts.still ?? 0;
  let current = target;
  let mouse = { x: 0, y: 0 }, smoothMouse = { x: 0, y: 0 };
  let dirty = true, raf = 0, last = performance.now(), lastIdle = 0, lastIndex = -1;
  let w = 0, h = 0;
  let stillFrames = 0, restores = 0, lost = false;
  const sampleFrame = createFrameSampler();

  const resize = () => {
    w = host.clientWidth; h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = innerWidth < 760 ? 44 : 35; // phones: the room is a small card, a slightly wider lens fits each subject
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
    const booksMoving = room.tickBooks(reduced ? 1 : dt);
    const settling = booksMoving || Math.abs(current - target) > 1e-4 || Math.abs(smoothMouse.x - mouse.x) + Math.abs(smoothMouse.y - mouse.y) > 1e-3;
    const s = sampleTimeline(current, undefined, { reducedMotion: reduced });
    const idle = !reduced && s.lighting.night > 0.5 && now - lastIdle > 1000 / 30;
    monitor.setActive(current > 0.6 && current < 2.75); // around the desk shots, where the screen is big
    monitor.setGame(current > 3.4); // after hours: one more game
    const monitorChanged = monitor.tick(now);
    if (!dirty && !settling && !idle && !monitorChanged) { host.dataset.settled = 'true'; return; }
    if (idle) lastIdle = now;
    dirty = false;
    host.dataset.settled = 'false';

    if (reduced && s.index !== lastIndex && lastIndex !== -1) {
      host.classList.remove('cut'); void host.offsetWidth; host.classList.add('cut');
    }
    lastIndex = s.index;

    camera.position.set(s.position[0] + smoothMouse.x * 0.25, s.position[1] + smoothMouse.y * 0.15, s.position[2]);
    camera.lookAt(s.lookAt[0], s.lookAt[1], s.lookAt[2]);
    const o = frameOffset(s.viewOffset, w, h, s.phoneShift);
    camera.zoom = w < 760 ? s.phoneZoom : 1;
    camera.setViewOffset(w, h, o.x, o.y, w, h);
    camera.updateProjectionMatrix();
    applyLighting(scene, lights, room, s.lighting, idle ? Math.sin(now / 180) * 0.5 + 0.5 : 0);
    room.setSteam(Math.min(1, Math.max(0, 1.8 - current)));
    room.setKeyboard(s.lighting.night);
    room.setSynth(s.lighting.night, reduced ? 0 : now);
    room.setSouls(Math.min(1, Math.max(0, (current - 3.4) / 0.4)), reduced ? 0 : now);
    renderer.render(scene, camera);
    if (opts.still != null) {
      if (++stillFrames === 2) host.dataset.stillReady = 'true';
      else if (stillFrames < 2) dirty = true; // render on demand would otherwise stop after frame 1
    }
    // Low-power check (spec §11): average of the first 60 animating frames, pauses excluded.
    if (settling || idle) {
      const avg = sampleFrame(now);
      if (avg != null) host.dataset.frameAvg = avg.toFixed(1);
      if (avg != null && avg > 1000 / 24) {
        renderer.shadowMap.enabled = false;
        lights.sun.castShadow = false;
        renderer.setPixelRatio(1);
        resize();
        host.dataset.lowPower = 'true';
      }
    }
    host.dataset.scene = 'ready';
  };
  // In the DOM (invisible) during warm-up so the canvas's first composite happens on a cheap frame.
  canvas.style.opacity = '0';
  host.prepend(canvas);
  monitor.tick(performance.now()); // upload the screen texture during warm-up too
  await warmUp(renderer, scene, camera);
  canvas.style.opacity = '';
  raf = requestAnimationFrame(frame);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    host.classList.add('fallback');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    if (restores++ > 0) return; // one restore only; a second loss stays in fallback
    lost = false;
    host.classList.remove('fallback');
    dirty = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  });

  const onVisibility = () => {
    if (document.hidden) { cancelAnimationFrame(raf); monitor.setActive(false); }
    else if (!lost) { last = performance.now(); dirty = true; raf = requestAnimationFrame(frame); }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    renderer, room, scene, lights,
    markDirty() { dirty = true; },
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener('portfolio:progress', onProgress);
      removeEventListener('portfolio:project-focus', onFocus);
      removeEventListener('portfolio:skill-focus', onSkill);
      monitor.setActive(false);
      removeEventListener('resize', resize);
      removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.dispose();
      canvas.remove();
    },
  };
}
