import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { SITE, SECTIONS } from '../../src/config';

describe('content', () => {
  it('has six sections in storyboard order', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(['hero', 'about', 'projects', 'skills', 'after-hours', 'contact']);
    expect(SECTIONS.map((s) => s.time)).toEqual(['07:30', '09:00', '13:00', '18:30', '23:00', '00:00']);
  });
  it('has 6–14 skills grouped by area', () => {
    const n = SITE.skills.flatMap((g) => g.items).length;
    expect(n).toBeGreaterThanOrEqual(6);
    expect(n).toBeLessThanOrEqual(14);
  });
  it('features at most 4 projects', () => {
    const featured = readdirSync('src/content/projects')
      .map((f) => readFileSync(`src/content/projects/${f}`, 'utf8'))
      .filter((s) => /^featured:\s*true/m.test(s));
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.length).toBeLessThanOrEqual(4);
  });
});
