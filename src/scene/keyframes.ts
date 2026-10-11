export type Vec3 = [number, number, number];

export interface Lighting {
  background: string; sky: string; hemiSky: string; hemiGround: string;
  hemiIntensity: number; sunColor: string; sunIntensity: number; lamp: number; night: number; beam: number;
  /** Where the sun sits (the directional light aims at the origin): it rises low, peaks at noon and rakes in at dusk. */
  sun: Vec3;
}

export interface Keyframe {
  position: Vec3; lookAt: Vec3; viewOffset: number; lighting: Lighting; minutes: number;
  /** Phone-only framing: nudge the subject down (−) or up (+) as a fraction of screen height, and zoom in. */
  phone?: { shift?: number; zoom?: number };
}

const L = (background: string, sky: string, hemiSky: string, hemiGround: string, hemiIntensity: number,
  sunColor: string, sunIntensity: number, lamp: number, night: number, beam = 0, sun: Vec3 = [7, 10, 6]): Lighting =>
  ({ background, sky, hemiSky, hemiGround, hemiIntensity, sunColor, sunIntensity, lamp, night, beam, sun });

export const KEYFRAMES: Keyframe[] = [
  { position: [12, 9.5, 12],     lookAt: [-0.5, 1.3, -0.5], viewOffset: 0.2,  minutes: 450, phone: { zoom: 1.65 },
    lighting: L('#f3e6d6', '#ffd9a8', '#fff6ea', '#d8c2a8', 1.9,  '#ffe2b8', 2.1,  0,   0, 1, [9, 6.5, 7.5]) },
  { position: [2.4, 2.9, -0.6],  lookAt: [-0.3, 2, -3], viewOffset: -0.2, minutes: 540,
    lighting: L('#f6ecdf', '#cfeaff', '#ffffff', '#d4c0a4', 1.5,  '#ffe6c4', 2.4,  0,   0, 0.35, [8, 8.5, 6.5]) },
  { position: [-1.15, 2.7, 0.1], lookAt: [-1.4, 2.35, -3.5], viewOffset: 0.2, minutes: 780, phone: { zoom: 1.5, shift: 0.03 },
    lighting: L('#e3eef8', '#a8dcff', '#ffffff', '#c4ccd4', 1.5,  '#ffffff', 2.3,  0,   0, 0, [3, 12, 5]) },
  { position: [2, 3, 3],         lookAt: [-3.6, 1.9, 0.8],  viewOffset: -0.2, minutes: 1110,
    lighting: L('#2a1420', '#ffa45c', '#ffc69a', '#5a2c34', 1.05, '#ff9a4a', 3.2,  0.7, 0.12, 0, [10, 3.4, 3.5]) },
  { position: [3.6, 2.9, 2.6],   lookAt: [0.3, 2.05, -4],   viewOffset: 0.26, minutes: 1380,
    lighting: L('#0c0820', '#1a0533', '#5a48b0', '#120a24', 0.3,  '#6a5cff', 0.2,  0.5, 1, 0, [-3, 10, 8]) },
  { position: [13, 9.4, 13],     lookAt: [-0.5, 0.7, -0.5], viewOffset: 0,    minutes: 1440, phone: { shift: -0.02, zoom: 1.6 },
    lighting: L('#07051a', '#1a0533', '#4a3a9a', '#0a0618', 0.26, '#6a5cff', 0.18, 0.5, 1, 0, [-3, 10, 8]) },
];
