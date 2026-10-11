/**
 * After hours, the monitor sits on a game's loading spinner: the logo's outer ring turning counter-clockwise around
 * its wheel turning clockwise, on black. The two layers are cut from one image (public/game/*.webp), centred on the
 * same point, so each just spins about the middle. t is ms since the screen came on.
 */
export const GAME_LAYERS = { ring: '/game/ring.webp', wheel: '/game/wheel.webp' } as const;

export interface GameLayers { ring?: CanvasImageSource; wheel?: CanvasImageSource }

export function drawDeadlock(x: CanvasRenderingContext2D, w: number, h: number, t: number, layers: GameLayers) {
  x.fillStyle = '#000000'; x.fillRect(0, 0, w, h);
  const size = Math.min(w, h) * 0.28;
  const layer = (img: CanvasImageSource | undefined, angle: number) => {
    if (!img) return;
    x.save(); x.translate(w / 2, h / 2); x.rotate(angle);
    x.drawImage(img, -size / 2, -size / 2, size, size);
    x.restore();
  };
  layer(layers.ring, -t / 1600);
  layer(layers.wheel, t / 1100);
}
