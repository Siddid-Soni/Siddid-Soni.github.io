import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('scaffold', () => {
  it('ships the custom domain', () => {
    expect(readFileSync('public/CNAME', 'utf8').trim()).toBe('siddid.me');
  });
});
