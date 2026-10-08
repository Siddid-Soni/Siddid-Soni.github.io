import { KEYFRAMES, type Keyframe, type Lighting, type Vec3 } from './keyframes';

export interface TimelineState {
  position: Vec3; lookAt: Vec3; viewOffset: number; lighting: Lighting;
  clockMinutes: number; theme: 'day' | 'night'; index: number;
}

export const smoothstep = (t: number) => t * t * (3 - 2 * t);
// a*(1-t) + b*t is exact at t=0 and t=1 (tests compare keyframes with toEqual).
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export function lerpHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, t));
  return '#' + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0');
}

function lerpLighting(a: Lighting, b: Lighting, t: number): Lighting {
  return {
    background: lerpHex(a.background, b.background, t), sky: lerpHex(a.sky, b.sky, t),
    hemiSky: lerpHex(a.hemiSky, b.hemiSky, t), hemiGround: lerpHex(a.hemiGround, b.hemiGround, t),
    hemiIntensity: lerp(a.hemiIntensity, b.hemiIntensity, t), sunColor: lerpHex(a.sunColor, b.sunColor, t),
    sunIntensity: lerp(a.sunIntensity, b.sunIntensity, t), lamp: lerp(a.lamp, b.lamp, t), night: lerp(a.night, b.night, t),
  };
}

export function sampleTimeline(f: number, kfs: Keyframe[] = KEYFRAMES, opts: { reducedMotion?: boolean } = {}): TimelineState {
  const n = kfs.length - 1;
  let x = Number.isFinite(f) ? Math.min(n, Math.max(0, f)) : 0;
  if (opts.reducedMotion) x = Math.round(x);
  const i = Math.min(n - 1, Math.floor(x));
  const t = smoothstep(x - i);
  const A = kfs[i], B = kfs[i + 1];
  return {
    position: lerp3(A.position, B.position, t),
    lookAt: lerp3(A.lookAt, B.lookAt, t),
    viewOffset: lerp(A.viewOffset, B.viewOffset, t),
    lighting: lerpLighting(A.lighting, B.lighting, t),
    clockMinutes: Math.round(lerp(A.minutes, B.minutes, t)) % 1440,
    theme: x > 2.5 ? 'night' : 'day',
    index: Math.round(x),
  };
}

export const damp = (current: number, target: number, dt: number, rate = 8) =>
  current + (target - current) * (1 - Math.exp(-rate * dt));

export function progressFromSections(scrollY: number, tops: number[], maxScroll: number): number {
  const n = tops.length - 1;
  if (maxScroll <= 0 || scrollY <= 0) return 0;
  if (scrollY >= maxScroll) return n;
  // Section tops past maxScroll are unreachable: squash them into [last reachable top, maxScroll].
  const eff = tops.map((t) => Math.min(t, maxScroll));
  for (let i = n - 1; i >= 0; i--) {
    if (scrollY >= eff[i]) {
      const span = eff[i + 1] - eff[i];
      return span > 0 ? i + Math.min(1, (scrollY - eff[i]) / span) : i + 1;
    }
  }
  return 0;
}

export function formatClock(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const icon = m >= 1140 || m < 360 ? '☾' : '☀';
  return `${icon} ${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function frameOffset(viewOffset: number, width: number, height: number) {
  if (width < 760) return { x: -viewOffset * 0.3 * width, y: 0.22 * height };
  if (width < 1024) return { x: -viewOffset * 0.6 * width, y: 0 };
  return { x: -viewOffset * width, y: 0 };
}

/**
 * Averages the intervals between consecutive animating frames for the low-power check. Gaps longer
 * than maxGapMs (the visitor paused, render-on-demand went idle) are not intervals and are skipped.
 * Returns the average once `count` intervals are collected (once only), otherwise null.
 */
export function createFrameSampler(count = 59, maxGapMs = 250) {
  let prev = -1, sum = 0, n = 0, done = false;
  return (now: number): number | null => {
    if (done) return null;
    if (prev >= 0 && now - prev <= maxGapMs) { sum += now - prev; n++; }
    prev = now;
    if (n < count) return null;
    done = true;
    return sum / n;
  };
}
