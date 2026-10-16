export interface Vec2 { x: number; y: number }

/** Normalised movement step; diagonal speed equals cardinal speed. */
export function step(pos: Vec2, dir: Vec2, speed: number, dtSec: number): Vec2 {
  const len = Math.hypot(dir.x, dir.y);
  if (len === 0) return { ...pos };
  return { x: pos.x + (dir.x / len) * speed * dtSec, y: pos.y + (dir.y / len) * speed * dtSec };
}
