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

  it('titles a book per language and slides the focused one out', async () => {
    const { buildRoom } = await import('../../src/scene/room');
    const books = [{ name: 'Rust', color: '#b7410e', ink: '#ffffff' }, { name: 'Lua', color: '#1f2a6b', ink: '#ffffff' }];
    const room = buildRoom({ books });
    const titled = room.shelf.children.filter((o) => o.userData.book) as THREE.Mesh[];
    expect(titled).toHaveLength(2);
    const x0 = titled.map((m) => m.position.x);
    room.focusBook('Rust');
    expect(room.tickBooks(1 / 60)).toBe(true);
    for (let i = 0; i < 200 && room.tickBooks(1 / 60); i++);
    expect(room.tickBooks(1 / 60)).toBe(false);
    expect(titled[0].position.x).toBeGreaterThan(x0[0]);
    expect(titled[1].position.x).toBe(x0[1]);
    room.focusBook(null);
    for (let i = 0; i < 200 && room.tickBooks(1 / 60); i++);
    expect(titled[0].position.x).toBeCloseTo(x0[0]);
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
