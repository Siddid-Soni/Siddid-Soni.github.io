import * as THREE from 'three';
import { drawCodeScreen } from './textures';
import { drawDeadlock, GAME_LAYERS, type GameLayers } from './deadlock';

export interface MonitorProject { slug: string; title: string; summary: string; stack: string[]; screenshot?: string; video?: string; accent: [string, string] }

const W = 1024, H = 640, FADE = 250, CYCLE = 6000, RESUME = 2500, GAME = '\u0000game';

// drawCodeScreen lays out for 512×384; scale it up to fill the screen canvas.
const codeScreen = (x: CanvasRenderingContext2D) => { x.save(); x.scale(W / 512, H / 384); drawCodeScreen(x, 512, 384); x.restore(); };

const defaultLoad = (src: string) => new Promise<CanvasImageSource>((res, rej) => {
  const img = new Image(); img.decoding = 'async';
  img.onload = () => res(img); img.onerror = () => rej(new Error(`failed: ${src}`)); img.src = src;
});

/**
 * The monitor's screen: the focused project's image, or, idle, the projects in turn, crossfaded. A focused project
 * holds the screen; once let go it stays a moment and the queue carries on from it. With `video`, a project that has
 * a recording plays it while the monitor is active (setActive), so website projects show the site running. setGame
 * swaps the projects for the after-hours game spinner.
 */
export function createMonitor(projects: MonitorProject[], opts: { cycle?: boolean; video?: boolean; animate?: boolean; load?: (src: string) => Promise<CanvasImageSource> } = {}) {
  const cycle = opts.cycle ?? true;
  const animate = opts.animate ?? true;
  const load = opts.load ?? defaultLoad;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const x = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const images = new Map<string, CanvasImageSource>();
  let started = false;
  let resolveReady!: () => void;
  const ready = new Promise<void>((r) => (resolveReady = r));

  let focused: string | null = null;
  let idx = 0, nextAt = -1, resume = false; // the idle queue: shown project and when it moves on
  let game = false, gameStart = 0, gameDrawn = 0;
  let scratch: CanvasRenderingContext2D | undefined;
  const layers: GameLayers = {};
  let layersRequested = false;
  const loadLayers = () => {
    layersRequested = true;
    for (const k of ['ring', 'wheel'] as const) load(GAME_LAYERS[k]).then((img) => { layers[k] = img; gameDrawn = -Infinity; }, () => {});
  };
  let shown: string | null | undefined = undefined; // undefined = nothing drawn yet
  let fadeStart = 0, fading = false;
  const videos = new Map<string, HTMLVideoElement>();
  let active = false, newFrame = false, lastTime = -1, rvfc = false;
  const playing = () => { const v = shown ? videos.get(shown) : undefined; return v && !v.paused && v.readyState >= 2 ? v : undefined; };
  /** Plays the shown project's recording (from the start each time it comes on) while active; pauses the rest. */
  const sync = (restart = false) => {
    for (const [slug, v] of videos) {
      const want = active && slug === shown;
      if (want && restart) v.currentTime = 0;
      if (want && v.paused) v.play().catch(() => {});
      else if (!want && !v.paused) v.pause();
    }
  };

  const drawCard = (p: MonitorProject) => {
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, p.accent[0]); g.addColorStop(1, p.accent[1]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = '#ffffff'; x.font = '800 72px "Inter Tight", sans-serif'; x.fillText(p.title, 64, H / 2);
    x.font = '600 28px "JetBrains Mono", monospace'; x.fillText(p.stack.join(' · '), 64, H / 2 + 60);
  };
  const drawGame = (now: number) => drawDeadlock(x, W, H, animate ? now - gameStart : 0, layers);
  const drawSlug = (slug: string | null, now: number) => {
    if (slug === GAME) {
      // The game sets its own alpha as it draws; render it aside so the crossfade still applies.
      if (!scratch) { const c = document.createElement('canvas'); c.width = W; c.height = H; scratch = c.getContext('2d')!; }
      drawDeadlock(scratch, W, H, animate ? now - gameStart : 0, layers);
      x.drawImage(scratch.canvas, 0, 0);
      return;
    }
    const p = slug ? projects.find((q) => q.slug === slug) : undefined;
    if (!p) { codeScreen(x); return; }
    const v = videos.get(p.slug), img = images.get(p.slug);
    if (v && v.readyState >= 2 && (active || !img)) x.drawImage(v, 0, 0, W, H);
    else if (img) x.drawImage(img, 0, 0, W, H); else drawCard(p);
  };

  const startLoading = () => {
    started = true;
    Promise.allSettled(projects.filter((p) => p.screenshot).map((p) =>
      load(p.screenshot!).then((img) => { images.set(p.slug, img); })
        .catch((e) => { if (import.meta.env?.DEV) console.warn('[monitor]', e); }),
    )).then(() => resolveReady());
    if (!opts.video) return;
    for (const p of projects.filter((q) => q.video)) {
      const v = document.createElement('video');
      Object.assign(v, { muted: true, loop: true, playsInline: true, preload: 'none', src: p.video }); // fetched on first play
      const onFrame = () => { newFrame = true; v.requestVideoFrameCallback(onFrame); };
      rvfc = 'requestVideoFrameCallback' in v;
      if (rvfc) v.requestVideoFrameCallback(onFrame);
      v.addEventListener('loadeddata', () => { newFrame = true; });
      videos.set(p.slug, v);
    }
    sync();
  };

  codeScreen(x);

  return {
    texture,
    ready,
    focus(slug: string | null) { if (focused && !slug) resume = true; focused = slug; },
    /** After hours: the screen loads into a game instead of showing projects. */
    setGame(on: boolean) { game = on; if (on && !layersRequested) loadLayers(); },
    /** The slug on screen (null: the code screen). */
    get shown() { return shown === GAME ? 'game' : shown ?? null; },
    /** Whether a recording may play: the monitor is in view and the page is visible. */
    setActive(on: boolean) { if (on !== active) { active = on; sync(); } },
    /** Returns true when the texture changed this tick. */
    tick(now: number): boolean {
      if (!started) startLoading();
      if (focused) {
        idx = Math.max(0, projects.findIndex((p) => p.slug === focused));
        nextAt = -1;
      } else if (cycle && projects.length) {
        if (resume) nextAt = now + RESUME; // let go: stay on it a moment, then carry on from there
        else if (nextAt < 0) nextAt = now + CYCLE;
        else if (now >= nextAt) { idx = (idx + 1) % projects.length; nextAt = now + CYCLE; }
      }
      resume = false;
      const want = game ? GAME : focused ?? (cycle ? projects[idx]?.slug ?? null : null);
      if (want !== shown && !fading) {
        if (want === GAME) gameStart = now;
        shown = want; fading = true; fadeStart = now; sync(true);
      }
      if (!fading && shown === GAME) {
        if ((!animate && gameDrawn > -Infinity) || now - gameDrawn < 33) return false; // ~30 fps is plenty for a spinner
        gameDrawn = now;
        drawGame(now);
        texture.needsUpdate = true;
        return true;
      }
      if (!fading) {
        // A playing recording: copy each new video frame onto the screen.
        const v = playing();
        const fresh = v && (newFrame || (!rvfc && v.currentTime !== lastTime));
        if (!v || !fresh) return false;
        newFrame = false; lastTime = v.currentTime;
        x.drawImage(v, 0, 0, W, H);
        texture.needsUpdate = true;
        return true;
      }
      const t = animate ? Math.min(1, (now - fadeStart) / FADE) : 1;
      x.globalAlpha = t;
      drawSlug(shown ?? null, now);
      x.globalAlpha = 1;
      if (t >= 1) fading = false;
      texture.needsUpdate = true;
      return true;
    },
  };
}
