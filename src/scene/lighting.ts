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
