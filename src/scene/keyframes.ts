export type Vec3 = [number, number, number];

export interface Lighting {
  background: string; sky: string; hemiSky: string; hemiGround: string;
  hemiIntensity: number; sunColor: string; sunIntensity: number; lamp: number; night: number;
}

export interface Keyframe { position: Vec3; lookAt: Vec3; viewOffset: number; lighting: Lighting; minutes: number }

const L = (background: string, sky: string, hemiSky: string, hemiGround: string, hemiIntensity: number,
  sunColor: string, sunIntensity: number, lamp: number, night: number): Lighting =>
  ({ background, sky, hemiSky, hemiGround, hemiIntensity, sunColor, sunIntensity, lamp, night });

export const KEYFRAMES: Keyframe[] = [
  { position: [12, 9.5, 12],     lookAt: [-0.5, 1.3, -0.5], viewOffset: 0.2,  minutes: 450,
    lighting: L('#f3e6d6', '#ffd9a8', '#fff1de', '#c9a27a', 0.8,  '#ffd2a1', 0.9,  0,   0) },
  { position: [1.4, 2.35, -1.6], lookAt: [0.1, 1.75, -2.8], viewOffset: -0.2, minutes: 540,
    lighting: L('#f6ecdf', '#bfe3ff', '#ffffff', '#c9b8a0', 0.85, '#fff1dc', 1.0,  0,   0) },
  { position: [-1.15, 2.7, 0.1], lookAt: [-1.4, 2.35, -3.5], viewOffset: 0.2, minutes: 780,
    lighting: L('#e3eef8', '#8fd0ff', '#ffffff', '#b8c4d0', 0.95, '#ffffff', 1.05, 0,   0) },
  { position: [-0.6, 2.3, 1.9],  lookAt: [-3.6, 1.9, 0.5],  viewOffset: -0.2, minutes: 1110,
    lighting: L('#3a1f3d', '#ff9a5a', '#ffb37a', '#5a2a3a', 0.6,  '#ff8a4c', 1.0,  0.6, 0.15) },
  { position: [3.1, 2.5, 1.4],   lookAt: [1.3, 3, -4],      viewOffset: 0.22, minutes: 1380,
    lighting: L('#0c0820', '#1a0533', '#5a48b0', '#120a24', 0.3,  '#6a5cff', 0.2,  0.5, 1) },
  { position: [11, 8.2, 11],     lookAt: [-0.5, 2, -0.5],   viewOffset: 0,    minutes: 1440,
    lighting: L('#07051a', '#1a0533', '#4a3a9a', '#0a0618', 0.26, '#6a5cff', 0.18, 0.5, 1) },
];
