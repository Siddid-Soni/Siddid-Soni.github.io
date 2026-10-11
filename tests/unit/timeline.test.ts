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
    expect(s.position[0]).toBeCloseTo((KEYFRAMES[0].position[0] + KEYFRAMES[1].position[0]) / 2);
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
  it('with a ramp, holds each section and moves only over the last ramp px', () => {
    expect(progressFromSections(1500, tops, 5000, 400)).toBe(1); // 2200 - 400 = 1800: still holding
    expect(progressFromSections(1800, tops, 5000, 400)).toBe(1);
    expect(progressFromSections(2000, tops, 5000, 400)).toBeCloseTo(1.5);
    expect(progressFromSections(2200, tops, 5000, 400)).toBeCloseTo(2);
    expect(progressFromSections(2800, tops, 5000, 5000)).toBeCloseTo(2.75); // a ramp longer than the span is linear
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
  it('phone: no shift, subject centred in the room card', () => {
    const o = frameOffset(0.2, 390, 844);
    expect(o.x).toBe(0);
    expect(o.y).toBe(0);
    expect(frameOffset(0, 390, 844, -0.1).y).toBeCloseTo(-0.1 * 844);
    expect(frameOffset(0, 1440, 900, -0.1).y).toBe(0); // phone-only
  });
});

describe('createFrameSampler (low-power check)', () => {
  it('ignores pauses between bursts of animation', async () => {
    const { createFrameSampler } = await import('../../src/scene/timeline');
    const sample = createFrameSampler(59);
    let t = 0, avg: number | null = null;
    for (let i = 0; i < 30; i++) avg = sample((t += 16.7)) ?? avg; // parallax settles
    t += 3000; // visitor stops to read
    for (let i = 0; i < 31 && avg == null; i++) avg = sample((t += 16.7)) ?? avg;
    expect(avg).not.toBeNull();
    expect(avg!).toBeLessThan(1000 / 24);
  });
  it('reports a slow device', async () => {
    const { createFrameSampler } = await import('../../src/scene/timeline');
    const sample = createFrameSampler(59);
    let t = 0, avg: number | null = null;
    for (let i = 0; i < 60; i++) avg = sample((t += 50)) ?? avg;
    expect(avg).toBeCloseTo(50);
  });
  it('reports only once', async () => {
    const { createFrameSampler } = await import('../../src/scene/timeline');
    const sample = createFrameSampler(2);
    expect([sample(0), sample(16), sample(32), sample(48)]).toEqual([null, null, 16, null]);
  });
});
