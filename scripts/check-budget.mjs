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
