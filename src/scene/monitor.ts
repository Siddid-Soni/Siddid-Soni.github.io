import * as THREE from 'three';
import { drawCodeScreen } from './textures';

export interface MonitorProject { slug: string; title: string; summary: string; stack: string[]; screenshot?: string; accent: [string, string] }

const W = 1024, H = 640, FADE = 250;

// drawCodeScreen lays out for 512×384; scale it up to fill the screen canvas.
const codeScreen = (x: CanvasRenderingContext2D) => { x.save(); x.scale(W / 512, H / 384); drawCodeScreen(x, 512, 384); x.restore(); };

export const cycleIndex = (timeMs: number, count: number, periodMs = 4000) =>
  count === 0 ? -1 : Math.floor(timeMs / periodMs) % count;

const defaultLoad = (src: string) => new Promise<CanvasImageSource>((res, rej) => {
  const img = new Image(); img.decoding = 'async';
  img.onload = () => res(img); img.onerror = () => rej(new Error(`failed: ${src}`)); img.src = src;
});

export function createMonitor(projects: MonitorProject[], opts: { cycle?: boolean; load?: (src: string) => Promise<CanvasImageSource> } = {}) {
  const cycle = opts.cycle ?? true;
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
  let shown: string | null | undefined = undefined; // undefined = nothing drawn yet
  let fadeStart = 0, fading = false;

  const drawCard = (p: MonitorProject) => {
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, p.accent[0]); g.addColorStop(1, p.accent[1]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = '#ffffff'; x.font = '800 72px "Inter Tight", sans-serif'; x.fillText(p.title, 64, H / 2);
    x.font = '600 28px "JetBrains Mono", monospace'; x.fillText(p.stack.join(' · '), 64, H / 2 + 60);
  };
  const drawSlug = (slug: string | null) => {
    const p = slug ? projects.find((q) => q.slug === slug) : undefined;
    if (!p) { codeScreen(x); return; }
    const img = images.get(p.slug);
    if (img) x.drawImage(img, 0, 0, W, H); else drawCard(p);
  };

  const startLoading = () => {
    started = true;
    Promise.allSettled(projects.filter((p) => p.screenshot).map((p) =>
      load(p.screenshot!).then((img) => { images.set(p.slug, img); })
        .catch((e) => { if (import.meta.env?.DEV) console.warn('[monitor]', e); }),
    )).then(() => resolveReady());
  };

  codeScreen(x);

  return {
    texture,
    ready,
    focus(slug: string | null) { focused = slug; },
    /** Returns true when the texture changed this tick. */
    tick(now: number): boolean {
      if (!started) startLoading();
      const want = focused ?? (cycle ? projects[cycleIndex(now, projects.length)]?.slug ?? null : null);
      if (want !== shown && !fading) { shown = want; fading = true; fadeStart = now; }
      if (!fading) return false;
      const t = Math.min(1, (now - fadeStart) / FADE);
      x.globalAlpha = t;
      drawSlug(shown ?? null);
      x.globalAlpha = 1;
      if (t >= 1) fading = false;
      texture.needsUpdate = true;
      return true;
    },
  };
}
