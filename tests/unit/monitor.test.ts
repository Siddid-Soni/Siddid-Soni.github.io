import { describe, it, expect, beforeAll, vi } from 'vitest';

beforeAll(() => {
  const ctx = new Proxy({}, { get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  (globalThis as any).document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
});

const P = [
  { slug: 'a', title: 'A', summary: 's', stack: ['x'], screenshot: '/missing.webp', accent: ['#000000', '#ffffff'] as [string, string] },
  { slug: 'b', title: 'B', summary: 's', stack: ['y'], accent: ['#000000', '#ffffff'] as [string, string] },
  { slug: 'c', title: 'C', summary: 's', stack: ['z'], accent: ['#000000', '#ffffff'] as [string, string] },
];
const run = (m: { tick(t: number): boolean }, from: number, to: number) => { for (let t = from; t <= to; t += 16) m.tick(t); };

describe('monitor', () => {
  it('takes turns, holds a focused project, and carries on from it after a pause', async () => {
    const { createMonitor } = await import('../../src/scene/monitor');
    const m = createMonitor(P, { load: () => Promise.reject(new Error('none')) });
    run(m, 0, 400);
    expect(m.shown).toBe('a');
    run(m, 400, 6400);
    expect(m.shown).toBe('b'); // its turn came after 6 s
    m.focus('c');
    run(m, 6400, 20000);
    expect(m.shown).toBe('c'); // held as long as it's focused
    m.focus(null);
    run(m, 20000, 22300);
    expect(m.shown).toBe('c'); // a moment's pause
    run(m, 22300, 22900);
    expect(m.shown).toBe('a'); // then the one after it
  });

  it('switches to the after-hours game and back', async () => {
    const { createMonitor } = await import('../../src/scene/monitor');
    const m = createMonitor(P, { load: () => Promise.reject(new Error('none')) });
    run(m, 0, 400);
    m.setGame(true);
    run(m, 400, 1000);
    expect(m.shown).toBe('game');
    m.setGame(false);
    run(m, 1000, 1600);
    expect(m.shown).toBe('a');
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
