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
