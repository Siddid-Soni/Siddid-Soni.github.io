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
