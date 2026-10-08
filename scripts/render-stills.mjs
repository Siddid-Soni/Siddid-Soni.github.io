// Renders fallback stills and the OG image from the built site. Usage: npm run build && npm run stills
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const NAME = 'Siddid Soni';
const server = spawn('npx', ['astro', 'preview', '--port', '4322', '--ignore-lock'], { stdio: 'ignore' });
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
