// Renders the monitor images for the featured projects into public/projects/. Usage: npm run projects
// - scripts/project-art/<slug>.html: designed graphics, rendered at 1280×800
// - omarchy-armoury: the dashboard screenshot from its GitHub repo, letterboxed to 1280×800
// - monsoon-coffee: a poster frame plus a looping scroll-through of the live site (needs ffmpeg on PATH)
import { chromium } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const OUT = 'public/projects';
const W = 1280, H = 800, FPS = 24;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const kb = (f) => `${(statSync(f).size / 1024).toFixed(0)} KB`;

try {
  // Designed graphics.
  const art = await browser.newPage({ viewport: { width: W, height: H } });
  for (const f of readdirSync('scripts/project-art').filter((f) => f.endsWith('.html'))) {
    await art.goto(`file://${resolve('scripts/project-art', f)}`);
    await art.evaluate(() => document.fonts.ready);
    const out = join(OUT, f.replace('.html', '.webp'));
    await sharp(await art.screenshot()).webp({ quality: 82 }).toFile(out);
    console.log(out, kb(out));
  }

  // Real screenshot from the repo, on its own background colour.
  const res = await fetch('https://raw.githubusercontent.com/Siddid-Soni/omarchy-armoury/HEAD/docs/screenshots/dashboard.png');
  const shot = sharp(Buffer.from(await res.arrayBuffer()));
  const desk = { r: 19, g: 18, b: 30 }; // a dark desktop behind the window
  const armoury = join(OUT, 'omarchy-armoury.webp');
  await shot.resize(W - 80, H - 60, { fit: 'contain', background: desk }).extend({ top: 30, bottom: 30, left: 40, right: 40, background: desk })
    .webp({ quality: 82 }).toFile(armoury);
  console.log(armoury, kb(armoury));

  // Live website: scroll through the home page, pausing on each section, then crossfade back to the top so it loops.
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto('https://monsooncoffee.co', { waitUntil: 'load', timeout: 60_000 });
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  for (let y = 0; y < 5000; y += 400) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(120); } // wake lazy images
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(2000);
  const top = (text) => page.evaluate((t) => {
    const el = [...document.querySelectorAll('h1, h2, h3')].find((e) => e.textContent?.toLowerCase().includes(t));
    return el ? Math.max(0, el.getBoundingClientRect().top + scrollY - 70) : null;
  }, text);
  const stops = [0, (await top('current stash')) ?? 820, (await top('meticulous')) ?? 1720, (await top('hardware')) ?? 2640];
  const dir = mkdtempSync(join(tmpdir(), 'monsoon-'));
  let n = 0;
  const frame = async () => { await page.screenshot({ path: join(dir, `f${String(++n).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 }); };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const hold = async (s) => { for (let i = 0; i < s * FPS; i++) await frame(); };
  const move = async (a, b, s) => {
    for (let i = 1; i <= s * FPS; i++) { await page.evaluate((y) => scrollTo(0, y), a + (b - a) * ease(i / (s * FPS))); await frame(); }
  };
  await hold(1.4);
  for (let i = 1; i < stops.length; i++) {
    await move(stops[i - 1], stops[i], 1.3);
    if (i === 1) { // hover the first product card in the stash
      const card = await page.locator('a, button').filter({ hasText: /view product/i }).first().boundingBox().catch(() => null);
      if (card) await page.mouse.move(card.x + card.width / 2, card.y - 120, { steps: 8 });
    }
    await hold(1.5);
    await page.mouse.move(W - 4, H / 2);
  }
  const files = readdirSync(dir).sort();
  const first = join(dir, files[0]), last = join(dir, files.at(-1));
  for (let i = 1; i <= 0.6 * FPS; i++) {
    const over = await sharp(first).ensureAlpha(i / (0.6 * FPS)).toBuffer();
    await sharp(last).composite([{ input: over }]).jpeg({ quality: 92 }).toFile(join(dir, `f${String(++n).padStart(4, '0')}.jpg`));
  }
  const poster = join(OUT, 'monsoon-coffee.webp');
  await sharp(first).webp({ quality: 80 }).toFile(poster);
  console.log(poster, kb(poster));
  const video = join(OUT, 'monsoon-coffee.mp4');
  const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, 'f%04d.jpg'),
    '-vf', 'scale=960:600:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-an', video], { stdio: 'inherit' });
  if (ff.status !== 0) throw new Error('ffmpeg failed (is it installed?)');
  console.log(video, kb(video), `${n} frames`);
  rmSync(dir, { recursive: true, force: true });
} finally {
  await browser.close();
}
