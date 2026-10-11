import * as THREE from 'three';

export function canvasTexture(w: number, h: number, draw: (x: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function sunCanvas(s: number) {
  const c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, '#ffe66b'); g.addColorStop(0.5, '#ff8a3d'); g.addColorStop(1, '#ff2a8a');
  x.fillStyle = g; x.beginPath(); x.arc(s / 2, s / 2, s / 2, 0, 7); x.fill();
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 8; i++) x.fillRect(0, s * 0.55 + i * s * 0.06, s, s * 0.008 + i * s * 0.005);
  return c;
}

export function synthWindowTexture() {
  return canvasTexture(440, 320, (x, w, h) => {
    const hy = h * 0.66;
    const g = x.createLinearGradient(0, 0, 0, hy);
    g.addColorStop(0, '#0e0228'); g.addColorStop(0.6, '#5a0f6e'); g.addColorStop(1, '#ff2a8a');
    x.fillStyle = g; x.fillRect(0, 0, w, hy);
    x.save(); x.beginPath(); x.rect(0, 0, w, hy); x.clip(); x.drawImage(sunCanvas(190), w / 2 - 95, hy - 150); x.restore();
    x.fillStyle = '#2a0845'; x.beginPath(); x.moveTo(0, hy);
    for (let X = 0; X <= w; X += 16) { const e = Math.abs(X - w / 2) / (w / 2); x.lineTo(X, hy - (Math.sin(X * 0.13) * 0.5 + 0.5) * 46 * e * e); }
    x.lineTo(w, hy); x.fill();
    x.fillStyle = '#14002a'; x.fillRect(0, hy, w, h - hy);
    x.strokeStyle = '#ff2ad4'; x.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const y = hy + Math.pow(i / 8, 2) * (h - hy); x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
    for (let i = -12; i <= 12; i++) { x.beginPath(); x.moveTo(w / 2 + i * 9, hy); x.lineTo(w / 2 + i * 80, h); x.stroke(); }
  });
}

/** Day sky for the window: a soft vertical gradient with a few low-poly clouds. It's multiplied by the keyframe sky colour,
 *  so the sky sits a little darker than the clouds at every time of day. */
export function skyTexture() {
  return canvasTexture(256, 192, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#c4c4c4'); g.addColorStop(1, '#f2f2f2');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = '#ffffff';
    const cloud = (cx: number, cy: number, s: number) => {
      x.beginPath();
      x.moveTo(cx - 34 * s, cy);
      x.lineTo(cx - 22 * s, cy - 12 * s); x.lineTo(cx - 8 * s, cy - 14 * s); x.lineTo(cx + 2 * s, cy - 24 * s);
      x.lineTo(cx + 18 * s, cy - 18 * s); x.lineTo(cx + 26 * s, cy - 8 * s); x.lineTo(cx + 36 * s, cy);
      x.closePath(); x.fill();
    };
    cloud(70, 70, 1.1); cloud(190, 52, 0.8); cloud(150, 128, 0.6);
  });
}

/** A few curling wisps for the coffee steam; drawn white on transparent and faded by material opacity. */
export function steamTexture() {
  return canvasTexture(64, 128, (x, w, h) => {
    x.lineCap = 'round';
    for (const [ox, ph, lw] of [[22, 0, 5], [34, 1.8, 4], [44, 3.6, 3]]) {
      for (let y = h - 8; y > 10; y -= 2) {
        const t = 1 - y / h;
        x.strokeStyle = `rgba(255,255,255,${(Math.sin(t * Math.PI) * 0.55).toFixed(3)})`;
        x.lineWidth = lw * (1 - t * 0.5);
        const X = ox + Math.sin(t * 7 + ph) * 7 * t;
        x.beginPath(); x.moveTo(X, y); x.lineTo(ox + Math.sin((1 - (y - 2) / h) * 7 + ph) * 7 * t, y - 2); x.stroke();
      }
    }
  });
}

/** Soft round sprite for the dust motes in the sunbeam. */
export function moteTexture() {
  return canvasTexture(32, 32, (x) => {
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  });
}

/** A book spine: the language name reading top to bottom, between two bands. */
/** Shading for a plain book's spine (multiplied by its colour): darker towards the rounded edges, with two bands. */
export function bookShadeTexture() {
  return canvasTexture(32, 128, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#9a9a9a'); g.addColorStop(0.25, '#f4f4f4'); g.addColorStop(0.6, '#ffffff'); g.addColorStop(1, '#8c8c8c');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, 12, w, 4); x.fillRect(0, h - 16, w, 4);
  });
}

export function spineTexture(name: string, color: string, ink: string, icon?: string) {
  return canvasTexture(96, 320, (x, w, h) => {
    x.fillStyle = color; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(0, 22, w, 7); x.fillRect(0, h - 29, w, 7);
    x.fillStyle = ink; x.globalAlpha = 0.55; x.fillRect(0, 32, w, 2); x.fillRect(0, h - 34, w, 2); x.globalAlpha = 1;
    // Rounded spine: shade towards both edges.
    const edge = x.createLinearGradient(0, 0, w, 0);
    edge.addColorStop(0, 'rgba(0,0,0,0.35)'); edge.addColorStop(0.22, 'rgba(0,0,0,0)'); edge.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    edge.addColorStop(0.78, 'rgba(0,0,0,0)'); edge.addColorStop(1, 'rgba(0,0,0,0.38)');
    x.fillStyle = edge; x.fillRect(0, 0, w, h);
    // The logo stands upright near the foot of the spine, like a publisher's mark; the title runs down above it.
    const logo = icon && typeof Path2D !== 'undefined' ? 44 : 0;
    if (logo) {
      x.save(); x.translate((w - logo) / 2, h - 44 - logo); x.scale(logo / 24, logo / 24);
      x.fillStyle = ink; x.fill(new Path2D(icon)); x.restore();
    }
    const top = 34, bottom = h - 34 - (logo ? logo + 18 : 0);
    x.save();
    x.translate(w / 2, (top + bottom) / 2); x.rotate(Math.PI / 2);
    let size = 46;
    x.font = `800 ${size}px "Inter Tight", sans-serif`;
    const fit = bottom - top - 28, width = x.measureText(name)?.width ?? 0;
    if (width > fit) { size = Math.floor((size * fit) / width); x.font = `800 ${size}px "Inter Tight", sans-serif`; }
    x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(name, 0, 2);
    x.restore();
  });
}

/** The synth's little screen: a glowing waveform, tinted by the material colour. */
export function waveTexture() {
  return canvasTexture(150, 60, (x, w, h) => {
    x.fillStyle = '#0c1410'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.beginPath();
    for (let X = 0; X <= w; X += 2) { const y = h / 2 + Math.sin(X / 9) * h * 0.28 * Math.sin((X / w) * Math.PI); X ? x.lineTo(X, y) : x.moveTo(X, y); }
    x.stroke();
  });
}

export function posterTexture() {
  return canvasTexture(128, 180, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 180);
    g.addColorStop(0, '#ff6ad5'); g.addColorStop(1, '#ffd36a');
    x.fillStyle = g; x.fillRect(0, 0, 128, 180);
    x.fillStyle = '#1a1030'; x.font = 'bold 22px sans-serif';
    x.fillText('SAY', 36, 80); x.fillText('HELLO', 24, 108);
  });
}

export function drawCodeScreen(x: CanvasRenderingContext2D, w: number, h: number) {
  x.globalAlpha = 1;
  x.fillStyle = '#0b1020'; x.fillRect(0, 0, w, h);
  const cols = ['#ff79c6', '#8be9fd', '#50fa7b', '#f1fa8c', '#bd93f9'];
  for (let i = 0; i < 16; i++) {
    let X = 24 + (i % 4) * 20;
    for (let j = 0; j < 3; j++) {
      const bw = 20 + ((i * 37 + j * 53) % 90);
      x.fillStyle = cols[(i + j) % 5]; x.fillRect(X, 20 + i * 22, bw, 10); X += bw + 14;
    }
  }
}
