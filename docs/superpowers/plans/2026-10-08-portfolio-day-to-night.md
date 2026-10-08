# Portfolio "Day → Night" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single-page "Day → Night" developer portfolio, where scrolling plays one day in a low-poly 3D room, plus project detail pages. The site is built as static files and deployed to GitHub Pages at `siddid.me`.

**Architecture:** Astro (static output) renders all content as semantic HTML. A small page script (`src/scripts/page.ts`, no Three.js) turns the scroll position into a keyframe position `f ∈ [0,5]`. It drives the clock, theme and scrubber, and broadcasts `portfolio:progress` events. The Three.js scene (`src/scene/*`) is lazily imported after first paint. It listens for those events and renders the room on demand. All interpolation maths lives in the pure module `src/scene/timeline.ts`, which is unit tested.

**Tech Stack:** Node ≥ 22.12 (local: 26), Astro 7.3.x, TypeScript, three 0.186.x, Vitest 5, Playwright 1.64 with @axe-core/playwright, @lhci/cli, sharp, @fontsource fonts, and GitHub Actions → GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-08-portfolio-day-to-night-design.md` (visual reference: `…-prototype.html`, tab **O**).

## Global Constraints

- The repo root is `/home/siddid/Work/portfolio`, which is a clone of `Siddid-Soni/Siddid-Soni.github.io` (branch `main`). The Astro project lives at the repo root.
- The deployment target is **GitHub Pages via GitHub Actions**, with the custom domain `siddid.me` (`public/CNAME`). This replaces Vercel from spec §13. `astro.config.mjs` sets `site: 'https://siddid.me'` and `trailingSlash: 'always'`, with no `base`.
- Every key fact (name, role, projects, skills, contact) is real HTML text, readable with WebGL disabled.
- Lighthouse (mobile): Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95.
- First text appears before the 3D scene loads (LCP < 2.5 s on 4G).
- Home page JS ≤ 200 KB gzipped. Fonts ≤ 80 KB total. Home page screenshots ≤ 150 KB each (WebP).
- Fonts: Inter Tight 800 for headings, Inter **400 only** for body, JetBrains Mono 600 for kickers, clock and scrubber. All are latin subsets with `font-display: swap`. *Deviation:* the spec also asks for Inter 500, but the four files measure 92 KB, which is over the 80 KB budget, so 500 is dropped (bold emphasis uses Inter Tight).
- Heading size: `clamp(32px, 4.4vw, 64px)`.
- Palette tokens (day → night): background `#f3e6d6`/`#e3eef8` → `#3a1f3d`/`#07051a`, text `#1d1610` → `#ffffff`, accent `#6b5cff` → neon gradient `#ff6ad5 → #ffd36a → #6affc8`.
- Theme is `night` when `f > 2.5`, otherwise `day`. It is set as `data-theme` on `<html>`.
- Damping: `k = 1 − e^(−8·dt)`. Parallax: ±0.25 (x) / ±0.15 (y), desktop with a fine pointer only.
- Renderer: `antialias: true`, pixel ratio `min(dpr, 2)` (1.5 when `width < 760`), PCF soft shadows, shadow map 2048 (1024 when `width < 760`), `shadow.bias = −0.0008`, neon point lights scaled 0.3×.
- Low power: if the first 60 frames average under 24 fps, disable shadows and set pixel ratio 1.
- Reduced motion: the camera cuts between keyframes with a 300 ms cross-fade, parallax is off, idle animations (neon shimmer, monitor cycling) stop, and smooth scroll is off.
- Events: `portfolio:progress` `{ f: number }`, `portfolio:project-focus` `{ slug: string | null }`, `portfolio:theme` `{ theme: 'day' | 'night' }`. All are dispatched on `window`.
- *Deviation from spec §6:* the theme and clock are computed by `page.ts` (from `timeline.ts`) instead of by `main.ts`. This keeps them working when WebGL is unavailable. The scene still never reads page layout.
- Site copy in `src/config.ts` and `src/content/projects/*.md` is **example content** taken from the prototype, which the owner replaces (spec §15). The name is "Siddid Soni".
- Commit after every task with a conventional-commit message. Do not push until Task 12.

## Review Focus

1. **Sections of unequal height.** Real copy makes sections taller or shorter than 100 vh. The camera and lighting must still line up with the section being read, so `f` is computed from section offsets and not from `scrollY / maxScroll`. Pinned by the `progressFromSections` tests in Task 2.
2. **Pages that can't scroll to the last section top.** When the Contact section is shorter than the viewport, `scrollY` never reaches its top. `f` must still reach exactly 5 at the bottom of the page. Pinned in Task 2 (`clamps to 5 at max scroll`).
3. **Project without a screenshot / screenshot 404.** The monitor must draw a generated title card and never throw. Pinned in Task 8 (`monitor falls back when the image fails`).
4. **WebGL disabled or context lost.** Text, nav, scrubber, clock and theme must all still work, and fallback stills must show. Pinned in Task 9 (E2E with `getContext` stubbed to `null`, and a forced `WEBGL_lose_context`).
5. **Keyboard-only use in night theme.** The focus ring must be visible on dark backgrounds, and focusing a card must swap the monitor. Pinned in Task 4 (axe at night, focus ring check) and Task 7 (focus event).

---

## File Map

```
astro.config.mjs               Astro config (site, trailingSlash)
package.json / tsconfig.json   scripts + deps
vitest.config.ts               unit test config (tests/unit)
playwright.config.ts           e2e config (preview server)
lighthouserc.json              Lighthouse CI thresholds
.github/workflows/deploy.yml   build → test → lhci → Pages deploy
public/CNAME                   siddid.me (moved from repo root)
public/resume.pdf              placeholder résumé (owner replaces)
public/fallback/{0..5}.webp    pre-rendered stills (Task 10 script)
public/og.png                  Open Graph image (Task 10 script)
public/projects/*.webp         optional screenshots (owner adds)
scripts/render-stills.mjs      renders fallback stills + og.png via Playwright + sharp
scripts/check-budget.mjs       gzipped JS + font budget check on dist/
src/config.ts                  site copy + SECTIONS list
src/content.config.ts          projects collection schema
src/content/projects/*.md      projects
src/layouts/Base.astro         <html>, fonts, meta, global.css
src/styles/global.css          tokens, themes, layout, responsive
src/components/Section.astro   kicker + heading + slot, align left/right/center
src/components/ProjectCard.astro
src/components/TimeScrubber.astro
src/components/Clock.astro
src/components/RoomCanvas.astro  canvas host + fallback stills + lazy scene boot
src/pages/index.astro
src/pages/projects/[slug].astro
src/scripts/page.ts            scroll → f, clock, theme, scrubber, project-focus events, fallback fades
src/scene/keyframes.ts         KEYFRAMES data (spec §7)
src/scene/timeline.ts          pure maths
src/scene/textures.ts          canvas textures (synthwave window, poster, code screen)
src/scene/room.ts              buildRoom()
src/scene/lighting.ts          createLights(), applyLighting()
src/scene/monitor.ts           monitor texture + project swapping
src/scene/main.ts              start(): renderer, loop, events, fallbacks
tests/unit/*.test.ts           Vitest
tests/e2e/*.spec.ts            Playwright
```

---

### Task 1: Scaffold Astro, tooling and the deploy pipeline

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `src/pages/index.astro` (temporary), `tests/unit/smoke.test.ts`, `tests/e2e/smoke.spec.ts`, `.github/workflows/deploy.yml`, `public/CNAME`
- Modify: `.gitignore`
- Delete: `CNAME` (repo root; it moves to `public/`)

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `test` (vitest run), `test:e2e` (playwright), `budget`, `stills`. The preview server runs at `http://localhost:4321`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "siddid-portfolio",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview --port 4321",
    "test": "vitest run",
    "test:e2e": "playwright test --grep-invert @visual",
    "test:visual": "playwright test --grep @visual",
    "budget": "node scripts/check-budget.mjs",
    "stills": "node scripts/render-stills.mjs"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm i astro@7.3.7 three@0.186.1 @fontsource/inter@5.3.0 @fontsource/inter-tight@5.3.0 @fontsource/jetbrains-mono@5.3.0
npm i -D typescript @types/three@0.186.0 vitest@5.0.3 @playwright/test@1.64.0 @axe-core/playwright@4.13.0 @lhci/cli@0.15.1 sharp
npx playwright install chromium
```
Expected: installs without errors.

- [ ] **Step 3: Write the config files**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://siddid.me',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "docs", ".superpowers"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
```

Append to `.gitignore` (keep the existing `.superpowers/` line):
```
node_modules/
dist/
.astro/
test-results/
playwright-report/
.lighthouseci/
```

Move the CNAME: `git mv CNAME public/CNAME` (it contains `siddid.me`).

- [ ] **Step 4: Write the failing smoke tests**

`tests/unit/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('scaffold', () => {
  it('ships the custom domain', () => {
    expect(readFileSync('public/CNAME', 'utf8').trim()).toBe('siddid.me');
  });
});
```

`tests/e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('home page responds', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

- [ ] **Step 5: Run the tests to verify that e2e fails**

Run: `npm test && npm run test:e2e`
Expected: the unit test PASSES. E2E FAILS because the build has no pages (`astro build` errors or there is no `h1`).

- [ ] **Step 6: Add a temporary home page**

`src/pages/index.astro`:
```astro
---
---
<html lang="en"><head><meta charset="utf-8" /><title>Siddid Soni</title></head>
<body><h1>Siddid Soni</h1></body></html>
```

- [ ] **Step 7: Write the deploy workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm test
      - run: npm run build
      - run: npm run test:e2e
        env: { CI: 'true' }
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.d.outputs.page_url }}' }
    steps:
      - id: d
        uses: actions/deploy-pages@v4
```
(Tasks 11 adds `budget` and `lhci` steps.)

- [ ] **Step 8: Run all tests and verify that they pass**

Run: `npm test && npm run test:e2e`
Expected: PASS. Both projects pass `home page responds`. `ls dist` shows `CNAME index.html`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro site, tests and Pages deploy workflow"
```

---

### Task 2: Pure timeline maths and keyframe data

**Files:**
- Create: `src/scene/keyframes.ts`, `src/scene/timeline.ts`
- Test: `tests/unit/timeline.test.ts`

**Interfaces:**
- Produces (`keyframes.ts`):
  ```ts
  export type Vec3 = [number, number, number];
  export interface Lighting { background: string; sky: string; hemiSky: string; hemiGround: string;
    hemiIntensity: number; sunColor: string; sunIntensity: number; lamp: number; night: number }
  export interface Keyframe { position: Vec3; lookAt: Vec3; viewOffset: number; lighting: Lighting; minutes: number }
  export const KEYFRAMES: Keyframe[]  // length 6
  ```
- Produces (`timeline.ts`):
  ```ts
  export interface TimelineState { position: Vec3; lookAt: Vec3; viewOffset: number; lighting: Lighting;
    clockMinutes: number; theme: 'day' | 'night'; index: number }
  export function smoothstep(t: number): number
  export function lerpHex(a: string, b: string, t: number): string            // '#rrggbb'
  export function sampleTimeline(f: number, kfs?: Keyframe[], opts?: { reducedMotion?: boolean }): TimelineState
  export function damp(current: number, target: number, dt: number, rate?: number): number  // rate default 8
  export function progressFromSections(scrollY: number, tops: number[], maxScroll: number): number  // f ∈ [0, tops.length-1]
  export function formatClock(minutes: number): string                        // '☀ 07:30' | '☾ 23:00'
  export function frameOffset(viewOffset: number, width: number, height: number): { x: number; y: number } // px for setViewOffset
  ```

- [ ] **Step 1: Write the keyframe data** (copied from spec §7)

`src/scene/keyframes.ts`:
```ts
export type Vec3 = [number, number, number];

export interface Lighting {
  background: string; sky: string; hemiSky: string; hemiGround: string;
  hemiIntensity: number; sunColor: string; sunIntensity: number; lamp: number; night: number;
}

export interface Keyframe { position: Vec3; lookAt: Vec3; viewOffset: number; lighting: Lighting; minutes: number }

const L = (background: string, sky: string, hemiSky: string, hemiGround: string, hemiIntensity: number,
  sunColor: string, sunIntensity: number, lamp: number, night: number): Lighting =>
  ({ background, sky, hemiSky, hemiGround, hemiIntensity, sunColor, sunIntensity, lamp, night });

export const KEYFRAMES: Keyframe[] = [
  { position: [12, 9.5, 12],     lookAt: [-0.5, 1.3, -0.5], viewOffset: 0.2,  minutes: 450,
    lighting: L('#f3e6d6', '#ffd9a8', '#fff1de', '#c9a27a', 0.8,  '#ffd2a1', 0.9,  0,   0) },
  { position: [1.4, 2.35, -1.6], lookAt: [0.1, 1.75, -2.8], viewOffset: -0.2, minutes: 540,
    lighting: L('#f6ecdf', '#bfe3ff', '#ffffff', '#c9b8a0', 0.85, '#fff1dc', 1.0,  0,   0) },
  { position: [-1.15, 2.7, 0.1], lookAt: [-1.4, 2.35, -3.5], viewOffset: 0.2, minutes: 780,
    lighting: L('#e3eef8', '#8fd0ff', '#ffffff', '#b8c4d0', 0.95, '#ffffff', 1.05, 0,   0) },
  { position: [-0.6, 2.3, 1.9],  lookAt: [-3.6, 1.9, 0.5],  viewOffset: -0.2, minutes: 1110,
    lighting: L('#3a1f3d', '#ff9a5a', '#ffb37a', '#5a2a3a', 0.6,  '#ff8a4c', 1.0,  0.6, 0.15) },
  { position: [3.1, 2.5, 1.4],   lookAt: [1.3, 3, -4],      viewOffset: 0.22, minutes: 1380,
    lighting: L('#0c0820', '#1a0533', '#5a48b0', '#120a24', 0.3,  '#6a5cff', 0.2,  0.5, 1) },
  { position: [11, 8.2, 11],     lookAt: [-0.5, 2, -0.5],   viewOffset: 0,    minutes: 1440,
    lighting: L('#07051a', '#1a0533', '#4a3a9a', '#0a0618', 0.26, '#6a5cff', 0.18, 0.5, 1) },
];
```

- [ ] **Step 2: Write the failing tests**

`tests/unit/timeline.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { KEYFRAMES } from '../../src/scene/keyframes';
import {
  smoothstep, lerpHex, sampleTimeline, damp, progressFromSections, formatClock, frameOffset,
} from '../../src/scene/timeline';

describe('smoothstep / lerpHex', () => {
  it('smoothstep hits 0, 0.5, 1', () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(0.5)).toBe(0.5);
    expect(smoothstep(1)).toBe(1);
  });
  it('lerpHex interpolates channels', () => {
    expect(lerpHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(lerpHex('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(lerpHex('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});

describe('sampleTimeline', () => {
  it('returns keyframe 0 at f=0 and keyframe 5 at f=5', () => {
    expect(sampleTimeline(0).position).toEqual(KEYFRAMES[0].position);
    expect(sampleTimeline(5).position).toEqual(KEYFRAMES[5].position);
    expect(sampleTimeline(5).lighting.background).toBe('#07051a');
  });
  it('returns exact values at every integer keyframe', () => {
    KEYFRAMES.forEach((k, i) => {
      const s = sampleTimeline(i);
      expect(s.position).toEqual(k.position);
      expect(s.lookAt).toEqual(k.lookAt);
      expect(s.viewOffset).toBeCloseTo(k.viewOffset);
      expect(s.lighting.night).toBeCloseTo(k.lighting.night);
      expect(s.index).toBe(i);
    });
  });
  it('is the smoothstep midpoint between keyframes', () => {
    const s = sampleTimeline(0.5);
    expect(s.position[0]).toBeCloseTo((12 + 1.4) / 2);
    expect(s.viewOffset).toBeCloseTo(0);
  });
  it('clamps out-of-range input', () => {
    expect(sampleTimeline(-3).position).toEqual(KEYFRAMES[0].position);
    expect(sampleTimeline(99).position).toEqual(KEYFRAMES[5].position);
    expect(sampleTimeline(Number.NaN).position).toEqual(KEYFRAMES[0].position);
  });
  it('switches theme just after 2.5', () => {
    expect(sampleTimeline(2.5).theme).toBe('day');
    expect(sampleTimeline(2.51).theme).toBe('night');
  });
  it('interpolates clock minutes and wraps midnight to 0', () => {
    expect(sampleTimeline(0).clockMinutes).toBe(450);
    expect(sampleTimeline(1.5).clockMinutes).toBe(660); // smoothstep(.5)=.5 → 540..780
    expect(sampleTimeline(5).clockMinutes).toBe(0);
  });
  it('reduced motion snaps to the nearest keyframe', () => {
    expect(sampleTimeline(1.4, KEYFRAMES, { reducedMotion: true }).position).toEqual(KEYFRAMES[1].position);
    expect(sampleTimeline(1.6, KEYFRAMES, { reducedMotion: true }).position).toEqual(KEYFRAMES[2].position);
    expect(sampleTimeline(1.6, KEYFRAMES, { reducedMotion: true }).index).toBe(2);
  });
});

describe('damp', () => {
  it('moves toward target frame-rate independently', () => {
    const one = damp(0, 1, 1 / 30);
    const two = damp(damp(0, 1, 1 / 60), 1, 1 / 60);
    expect(one).toBeCloseTo(two, 10);
    expect(one).toBeCloseTo(1 - Math.exp(-8 / 30));
  });
  it('dt=0 keeps current; huge dt reaches target', () => {
    expect(damp(0.3, 1, 0)).toBe(0.3);
    expect(damp(0.3, 1, 100)).toBeCloseTo(1);
  });
});

describe('progressFromSections', () => {
  const tops = [0, 900, 2200, 3000, 3900, 4800];
  it('is the section index at each section top', () => {
    tops.slice(0, 5).forEach((t, i) => expect(progressFromSections(t, tops, 5000)).toBeCloseTo(i));
  });
  it('is linear inside an unequal section', () => {
    expect(progressFromSections(1550, tops, 5000)).toBeCloseTo(1.5);
  });
  it('clamps to 5 at max scroll when the last top is unreachable', () => {
    expect(progressFromSections(4500, tops, 4500)).toBe(5);
    expect(progressFromSections(4100, tops, 4500)).toBeGreaterThan(4);
    expect(progressFromSections(4100, tops, 4500)).toBeLessThan(5);
  });
  it('clamps negatives and handles zero max scroll', () => {
    expect(progressFromSections(-50, tops, 5000)).toBe(0);
    expect(progressFromSections(0, tops, 0)).toBe(0);
  });
});

describe('formatClock', () => {
  it('uses sun by day and moon at night', () => {
    expect(formatClock(450)).toBe('☀ 07:30');
    expect(formatClock(1110)).toBe('☀ 18:30');
    expect(formatClock(1140)).toBe('☾ 19:00');
    expect(formatClock(0)).toBe('☾ 00:00');
  });
});

describe('frameOffset', () => {
  it('desktop: full horizontal shift, no vertical', () => {
    const o = frameOffset(0.2, 1440, 900);
    expect(o.x).toBeCloseTo(-288);
    expect(o.y).toBe(0);
  });
  it('tablet: 60% shift', () => {
    expect(frameOffset(0.2, 900, 900).x).toBeCloseTo(-108);
  });
  it('phone: 30% shift and subject in top half', () => {
    const o = frameOffset(0.2, 390, 844);
    expect(o.x).toBeCloseTo(-23.4);
    expect(o.y).toBeCloseTo(0.22 * 844);
  });
});
```

- [ ] **Step 3: Run the tests to verify that they fail**

Run: `npx vitest run tests/unit/timeline.test.ts`
Expected: FAIL with "Failed to resolve import ../../src/scene/timeline".

- [ ] **Step 4: Implement `timeline.ts`**

`src/scene/timeline.ts`:
```ts
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
```

- [ ] **Step 5: Run the tests to verify that they pass**

Run: `npx vitest run tests/unit/timeline.test.ts`
Expected: all PASS. If the `progressFromSections` "unreachable" case fails, check the tops-squashing loop. Don't loosen the test.

- [ ] **Step 6: Commit**

```bash
git add src/scene tests/unit/timeline.test.ts
git commit -m "feat(scene): pure timeline maths and keyframe data"
```

---

### Task 3: Content model, base layout, fonts and theme CSS

**Files:**
- Create: `src/config.ts`, `src/content.config.ts`, `src/content/projects/{realtime-chat,ai-notes,dev-dashboard,cli-toolkit}.md`, `src/layouts/Base.astro`, `src/styles/global.css`, `public/resume.pdf`
- Test: `tests/unit/content.test.ts`

**Interfaces:**
- Produces (`config.ts`):
  ```ts
  export const SITE: { name: string; role: string; tagline: string; about: string; location: string;
    email: string; github: string; linkedin: string; resume: string;
    skills: { area: 'Frontend' | 'Backend' | 'Infra'; items: string[] }[];
    afterHours: { title: string; text: string; href?: string }[] }
  export interface SectionDef { id: string; time: string; label: string; heading: string; align: 'left' | 'right' | 'center' }
  export const SECTIONS: SectionDef[]  // 6 entries, ids: hero, about, projects, skills, after-hours, contact
  ```
- Produces: the `projects` collection, entries `{ id: slug, data: { title, summary, stack: string[], screenshot?: string, accent: [string,string], links: { live?: string; repo?: string }, featured: boolean, order: number } }`.
- Produces: `<Base title description>` layout with a default slot. CSS classes and tokens used later: `--bg`, `--fg`, `--muted`, `--accent`, `--glass`, `--glass-border`, `--focus`, `.kicker`, `.neon` (gradient text at night), `[data-theme="night"]`.

- [ ] **Step 1: Write the failing test**

`tests/unit/content.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { SITE, SECTIONS } from '../../src/config';

describe('content', () => {
  it('has six sections in storyboard order', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(['hero', 'about', 'projects', 'skills', 'after-hours', 'contact']);
    expect(SECTIONS.map((s) => s.time)).toEqual(['07:30', '09:00', '13:00', '18:30', '23:00', '00:00']);
  });
  it('has 6–10 skills grouped by area', () => {
    const n = SITE.skills.flatMap((g) => g.items).length;
    expect(n).toBeGreaterThanOrEqual(6);
    expect(n).toBeLessThanOrEqual(10);
  });
  it('features at most 4 projects', () => {
    const featured = readdirSync('src/content/projects')
      .map((f) => readFileSync(`src/content/projects/${f}`, 'utf8'))
      .filter((s) => /^featured:\s*true/m.test(s));
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.length).toBeLessThanOrEqual(4);
  });
});
```

- [ ] **Step 2: Run the test to verify that it fails**

Run: `npx vitest run tests/unit/content.test.ts`
Expected: FAIL, "Failed to resolve import ../../src/config".

- [ ] **Step 3: Write `src/config.ts`**

```ts
// Example content: replace with your own (spec §15).
export const SITE = {
  name: 'Siddid Soni',
  role: 'Software Engineer',
  tagline: 'I build fast, friendly software for the web.',
  about:
    'I’m a software engineer who likes turning fuzzy problems into small, reliable systems. I work across the stack, from interfaces people enjoy to the services behind them.',
  location: 'India · open to remote',
  email: 'hello@siddid.me', // replace with the address you want public
  github: 'https://github.com/Siddid-Soni',
  linkedin: 'https://www.linkedin.com/in/',
  resume: '/resume.pdf',
  skills: [
    { area: 'Frontend', items: ['TypeScript', 'React', 'Astro', 'Three.js'] },
    { area: 'Backend', items: ['Node.js', 'Go', 'PostgreSQL'] },
    { area: 'Infra', items: ['Docker', 'GitHub Actions', 'Linux'] },
  ],
  afterHours: [
    { title: 'Open source', text: 'Small fixes and docs PRs to tools I use every day.' },
    { title: 'Experiments', text: 'Shaders, tiny games and CLI tools built on weekends.' },
    { title: 'This site', text: 'Built with Astro and Three.js. One day in my room.', href: 'https://github.com/Siddid-Soni/Siddid-Soni.github.io' },
  ],
} as const satisfies {
  name: string; role: string; tagline: string; about: string; location: string; email: string;
  github: string; linkedin: string; resume: string;
  skills: readonly { area: 'Frontend' | 'Backend' | 'Infra'; items: readonly string[] }[];
  afterHours: readonly { title: string; text: string; href?: string }[];
};

export interface SectionDef { id: string; time: string; label: string; heading: string; align: 'left' | 'right' | 'center' }

export const SECTIONS: SectionDef[] = [
  { id: 'hero', time: '07:30', label: 'Morning', heading: `Hi, I’m ${SITE.name}.`, align: 'left' },
  { id: 'about', time: '09:00', label: 'Coffee', heading: 'About me', align: 'right' },
  { id: 'projects', time: '13:00', label: 'Work', heading: 'Things I’ve built', align: 'left' },
  { id: 'skills', time: '18:30', label: 'Golden hour', heading: 'What I work with', align: 'right' },
  { id: 'after-hours', time: '23:00', label: 'After hours', heading: 'After hours', align: 'left' },
  { id: 'contact', time: '00:00', label: 'Midnight', heading: 'Let’s build something together.', align: 'center' },
];
```

- [ ] **Step 4: Write the collection schema and the four projects**

`src/content.config.ts`:
```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    stack: z.array(z.string()).min(1),
    screenshot: z.string().optional(),
    accent: z.tuple([hex, hex]).default(['#6b5cff', '#ff6ad5']),
    links: z.object({ live: z.string().url().optional(), repo: z.string().url().optional() }).default({}),
    featured: z.boolean().default(false),
    order: z.number().default(99),
  }),
});

export const collections = { projects };
```

`src/content/projects/realtime-chat.md`:
```md
---
title: Realtime Chat
summary: WebSockets + Redis chat for 10k daily users, p99 latency 40ms
stack: [TypeScript, Node, Redis, WebSockets]
accent: ['#ff6a88', '#ff99ac']
links: { repo: https://github.com/Siddid-Soni }
featured: true
order: 1
---
## Problem
Example case study. Replace with your own.

## Approach
Socket gateway in Node, Redis pub/sub fan-out, presence in sorted sets.

## Result
10k daily users, p99 message latency 40 ms.

## What I'd do next
Move history to Postgres with partitioning.
```

`src/content/projects/ai-notes.md`:
```md
---
title: AI Notes
summary: Notes that summarise and link themselves
stack: [Next.js, Claude API, Postgres]
accent: ['#8a5cff', '#c79bff']
featured: true
order: 2
---
## Problem
Example case study. Replace with your own.
```

`src/content/projects/dev-dashboard.md`:
```md
---
title: Dev Dashboard
summary: Live metrics for 40 microservices
stack: [React, D3, Go]
accent: ['#22c1c3', '#7af7d5']
featured: true
order: 3
---
## Problem
Example case study. Replace with your own.
```

`src/content/projects/cli-toolkit.md`:
```md
---
title: CLI Toolkit
summary: A fast Rust CLI for everyday dev chores, 2k ★ on GitHub
stack: [Rust]
accent: ['#f7971e', '#ffd200']
featured: true
order: 4
---
## Problem
Example case study. Replace with your own.
```

`public/resume.pdf`: create a placeholder with `printf '%%PDF-1.4\n%% placeholder resume, replace me\n' > public/resume.pdf`.

- [ ] **Step 5: Write `src/styles/global.css`**

```css
:root {
  --bg: #f3e6d6; --fg: #1d1610; --muted: #5b4a3a; --accent: #6b5cff;
  --glass: rgb(255 255 255 / 0.55); --glass-border: rgb(29 22 16 / 0.12);
  --focus: #6b5cff;
  --font-head: 'Inter Tight', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  color-scheme: light;
}
[data-theme='night'] {
  --bg: #07051a; --fg: #ffffff; --muted: #c9c2e8; --accent: #ff6ad5;
  --glass: rgb(16 10 36 / 0.62); --glass-border: rgb(255 255 255 / 0.16);
  --focus: #6affc8;
  color-scheme: dark;
}
*, *::before, *::after { box-sizing: border-box; }
html { background: var(--bg); color: var(--fg); transition: background-color .6s, color .6s; }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
@media (prefers-reduced-motion: reduce) { html { transition: none; } }
body { margin: 0; font: 400 17px/1.6 var(--font-body); background: transparent; }
h1, h2, h3 { font-family: var(--font-head); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; margin: 0 0 .4em; }
h1, h2 { font-size: clamp(32px, 4.4vw, 64px); }
a { color: inherit; }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; border-radius: 6px; }
.kicker { font: 600 13px/1 var(--font-mono); letter-spacing: .18em; text-transform: uppercase; color: var(--muted); margin: 0 0 1rem; }
[data-theme='night'] .neon {
  background: linear-gradient(90deg, #ff6ad5, #ffd36a, #6affc8);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.skip { position: absolute; left: -999px; top: 8px; }
.skip:focus { left: 16px; z-index: 100; background: var(--bg); padding: 8px 12px; }

/* Project detail pages: plain, readable */
.prose { max-width: 70ch; margin: 0 auto; padding: 96px 16px 64px; }
.prose img { max-width: 100%; height: auto; border-radius: 12px; }
```

- [ ] **Step 6: Write `src/layouts/Base.astro`**

```astro
---
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter-tight/latin-800.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '../styles/global.css';
import { SITE } from '../config';

interface Props { title?: string; description?: string; theme?: 'day' | 'night' }
const { title = `${SITE.name} · ${SITE.role}`, description = SITE.tagline, theme = 'day' } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<!doctype html>
<html lang="en" data-theme={theme}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={new URL('/og.png', Astro.site)} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="theme-color" content="#f3e6d6" />
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
    <slot />
  </body>
</html>
```
(Fontsource CSS already sets `font-display: swap`.)

- [ ] **Step 7: Run the tests and the build to verify that they pass**

Run: `npx vitest run && npm run build`
Expected: unit tests PASS and the build completes (the content collection is validated at build time).

- [ ] **Step 8: Commit**

```bash
git add src public/resume.pdf tests/unit/content.test.ts
git commit -m "feat: content model, base layout, fonts and day/night tokens"
```

---

### Task 4: Home page HTML (all six sections, working without JS or WebGL)

**Files:**
- Create: `src/components/Section.astro`, `src/components/ProjectCard.astro`, `src/components/TimeScrubber.astro`, `src/components/Clock.astro`
- Modify: `src/pages/index.astro` (replace the temporary page), `src/styles/global.css` (append the layout CSS)
- Test: `tests/e2e/home.spec.ts`
- Delete: `tests/e2e/smoke.spec.ts` (superseded)

**Interfaces:**
- Consumes: `SITE`, `SECTIONS`, the `projects` collection, `Base`.
- Produces DOM contracts used by `page.ts` and the tests:
  - `<section class="sec sec--{align}" id={id} data-index={i} aria-labelledby="{id}-h">` with heading `id="{id}-h"`
  - `.content` wrapper inside each section (the text card; hidden in still mode)
  - `<a class="card" href="/projects/{slug}/" data-project={slug}>` project cards
  - `<nav class="scrubber" aria-label="Time of day">` holding `<a href="#{id}" data-index={i}>{time}</a>`. The active one gets `aria-current="true"`.
  - `<p class="clock" id="clock" aria-hidden="true">☀ 07:30</p>`
  - `<div id="room" class="room" aria-hidden="true">` (filled in Task 7)

- [ ] **Step 1: Write the failing E2E test**

`tests/e2e/home.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const HEADINGS = ['Hi, I’m Siddid Soni.', 'About me', 'Things I’ve built', 'What I work with', 'After hours', 'Let’s build something together.'];

test.describe('home without WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      // @ts-expect-error test stub
      HTMLCanvasElement.prototype.getContext = function (type: string, ...a: unknown[]) {
        return /webgl/.test(type) ? null : orig.call(this, type as '2d', ...(a as []));
      };
    });
  });

  test('renders all six section headings', async ({ page }) => {
    await page.goto('/');
    for (const h of HEADINGS) await expect(page.getByRole('heading', { name: h })).toHaveCount(1);
  });

  test('has contact links and featured project cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
    await expect(page.locator('a.card')).toHaveCount(4);
    await expect(page.locator('a.card').first()).toHaveAttribute('href', '/projects/realtime-chat/');
  });

  test('scrubber jumps to the right section', async ({ page }) => {
    await page.goto('/');
    await page.locator('.scrubber a[href="#skills"]').click();
    await expect(page.locator('#skills')).toBeInViewport({ ratio: 0.5 });
  });

  test('passes axe in day and night themes', async ({ page }) => {
    await page.goto('/');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'night'));
    expect((await new AxeBuilder({ page }).include('#contact').analyze()).violations).toEqual([]);
  });

  test('focus ring is visible at night', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'night'));
    await page.locator('a.card').first().focus();
    const outline = await page.locator('a.card').first().evaluate((el) => getComputedStyle(el).outlineColor);
    expect(outline).toBe('rgb(106, 255, 200)');
  });
});
```

- [ ] **Step 2: Run the test to verify that it fails**

Run: `npx playwright test tests/e2e/home.spec.ts --project=desktop`
Expected: FAIL because the headings are not found.

- [ ] **Step 3: Write the components**

`src/components/Section.astro`:
```astro
---
import type { SectionDef } from '../config';
interface Props { def: SectionDef; index: number; night?: boolean }
const { def, index, night = index >= 3 } = Astro.props;
const Tag = index === 0 ? 'h1' : 'h2';
---
<section class={`sec sec--${def.align}`} id={def.id} data-index={index} aria-labelledby={`${def.id}-h`}>
  <div class="content">
    <p class="kicker">{def.time} · {def.label}</p>
    <Tag id={`${def.id}-h`} class={night ? 'neon' : undefined}>{def.heading}</Tag>
    <slot />
  </div>
</section>
```

`src/components/ProjectCard.astro`:
```astro
---
interface Props { slug: string; title: string; summary: string; stack: string[] }
const { slug, title, summary, stack } = Astro.props;
---
<a class="card" href={`/projects/${slug}/`} data-project={slug}>
  <h3>{title}</h3>
  <p>{summary}</p>
  <ul class="tags" aria-label="Stack">{stack.map((s) => <li>{s}</li>)}</ul>
</a>
```

`src/components/TimeScrubber.astro`:
```astro
---
import { SECTIONS } from '../config';
---
<nav class="scrubber" aria-label="Time of day">
  <ol>
    {SECTIONS.map((s, i) => (
      <li><a href={`#${s.id}`} data-index={i} aria-current={i === 0 ? 'true' : undefined}>
        <span class="t">{s.time}</span><span class="sr">{s.label}</span>
      </a></li>
    ))}
  </ol>
</nav>
```

`src/components/Clock.astro`:
```astro
<p class="clock" id="clock" aria-hidden="true">☀ 07:30</p>
```

- [ ] **Step 4: Write `src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import Section from '../components/Section.astro';
import ProjectCard from '../components/ProjectCard.astro';
import TimeScrubber from '../components/TimeScrubber.astro';
import Clock from '../components/Clock.astro';
import { SITE, SECTIONS } from '../config';

const featured = (await getCollection('projects', (p) => p.data.featured))
  .sort((a, b) => a.data.order - b.data.order)
  .slice(0, 4);
const [hero, about, projects, skills, after, contact] = SECTIONS;
---
<Base>
  <header class="chrome">
    <a class="logo" href="#hero">{SITE.name}</a>
    <nav class="nav" aria-label="Main">
      <a href="#projects">Work</a><a href="#about">About</a><a href="#contact">Contact</a>
      <a href={SITE.resume}>Résumé ↗</a>
    </nav>
    <Clock />
  </header>
  <div id="room" class="room" aria-hidden="true"></div>
  <TimeScrubber />
  <main id="main">
    <Section def={hero} index={0}>
      <p class="lead">{SITE.role}. {SITE.tagline}</p>
      <a class="cue" href="#about">Scroll to start the day ↓</a>
    </Section>
    <Section def={about} index={1}>
      <p>{SITE.about}</p>
      <p class="muted">{SITE.location}</p>
    </Section>
    <Section def={projects} index={2}>
      <div class="cards">
        {featured.map((p) => <ProjectCard slug={p.id} title={p.data.title} summary={p.data.summary} stack={p.data.stack} />)}
      </div>
    </Section>
    <Section def={skills} index={3}>
      <div class="skills">
        {SITE.skills.map((g) => (
          <div><h3>{g.area}</h3><ul class="tags">{g.items.map((s) => <li>{s}</li>)}</ul></div>
        ))}
      </div>
    </Section>
    <Section def={after} index={4}>
      <ul class="after">
        {SITE.afterHours.map((a) => (
          <li><strong>{a.href ? <a href={a.href}>{a.title}</a> : a.title}</strong> · {a.text}</li>
        ))}
      </ul>
    </Section>
    <Section def={contact} index={5}>
      <ul class="contact">
        <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
        <li><a href={SITE.github}>GitHub</a></li>
        <li><a href={SITE.linkedin}>LinkedIn</a></li>
        <li><a href={SITE.resume}>Résumé (PDF)</a></li>
      </ul>
    </Section>
  </main>
</Base>
```

- [ ] **Step 5: Append the layout CSS to `src/styles/global.css`**

```css
/* ---------- home layout ---------- */
.room { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.chrome { position: fixed; inset: 0 0 auto; z-index: 10; display: flex; align-items: center; gap: 24px; padding: 18px 28px; }
.logo { font: 800 18px/1 var(--font-head); text-decoration: none; }
.nav { display: flex; gap: 18px; margin-left: auto; font-size: 15px; }
.nav a { text-decoration: none; opacity: .85; } .nav a:hover { opacity: 1; }
.clock { margin: 0; font: 600 13px/1 var(--font-mono); letter-spacing: .1em; padding: 8px 12px; border-radius: 999px;
  background: var(--glass); border: 1px solid var(--glass-border); backdrop-filter: blur(8px); }
main { position: relative; z-index: 1; }
.sec { min-height: 100svh; display: flex; align-items: center; padding: 96px 6vw; }
.sec .content { width: min(42%, 560px); }
.sec--right { justify-content: flex-end; }
.sec--center { justify-content: center; align-items: flex-end; text-align: center; padding-bottom: 14vh; }
.sec--center .content { width: min(640px, 100%); }
.lead { font-size: 20px; }
.muted { color: var(--muted); }
.cue { display: inline-block; margin-top: 1.5rem; font: 600 13px/1 var(--font-mono); letter-spacing: .12em; text-decoration: none; }
.cards { display: grid; gap: 12px; }
.card { display: block; padding: 16px 18px; border-radius: 14px; text-decoration: none;
  background: var(--glass); border: 1px solid var(--glass-border); backdrop-filter: blur(8px); transition: transform .2s; }
.card:hover, .card:focus-visible { transform: translateX(4px); }
.card h3 { font-size: 20px; margin: 0 0 4px; } .card p { margin: 0 0 8px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; padding: 0; margin: 0; }
.tags li { font: 600 12px/1 var(--font-mono); padding: 6px 8px; border-radius: 6px; border: 1px solid var(--glass-border); background: var(--glass); }
.skills { display: grid; gap: 18px; } .skills h3 { font-size: 18px; }
.after { list-style: none; padding: 0; display: grid; gap: 12px; }
.contact { list-style: none; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 12px 22px; font-size: 18px; }
.scrubber { position: fixed; right: 20px; top: 50%; transform: translateY(-50%); z-index: 10; }
.scrubber ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.scrubber a { font: 600 12px/1 var(--font-mono); text-decoration: none; opacity: .55; display: block; padding: 4px 6px; }
.scrubber a[aria-current='true'] { opacity: 1; color: var(--accent); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@media (prefers-reduced-motion: reduce) { .card { transition: none; } }
```

- [ ] **Step 6: Delete the smoke test and run the tests**

Run: `git rm tests/e2e/smoke.spec.ts && npx playwright test tests/e2e/home.spec.ts`
Expected: all PASS on desktop and mobile. If axe reports `color-contrast` on `.muted` or `.kicker`, darken `--muted` (day) or lighten it (night) until it passes. Don't disable the rule.

- [ ] **Step 7: Commit**

```bash
git add -A src tests
git commit -m "feat: semantic home page with six sections, scrubber and clock"
```

---

### Task 5: Project detail pages

**Files:**
- Create: `src/pages/projects/[slug].astro`
- Test: `tests/e2e/projects.spec.ts`

**Interfaces:**
- Consumes: the `projects` collection, `Base`.
- Produces: `/projects/{slug}/` for **every** project (featured or not).

- [ ] **Step 1: Write the failing test**

`tests/e2e/projects.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const slug of ['realtime-chat', 'ai-notes', 'dev-dashboard', 'cli-toolkit']) {
  test(`project page ${slug} renders`, async ({ page }) => {
    const res = await page.goto(`/projects/${slug}/`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/#projects');
    await expect(page.locator('canvas')).toHaveCount(0);
  });
}

test('project page passes axe', async ({ page }) => {
  await page.goto('/projects/realtime-chat/');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
```

- [ ] **Step 2: Run the test to verify that it fails**

Run: `npx playwright test tests/e2e/projects.spec.ts --project=desktop`
Expected: FAIL with status 404.

- [ ] **Step 3: Implement the page**

`src/pages/projects/[slug].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import Base from '../../layouts/Base.astro';
import { SITE } from '../../config';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map((p) => ({ params: { slug: p.id }, props: { p } }));
}
const { p } = Astro.props;
const { Content } = await render(p);
const { title, summary, stack, screenshot, links } = p.data;
---
<Base title={`${title} · ${SITE.name}`} description={summary}>
  <main id="main" class="prose">
    <p><a href="/#projects">← Back to all work</a></p>
    <p class="kicker">Case study</p>
    <h1>{title}</h1>
    <p class="lead">{summary}</p>
    <ul class="tags" aria-label="Stack">{stack.map((s) => <li>{s}</li>)}</ul>
    {(links.live || links.repo) && (
      <p class="links">
        {links.live && <a href={links.live}>Live site ↗</a>} {links.repo && <a href={links.repo}>Source ↗</a>}
      </p>
    )}
    {screenshot && <img src={screenshot} alt={`Screenshot of ${title}`} width="1280" height="800" loading="lazy" />}
    <Content />
  </main>
</Base>
```

- [ ] **Step 4: Run the test to verify that it passes**

Run: `npx playwright test tests/e2e/projects.spec.ts`
Expected: PASS on both projects.

- [ ] **Step 5: Commit**

```bash
git add src/pages/projects tests/e2e/projects.spec.ts
git commit -m "feat: static project detail pages"
```

---

### Task 6: Scene building blocks (textures, room, lighting)

**Files:**
- Create: `src/scene/textures.ts`, `src/scene/room.ts`, `src/scene/lighting.ts`
- Test: `tests/unit/room.test.ts`

**Interfaces:**
- Consumes: `Lighting` from `keyframes.ts`.
- Produces (`textures.ts`):
  `export function canvasTexture(w: number, h: number, draw: (x: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture`,
  `export function synthWindowTexture(): THREE.CanvasTexture`, `export function posterTexture(): THREE.CanvasTexture`,
  `export function drawCodeScreen(x: CanvasRenderingContext2D, w: number, h: number): void`
- Produces (`room.ts`):
  ```ts
  export interface Room { group: THREE.Group; window: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    nightWindow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>; screen: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    monitorLight: THREE.PointLight; lamp: THREE.PointLight; bulb: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
    setNeon(k: number): void; mug: THREE.Object3D; shelf: THREE.Object3D }
  export function buildRoom(opts?: { neonScale?: number; screenTexture?: THREE.Texture }): Room
  ```
- Produces (`lighting.ts`):
  ```ts
  export interface Lights { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight }
  export function createLights(scene: THREE.Scene, shadowMapSize: number): Lights
  export function applyLighting(scene: THREE.Scene, lights: Lights, room: Room, l: Lighting, shimmer?: number): void
  ```

`room.ts` and `textures.ts` need `document.createElement('canvas')`. The unit test runs these in Vitest with `environment: 'node'` by stubbing a minimal canvas (below), so no jsdom is needed.

- [ ] **Step 1: Write the failing test**

`tests/unit/room.test.ts`:
```ts
import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';

beforeAll(() => {
  const ctx = new Proxy({}, { get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}), set: () => true });
  // minimal canvas stub for CanvasTexture in node
  (globalThis as any).document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
});

describe('buildRoom + applyLighting', () => {
  it('builds named handles and toggles neon', async () => {
    const { buildRoom } = await import('../../src/scene/room');
    const room = buildRoom({ neonScale: 0.3 });
    expect(room.group.children.length).toBeGreaterThan(30);
    room.setNeon(1);
    const neonLights = room.group.children.filter((o) => (o as THREE.PointLight).isPointLight && (o as THREE.PointLight).color.getHexString() !== '5cf0ff' && o !== room.lamp);
    neonLights.forEach((l) => expect((l as THREE.PointLight).intensity).toBeLessThanOrEqual(1.5 * 0.3 + 1e-9));
    room.setNeon(0);
    neonLights.forEach((l) => expect((l as THREE.PointLight).intensity).toBe(0));
  });

  it('applies a lighting preset to scene, lights and room', async () => {
    const { buildRoom } = await import('../../src/scene/room');
    const { createLights, applyLighting } = await import('../../src/scene/lighting');
    const { KEYFRAMES } = await import('../../src/scene/keyframes');
    const scene = new THREE.Scene();
    const room = buildRoom();
    const lights = createLights(scene, 1024);
    applyLighting(scene, lights, room, KEYFRAMES[5].lighting);
    expect((scene.background as THREE.Color).getHexString()).toBe('07051a');
    expect(lights.hemi.intensity).toBeCloseTo(0.26);
    expect(room.nightWindow.material.opacity).toBe(1);
    expect(lights.sun.shadow.mapSize.x).toBe(1024);
    expect(lights.sun.shadow.bias).toBeCloseTo(-0.0008);
  });
});
```

- [ ] **Step 2: Run the test to verify that it fails**

Run: `npx vitest run tests/unit/room.test.ts`
Expected: FAIL, "Failed to resolve import ../../src/scene/room".

- [ ] **Step 3: Implement `textures.ts`** (ported from prototype lines 250–257)

```ts
import * as THREE from 'three';

export function canvasTexture(w: number, h: number, draw: (x: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function sunCanvas(s: number) {
  const c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, '#ffe66b'); g.addColorStop(0.5, '#ff8a3d'); g.addColorStop(1, '#ff2a8a');
  x.fillStyle = g; x.beginPath(); x.arc(s / 2, s / 2, s / 2, 0, 7); x.fill();
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 8; i++) x.fillRect(0, s * 0.55 + i * s * 0.06, s, s * 0.008 + i * s * 0.005);
  return c;
}

export function synthWindowTexture() {
  return canvasTexture(440, 320, (x, w, h) => {
    const hy = h * 0.66;
    const g = x.createLinearGradient(0, 0, 0, hy);
    g.addColorStop(0, '#0e0228'); g.addColorStop(0.6, '#5a0f6e'); g.addColorStop(1, '#ff2a8a');
    x.fillStyle = g; x.fillRect(0, 0, w, hy);
    x.save(); x.beginPath(); x.rect(0, 0, w, hy); x.clip(); x.drawImage(sunCanvas(190), w / 2 - 95, hy - 150); x.restore();
    x.fillStyle = '#2a0845'; x.beginPath(); x.moveTo(0, hy);
    for (let X = 0; X <= w; X += 16) { const e = Math.abs(X - w / 2) / (w / 2); x.lineTo(X, hy - (Math.sin(X * 0.13) * 0.5 + 0.5) * 46 * e * e); }
    x.lineTo(w, hy); x.fill();
    x.fillStyle = '#14002a'; x.fillRect(0, hy, w, h - hy);
    x.strokeStyle = '#ff2ad4'; x.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const y = hy + Math.pow(i / 8, 2) * (h - hy); x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
    for (let i = -12; i <= 12; i++) { x.beginPath(); x.moveTo(w / 2 + i * 9, hy); x.lineTo(w / 2 + i * 80, h); x.stroke(); }
  });
}

export function posterTexture() {
  return canvasTexture(128, 180, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 180);
    g.addColorStop(0, '#ff6ad5'); g.addColorStop(1, '#ffd36a');
    x.fillStyle = g; x.fillRect(0, 0, 128, 180);
    x.fillStyle = '#1a1030'; x.font = 'bold 22px sans-serif';
    x.fillText('SAY', 36, 80); x.fillText('HELLO', 24, 108);
  });
}

export function drawCodeScreen(x: CanvasRenderingContext2D, w: number, h: number) {
  x.globalAlpha = 1;
  x.fillStyle = '#0b1020'; x.fillRect(0, 0, w, h);
  const cols = ['#ff79c6', '#8be9fd', '#50fa7b', '#f1fa8c', '#bd93f9'];
  for (let i = 0; i < 16; i++) {
    let X = 24 + (i % 4) * 20;
    for (let j = 0; j < 3; j++) {
      const bw = 20 + ((i * 37 + j * 53) % 90);
      x.fillStyle = cols[(i + j) % 5]; x.fillRect(X, 20 + i * 22, bw, 10); X += bw + 14;
    }
  }
}
```

- [ ] **Step 4: Implement `room.ts`** (ported from prototype `buildRoom` with the `DAY_PAL` palette, flat monitor and no CRT/hole/closed options)

```ts
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
```

- [ ] **Step 5: Implement `lighting.ts`**

```ts
import * as THREE from 'three';
import type { Lighting } from './keyframes';
import type { Room } from './room';

export interface Lights { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight }

export function createLights(scene: THREE.Scene, shadowMapSize: number): Lights {
  scene.background = new THREE.Color();
  const hemi = new THREE.HemisphereLight();
  const sun = new THREE.DirectionalLight();
  sun.position.set(7, 10, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  sun.shadow.bias = -0.0008;
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
  scene.add(hemi, sun);
  return { hemi, sun };
}

/** shimmer: 0..1 extra neon wobble (0 when reduced motion). */
export function applyLighting(scene: THREE.Scene, lights: Lights, room: Room, l: Lighting, shimmer = 0) {
  (scene.background as THREE.Color).set(l.background);
  lights.hemi.color.set(l.hemiSky);
  lights.hemi.groundColor.set(l.hemiGround);
  lights.hemi.intensity = l.hemiIntensity;
  lights.sun.color.set(l.sunColor);
  lights.sun.intensity = l.sunIntensity;
  room.setNeon(Math.min(1, l.night * (1 + shimmer * 0.06)));
  room.lamp.intensity = l.lamp;
  room.bulb.material.color.set(l.lamp > 0.3 ? '#ffd9a0' : '#bbbbbb');
  room.nightWindow.material.opacity = l.night;
  room.window.material.color.set(l.sky);
  room.monitorLight.intensity = 0.25 + l.night * 0.5;
}
```

- [ ] **Step 6: Run the test to verify that it passes**

Run: `npx vitest run tests/unit/room.test.ts`
Expected: PASS. If the canvas stub misses a method that the code calls (for example `drawImage`), the Proxy returns a no-op, so it should not throw.

- [ ] **Step 7: Commit**

```bash
git add src/scene tests/unit/room.test.ts
git commit -m "feat(scene): room geometry, textures and lighting presets"
```

---

### Task 7: Scene bootstrap, page script and the RoomCanvas island

**Files:**
- Create: `src/scripts/page.ts`, `src/scene/main.ts`, `src/components/RoomCanvas.astro`
- Modify: `src/pages/index.astro` (replace `<div id="room" …></div>` with `<RoomCanvas projects={…} />`)
- Test: `tests/e2e/scene.spec.ts`

**Interfaces:**
- Consumes: `sampleTimeline`, `damp`, `progressFromSections`, `formatClock`, `frameOffset` (Task 2); `buildRoom`, `createLights`, `applyLighting` (Task 6); the DOM contracts from Task 4.
- Produces (`page.ts`): `export function initPage(): void`, which:
  - measures `.sec` tops on load and resize and computes `f` on scroll (passive, rAF-throttled)
  - dispatches `portfolio:progress` `{ f }`
  - sets `document.documentElement.dataset.theme` and dispatches `portfolio:theme` when the theme changes
  - updates `#clock` text via `formatClock(sampleTimeline(f).clockMinutes)`
  - sets `aria-current` on the scrubber link for `Math.round(f)`
  - dispatches `portfolio:project-focus` `{ slug }` on `pointerenter`/`focusin` of `[data-project]` and `{ slug: null }` on `pointerleave`/`focusout`
  - exposes `window.__portfolio = { f }` for tests and stills
- Produces (`main.ts`): `export function start(host: HTMLElement, opts: { projects: MonitorProject[]; still?: number }): { dispose(): void }`, which throws if WebGL is unavailable. It sets `host.dataset.scene = 'ready'` after the first render and `host.dataset.settled = 'true' | 'false'` every frame. (`MonitorProject` is defined in Task 8. In this task `main.ts` accepts `projects` but ignores it.)
- `RoomCanvas.astro` props: `projects: { slug: string; title: string; summary: string; stack: string[]; screenshot?: string; accent: [string, string] }[]`.

- [ ] **Step 1: Write the failing test**

`tests/e2e/scene.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('scene boots after first paint and renders a canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#room canvas')).toHaveCount(1, { timeout: 15_000 });
  await expect(page.locator('#room')).toHaveAttribute('data-scene', 'ready', { timeout: 15_000 });
});

test('scrolling to contact switches to night and updates the clock', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await expect(page.locator('#clock')).toHaveText('☾ 00:00');
  await expect(page.locator('.scrubber a[href="#contact"]')).toHaveAttribute('aria-current', 'true');
});

test('focusing a project card fires portfolio:project-focus', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    (window as any).__focus = [];
    addEventListener('portfolio:project-focus', (e) => (window as any).__focus.push((e as CustomEvent).detail.slug));
  });
  await page.locator('a.card').first().focus();
  await page.locator('a.cue').focus();
  expect(await page.evaluate(() => (window as any).__focus)).toEqual(['realtime-chat', null]);
});
```

- [ ] **Step 2: Run the test to verify that it fails**

Run: `npx playwright test tests/e2e/scene.spec.ts --project=desktop`
Expected: FAIL because there's no canvas and the theme stays `day`.

- [ ] **Step 3: Implement `src/scripts/page.ts`**

```ts
import { formatClock, progressFromSections, sampleTimeline } from '../scene/timeline';

declare global { interface Window { __portfolio: { f: number } } }

export function initPage() {
  const root = document.documentElement;
  const sections = [...document.querySelectorAll<HTMLElement>('.sec')];
  const clock = document.getElementById('clock');
  const scrub = [...document.querySelectorAll<HTMLAnchorElement>('.scrubber a')];
  let tops: number[] = [];
  let theme = root.dataset.theme ?? 'day';
  let active = -1;
  let queued = false;
  window.__portfolio = { f: 0 };

  const measure = () => { tops = sections.map((s) => s.offsetTop); };
  const update = () => {
    queued = false;
    const max = root.scrollHeight - innerHeight;
    const f = progressFromSections(scrollY, tops, max);
    window.__portfolio.f = f;
    const s = sampleTimeline(f);
    dispatchEvent(new CustomEvent('portfolio:progress', { detail: { f } }));
    if (clock) clock.textContent = formatClock(s.clockMinutes);
    if (s.theme !== theme) {
      theme = s.theme;
      root.dataset.theme = theme;
      dispatchEvent(new CustomEvent('portfolio:theme', { detail: { theme } }));
    }
    if (s.index !== active) {
      active = s.index;
      scrub.forEach((a, i) => (i === active ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    }
  };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  measure();
  update();
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { measure(); schedule(); });
  new ResizeObserver(() => { measure(); schedule(); }).observe(document.body);

  const focus = (slug: string | null) => dispatchEvent(new CustomEvent('portfolio:project-focus', { detail: { slug } }));
  document.querySelectorAll<HTMLElement>('[data-project]').forEach((el) => {
    const slug = el.dataset.project!;
    el.addEventListener('pointerenter', () => focus(slug));
    el.addEventListener('pointerleave', () => focus(null));
    el.addEventListener('focusin', () => focus(slug));
    el.addEventListener('focusout', () => focus(null));
  });
}
```

- [ ] **Step 4: Implement `src/scene/main.ts`**

```ts
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
```

- [ ] **Step 5: Implement `src/components/RoomCanvas.astro`**

```astro
---
interface Props { projects: { slug: string; title: string; summary: string; stack: string[]; screenshot?: string; accent: [string, string] }[] }
const { projects } = Astro.props;
---
<div id="room" class="room" aria-hidden="true" data-projects={JSON.stringify(projects)}>
  <div class="stills"></div>
</div>
<script>
  import { initPage } from '../scripts/page';
  initPage();
  const host = document.getElementById('room')!;
  const boot = () => {
    import('../scene/main')
      .then((m) => m.start(host, { projects: JSON.parse(host.dataset.projects ?? '[]') }))
      .catch(() => host.classList.add('fallback'));
  };
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(boot, { timeout: 1500 }) : setTimeout(boot, 200));
  if (document.readyState === 'complete') requestAnimationFrame(idle);
  else addEventListener('load', () => requestAnimationFrame(idle), { once: true });
</script>
<style>
  .room :global(canvas) { width: 100%; height: 100%; display: block; }
  .room.cut :global(canvas) { animation: cut 300ms ease-out; }
  @keyframes cut { from { opacity: 0; } to { opacity: 1; } }
</style>
```

Update `src/pages/index.astro`: add `import RoomCanvas from '../components/RoomCanvas.astro';` and replace `<div id="room" class="room" aria-hidden="true"></div>` with:
```astro
<RoomCanvas projects={featured.map((p) => ({ slug: p.id, title: p.data.title, summary: p.data.summary, stack: p.data.stack, screenshot: p.data.screenshot, accent: p.data.accent }))} />
```

- [ ] **Step 6: Run the tests to verify that they pass**

Run: `npx playwright test tests/e2e/scene.spec.ts tests/e2e/home.spec.ts`
Expected: PASS. (Headless Chromium uses SwiftShader WebGL, so the canvas boots. `home.spec.ts` still passes because it stubs WebGL and the boot `.catch` adds `fallback`.) Manual check: run `npm run dev`, scroll, and check that the camera glides between the mug, monitor, shelf and window like prototype tab O.

- [ ] **Step 7: Commit**

```bash
git add src tests/e2e/scene.spec.ts
git commit -m "feat(scene): lazy Three.js room driven by scroll progress"
```

---

### Task 8: Monitor texture and project swapping

**Files:**
- Create: `src/scene/monitor.ts`
- Modify: `src/scene/main.ts` (wire the monitor)
- Test: `tests/unit/monitor.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface MonitorProject { slug: string; title: string; summary: string; stack: string[]; screenshot?: string; accent: [string, string] }
  export function cycleIndex(timeMs: number, count: number, periodMs?: number): number   // pure; period default 4000
  export function createMonitor(projects: MonitorProject[], opts?: { cycle?: boolean; load?: (src: string) => Promise<CanvasImageSource> }):
    { texture: THREE.CanvasTexture; focus(slug: string | null): void; tick(nowMs: number): boolean /* true = redraw happened */; ready: Promise<void> }
  ```
  Behaviour: the default screen is `drawCodeScreen`. `focus(slug)` fades (250 ms) to that project's image, or to a generated title card (accent gradient + title + stack) when `screenshot` is missing or fails to load. `focus(null)` resumes cycling (when `cycle`) or the code screen. Screenshots load **after** `ready` is requested lazily (on first `tick`). Load failures are swallowed and logged only when `import.meta.env.DEV`.

- [ ] **Step 1: Write the failing test**

`tests/unit/monitor.test.ts`:
```ts
import { describe, it, expect, beforeAll, vi } from 'vitest';

beforeAll(() => {
  const ctx = new Proxy({}, { get: (_t, k) => (k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  (globalThis as any).document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
});

const P = [
  { slug: 'a', title: 'A', summary: 's', stack: ['x'], screenshot: '/missing.webp', accent: ['#000000', '#ffffff'] as [string, string] },
  { slug: 'b', title: 'B', summary: 's', stack: ['y'], accent: ['#000000', '#ffffff'] as [string, string] },
];

describe('monitor', () => {
  it('cycleIndex steps every period and wraps', async () => {
    const { cycleIndex } = await import('../../src/scene/monitor');
    expect(cycleIndex(0, 3)).toBe(0);
    expect(cycleIndex(4000, 3)).toBe(1);
    expect(cycleIndex(12000, 3)).toBe(0);
    expect(cycleIndex(5000, 0)).toBe(-1);
  });

  it('falls back when the image fails and never throws', async () => {
    const { createMonitor } = await import('../../src/scene/monitor');
    const load = vi.fn(() => Promise.reject(new Error('404')));
    const m = createMonitor(P, { cycle: false, load });
    m.tick(0);
    await m.ready;
    expect(load).toHaveBeenCalledWith('/missing.webp');
    m.focus('a');
    expect(() => { for (let t = 0; t <= 400; t += 16) m.tick(t); }).not.toThrow();
    m.focus('b');
    expect(m.tick(500)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify that it fails**

Run: `npx vitest run tests/unit/monitor.test.ts`
Expected: FAIL, "Failed to resolve import ../../src/scene/monitor".

- [ ] **Step 3: Implement `monitor.ts`**

```ts
import * as THREE from 'three';
import { drawCodeScreen } from './textures';

export interface MonitorProject { slug: string; title: string; summary: string; stack: string[]; screenshot?: string; accent: [string, string] }

const W = 1024, H = 640, FADE = 250;

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
    if (!p) { drawCodeScreen(x, W, H); return; }
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

  drawCodeScreen(x, W, H);

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
```

- [ ] **Step 4: Run the test to verify that it passes**

Run: `npx vitest run tests/unit/monitor.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire it into `main.ts`**

In `src/scene/main.ts`:
- Add the import `import { createMonitor, type MonitorProject } from './monitor';` and change `StartOptions.projects` to `MonitorProject[]`.
- After `const room = buildRoom(...)`, add:
  ```ts
  const monitor = createMonitor(opts.projects, { cycle: !reduced });
  room.screen.material.map = monitor.texture;
  room.screen.material.needsUpdate = true;
  const onFocus = (e: Event) => { monitor.focus((e as CustomEvent<{ slug: string | null }>).detail.slug); dirty = true; };
  addEventListener('portfolio:project-focus', onFocus);
  ```
- In `frame`, compute the monitor change **before** the early-return check:
  ```ts
  const monitorChanged = monitor.tick(now);
  if (!dirty && !settling && !idle && !monitorChanged) { host.dataset.settled = 'true'; return; }
  ```
  (This replaces the existing early-return line.)
- In `dispose()`, add `removeEventListener('portfolio:project-focus', onFocus);`.

- [ ] **Step 6: Run the unit and e2e tests**

Run: `npm test && npx playwright test tests/e2e/scene.spec.ts`
Expected: PASS. Manual check: in `npm run dev`, hover a card in the Projects section and check that the monitor fades to that project's title card.

- [ ] **Step 7: Commit**

```bash
git add src/scene tests/unit/monitor.test.ts
git commit -m "feat(scene): monitor shows the focused or cycling project"
```

---

### Task 9: Fallbacks: no WebGL, context loss and low power

**Files:**
- Modify: `src/components/RoomCanvas.astro`, `src/scripts/page.ts`, `src/scene/main.ts`, `src/styles/global.css`
- Test: `tests/e2e/fallback.spec.ts`

**Interfaces:**
- Consumes: `.room.fallback` class (Task 7), `portfolio:progress`.
- Produces:
  - `.stills` holds six `<img class="still" src="/fallback/{i}.webp" alt="" data-index={i} loading="lazy">`. `page.ts` sets each still's opacity to `max(0, 1 − |f − i|)` when `.room.fallback` is present.
  - `main.ts` listens for `webglcontextlost` (calls `preventDefault`, adds `.fallback`, pauses) and `webglcontextrestored` (removes `.fallback`, marks dirty, resumes). The restore is attempted **once**: after a second loss, it stays in fallback.
  - Low power: after the first 60 rendered frames, if the average frame interval is above 1000/24 ms, it sets `renderer.shadowMap.enabled = false`, `lights.sun.castShadow = false`, `renderer.setPixelRatio(1)`, and `host.dataset.lowPower = 'true'`.
  - `main.ts` must expose `lights` in its return value for this.

- [ ] **Step 1: Write the failing test**

`tests/e2e/fallback.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('no WebGL: fallback stills show and cross-fade with scroll', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error stub
    HTMLCanvasElement.prototype.getContext = function (t: string, ...a: unknown[]) { return /webgl/.test(t) ? null : orig.call(this, t as '2d', ...(a as [])); };
  });
  await page.goto('/');
  await expect(page.locator('#room')).toHaveClass(/fallback/, { timeout: 10_000 });
  await expect(page.locator('.still[data-index="0"]')).toHaveCSS('opacity', '1');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('.still[data-index="5"]')).toHaveCSS('opacity', '1');
  await expect(page.locator('.still[data-index="0"]')).toHaveCSS('opacity', '0');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
});

test('context loss switches to fallback, restore brings the canvas back', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#room')).toHaveAttribute('data-scene', 'ready', { timeout: 15_000 });
  await page.evaluate(() => {
    const gl = document.querySelector<HTMLCanvasElement>('#room canvas')!.getContext('webgl2')!;
    (window as any).__lose = gl.getExtension('WEBGL_lose_context');
    (window as any).__lose.loseContext();
  });
  await expect(page.locator('#room')).toHaveClass(/fallback/);
  await page.evaluate(() => (window as any).__lose.restoreContext());
  await expect(page.locator('#room')).not.toHaveClass(/fallback/, { timeout: 10_000 });
});
```

- [ ] **Step 2: Run the test to verify that it fails**

Run: `npx playwright test tests/e2e/fallback.spec.ts --project=desktop`
Expected: FAIL because no `.still` elements exist and context loss is not handled.

- [ ] **Step 3: Add the stills markup and CSS**

In `RoomCanvas.astro`, replace `<div class="stills"></div>` with:
```astro
<div class="stills">
  {[0, 1, 2, 3, 4, 5].map((i) => <img class="still" src={`/fallback/${i}.webp`} alt="" data-index={i} loading="lazy" decoding="async" />)}
</div>
```
Append to `global.css`:
```css
.stills { position: absolute; inset: 0; display: none; }
.room.fallback .stills { display: block; }
.room.fallback canvas { display: none; }
.still { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .3s; }
.still[data-index='0'] { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .still { transition: none; } }
```

- [ ] **Step 4: Cross-fade the stills in `page.ts`**

Inside `initPage`, after `const scrub = …`, add:
```ts
const room = document.getElementById('room');
const stills = [...document.querySelectorAll<HTMLElement>('.still')];
```
At the end of `update()`, add:
```ts
if (room?.classList.contains('fallback')) {
  stills.forEach((el, i) => { el.style.opacity = String(Math.max(0, 1 - Math.abs(f - i))); });
}
```
Also re-run `update()` when the fallback class appears, since the scene can fail after the first update:
```ts
if (room) new MutationObserver(schedule).observe(room, { attributes: true, attributeFilter: ['class'] });
```

- [ ] **Step 5: Handle context loss and low power in `main.ts`**

After `host.prepend(canvas);`, add:
```ts
let restores = 0, lost = false;
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault(); lost = true;
  cancelAnimationFrame(raf);
  host.classList.add('fallback');
  dispatchEvent(new Event('scroll')); // let page.ts fade the right still in
});
canvas.addEventListener('webglcontextrestored', () => {
  if (restores++ > 0) return; // one restore only
  lost = false;
  host.classList.remove('fallback');
  dirty = true; last = performance.now();
  raf = requestAnimationFrame(frame);
});
```
Note: `raf`, `dirty`, `last` and `frame` are declared later with `let`/`const`. Put these listeners **after** the `raf = requestAnimationFrame(frame);` line so they are initialised. Make the second `webglcontextlost` permanent: in the lost handler, do nothing extra. The `restores` guard already blocks a second restore.

Low-power check: declare `let frames = 0, firstFrameAt = 0;` near the other state. In `frame`, right after `renderer.render(scene, camera);`, add:
```ts
if (frames === 0) firstFrameAt = now;
if (++frames === 60 && (now - firstFrameAt) / 59 > 1000 / 24) {
  renderer.shadowMap.enabled = false;
  lights.sun.castShadow = false;
  renderer.setPixelRatio(1);
  resize();
  host.dataset.lowPower = 'true';
}
```
Also guard the visibility handler: `else if (!lost) { … }`. Add `lights` to the returned object.

Note: render-on-demand means 60 rendered frames may span idle gaps. Only count frames while `settling || idle` is true (wrap the counter in `if (settling || idle)`), so idle gaps don't trigger low power falsely.

- [ ] **Step 6: Add temporary stills so the test can load images**

Until Task 10 generates real stills, create 1×1 placeholders:
```bash
mkdir -p public/fallback && for i in 0 1 2 3 4 5; do node -e "require('sharp')({create:{width:16,height:10,channels:3,background:'#888'}}).webp().toFile('public/fallback/$i.webp')"; done
```

- [ ] **Step 7: Run the tests to verify that they pass**

Run: `npx playwright test tests/e2e/fallback.spec.ts tests/e2e/home.spec.ts tests/e2e/scene.spec.ts`
Expected: PASS on both projects. If the restore test is flaky under SwiftShader, raise its timeout to 15 s. Don't remove the test.

- [ ] **Step 8: Commit**

```bash
git add src public/fallback tests/e2e/fallback.spec.ts
git commit -m "feat: fallback stills for no-WebGL, context loss and low-power mode"
```

---

### Task 10: Mobile layout, still mode and the pre-rendered stills / OG image

**Files:**
- Modify: `src/styles/global.css` (responsive), `src/components/RoomCanvas.astro` (still mode), `src/scene/main.ts` (`still` option)
- Create: `scripts/render-stills.mjs`, `public/og.png` (generated), `public/fallback/{0..5}.webp` (regenerated)
- Test: `tests/e2e/mobile.spec.ts`

**Interfaces:**
- Consumes: `start(host, { projects, still })`.
- Produces: the `?still=N` query (N in 0..5) renders keyframe N with the text hidden (`html.still-mode`) and sets `#room[data-still-ready="true"]` after two rendered frames. `npm run stills` writes `public/fallback/N.webp` (1600×1000, quality 70) and `public/og.png` (1200×630, night room + name).

- [ ] **Step 1: Write the failing mobile test**

`tests/e2e/mobile.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test.describe('mobile layout', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 760, 'mobile only');

  test('text sits in a bottom card with no horizontal scroll', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const box = await page.locator('#about .content').boundingBox();
    const vh = page.viewportSize()!.height;
    await page.locator('#about').scrollIntoViewIfNeeded();
    const after = await page.locator('#about .content').boundingBox();
    expect(after!.y).toBeGreaterThan(vh * 0.4);
    expect(box).not.toBeNull();
  });

  test('scrubber is a dot row', async ({ page }) => {
    await page.goto('/');
    const dir = await page.locator('.scrubber ol').evaluate((el) => getComputedStyle(el).gridAutoFlow);
    expect(dir).toBe('column');
  });
});
```

- [ ] **Step 2: Run the test to verify that it fails**

Run: `npx playwright test tests/e2e/mobile.spec.ts --project=mobile`
Expected: FAIL because the content isn't positioned low and the scrubber is not a column flow.

- [ ] **Step 3: Append the responsive CSS**

```css
@media (min-width: 760px) and (max-width: 1023px) {
  .sec .content { width: min(48%, 520px); }
}
@media (max-width: 759px) {
  .chrome { padding: 12px 16px; gap: 12px; }
  .nav { display: none; }
  .clock { margin-left: auto; }
  .sec { padding: 0 16px 16px; align-items: flex-end; justify-content: center; }
  .sec .content, .sec--center .content { width: 100%; padding: 18px; border-radius: 16px;
    background: var(--glass); border: 1px solid var(--glass-border); backdrop-filter: blur(10px); }
  .sec--center { padding-bottom: 16px; text-align: left; }
  .contact { justify-content: flex-start; }
  .scrubber { top: auto; bottom: 8px; right: 50%; transform: translateX(50%); }
  .scrubber ol { grid-auto-flow: column; gap: 4px; }
  .scrubber .t { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: currentColor; font-size: 0; }
  .scrubber a { padding: 8px; } /* ≥ 24px tap target */
}
html.still-mode main, html.still-mode .chrome, html.still-mode .scrubber { visibility: hidden; }
```

- [ ] **Step 4: Add still mode**

In `RoomCanvas.astro`'s script, read the query and pass `still`:
```ts
const q = new URLSearchParams(location.search).get('still');
const still = q != null && /^[0-5]$/.test(q) ? Number(q) : undefined;
if (still != null) document.documentElement.classList.add('still-mode');
```
and change the boot call to `m.start(host, { projects: …, still })`.

In `main.ts`, after `renderer.render(scene, camera);`, add:
```ts
if (opts.still != null && ++stillFrames === 2) host.dataset.stillReady = 'true';
```
with `let stillFrames = 0;` among the state. When `opts.still != null`, also force `reduced`-style behaviour for determinism: change `const reduced = …` to `const reduced = opts.still != null || matchMedia(...).matches;`. Note that `opts` is read before this line, so keep `start(host, opts)` as the signature.

- [ ] **Step 5: Write `scripts/render-stills.mjs`**

```js
// Renders fallback stills and the OG image from the built site. Usage: npm run build && npm run stills
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const NAME = 'Siddid Soni';
const server = spawn('npx', ['astro', 'preview', '--port', '4322'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  mkdirSync('public/fallback', { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  for (let i = 0; i <= 5; i++) {
    await page.goto(`http://localhost:4322/?still=${i}`);
    await page.waitForSelector('#room[data-still-ready="true"]', { timeout: 20_000 });
    const png = await page.locator('#room canvas').screenshot();
    await sharp(png).webp({ quality: 70 }).toFile(`public/fallback/${i}.webp`);
    console.log(`fallback/${i}.webp`);
  }
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto('http://localhost:4322/?still=5');
  await page.waitForSelector('#room[data-still-ready="true"]', { timeout: 20_000 });
  const og = await page.locator('#room canvas').screenshot();
  const text = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <text x="64" y="540" font-family="Inter Tight, sans-serif" font-weight="800" font-size="84" fill="#ffffff">${NAME}</text></svg>`);
  await sharp(og).composite([{ input: text }]).png().toFile('public/og.png');
  console.log('og.png');
} finally {
  await browser.close();
  server.kill();
}
```

- [ ] **Step 6: Generate the stills and run all tests**

Run:
```bash
npm run build && npm run stills
ls -l public/fallback public/og.png
npx playwright test --grep-invert @visual
```
Expected: six WebP files, each well under 150 KB, plus `og.png`. Open them to check they show the room at each time of day. All E2E tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src scripts public/fallback public/og.png tests/e2e/mobile.spec.ts
git commit -m "feat: mobile bottom-card layout, still mode, pre-rendered fallbacks and OG image"
```

---

### Task 11: Budgets, visual baselines and Lighthouse CI

**Files:**
- Create: `scripts/check-budget.mjs`, `lighthouserc.json`, `tests/e2e/visual.spec.ts`
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `dist/` from `npm run build`. The scene sets `data-settled` (Task 7).

- [ ] **Step 1: Write the budget check**

`scripts/check-budget.mjs`:
```js
// Fails if home-page JS (gzipped) > 200 KB or fonts > 80 KB.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk('dist');
const html = readFileSync('dist/index.html', 'utf8');
const entry = [...html.matchAll(/src="(\/_astro\/[^"]+\.js)"/g)].map((m) => 'dist' + m[1]);
// Include every JS chunk (the scene chunk is dynamically imported by the home page).
const js = files.filter((f) => f.endsWith('.js'));
const jsGz = js.reduce((n, f) => n + gzipSync(readFileSync(f)).length, 0);
const fonts = files.filter((f) => f.endsWith('.woff2')).reduce((n, f) => n + statSync(f).size, 0);
const kb = (b) => (b / 1024).toFixed(1) + ' KB';
console.log(`entry scripts: ${entry.length}, all JS gz: ${kb(jsGz)}, fonts: ${kb(fonts)}`);
let ok = true;
if (jsGz > 200 * 1024) { console.error('JS budget exceeded (200 KB)'); ok = false; }
if (fonts > 80 * 1024) { console.error('Font budget exceeded (80 KB)'); ok = false; }
process.exit(ok ? 0 : 1);
```
Note: Fontsource copies **all** subsets into `dist`, but browsers only download the latin subset because of `unicode-range`. Only latin files are imported, but if the count still exceeds 80 KB, restrict the font sum to files whose name contains `-latin-` (change the filter to `f.endsWith('.woff2') && f.includes('-latin-')`). Don't lower the budget.

- [ ] **Step 2: Run the budget check**

Run: `npm run build && npm run budget`
Expected: PASS, with JS gz roughly 150–190 KB and fonts about 68 KB. If JS is over budget, check that `main.ts` imports `three` via `import * as THREE from 'three'` (tree-shaken by Vite) and that nothing imports `three/examples/jsm/Addons.js`.

- [ ] **Step 3: Write the visual tests**

`tests/e2e/visual.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

for (const [label, f] of [['p0', 0], ['p40', 2], ['p80', 4], ['p100', 5]] as const) {
  test(`@visual home at ${label}`, async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#room')).toHaveAttribute('data-scene', 'ready', { timeout: 15_000 });
    await page.evaluate((i) => {
      const s = document.querySelectorAll<HTMLElement>('.sec')[i];
      window.scrollTo(0, i === 5 ? document.documentElement.scrollHeight : s.offsetTop);
    }, f);
    await expect(page.locator('#room')).toHaveAttribute('data-settled', 'true', { timeout: 10_000 });
    await expect(page).toHaveScreenshot(`home-${label}.png`);
  });
}
```

- [ ] **Step 4: Create the baselines and verify that they're stable**

Run:
```bash
npx playwright test --grep @visual --update-snapshots
npx playwright test --grep @visual
```
Expected: the first run writes 8 PNGs under `tests/e2e/visual.spec.ts-snapshots/`. The second run PASSES. Visual tests run locally only (CI uses `--grep-invert @visual`), because font rendering differs between machines.

- [ ] **Step 5: Write `lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": ["http://localhost/index.html", "http://localhost/projects/realtime-chat/index.html"],
      "numberOfRuns": 2,
      "settings": { "formFactor": "mobile" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

- [ ] **Step 6: Run Lighthouse locally**

Run: `npm run build && npx lhci autorun`
Expected: all assertions PASS. If performance is under 85, open the report and fix the top opportunity. Likely causes are LCP held up by fonts (check that `font-display: swap` is present in the built CSS) or long main-thread work at boot (the scene must start in `requestIdleCallback`). Don't lower the thresholds.

- [ ] **Step 7: Add the budget and Lighthouse checks to the workflow**

In `.github/workflows/deploy.yml`, after `- run: npm run build`, add:
```yaml
      - run: npm run budget
      - run: npx lhci autorun
```

- [ ] **Step 8: Commit**

```bash
git add scripts/check-budget.mjs lighthouserc.json tests/e2e/visual.spec.ts tests/e2e/visual.spec.ts-snapshots .github/workflows/deploy.yml
git commit -m "test: budgets, visual baselines and Lighthouse CI thresholds"
```

---

### Task 12: Publish to GitHub Pages

**Files:**
- Modify: `README.md` (replace with a short project README)

- [ ] **Step 1: Write the README**

`README.md`:
```md
# siddid.me

Personal portfolio: one day in a low-poly 3D room. Built with Astro and Three.js and deployed to GitHub Pages.

- `npm run dev` starts the local dev server
- `npm test` runs the unit tests, and `npm run test:e2e` runs the browser tests
- `npm run build && npm run stills` regenerates the fallback stills and the OG image after changing the scene
- Edit `src/config.ts` and `src/content/projects/*.md` to change the content
```

- [ ] **Step 2: Run the full verification locally**

Run: `npm test && npm run build && npm run budget && npm run test:e2e`
Expected: everything PASSES.

- [ ] **Step 3: Commit and confirm before pushing**

```bash
git add README.md && git commit -m "docs: project README"
```
**Ask the owner before pushing.** Pushing deploys to the live `siddid.me`. They also need to set **Settings → Pages → Source = "GitHub Actions"** in the repo, or the deploy job fails.

- [ ] **Step 4: Push and watch the deploy**

```bash
git push origin main
gh run watch --exit-status $(gh run list --workflow Deploy --limit 1 --json databaseId -q '.[0].databaseId')
```
Expected: the `build` and `deploy` jobs succeed. `curl -sI https://siddid.me/ | head -1` returns `HTTP/2 200`, and `curl -s https://siddid.me/ | grep -c 'Siddid Soni'` is ≥ 1.
