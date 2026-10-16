import type { Vec2 } from './movement';

/** Impulse of `strength` px along `dir` (decays exponentially). Returns the new velocity. */
export function impulse(dir: Vec2, strength: number): Vec2 {
  const l = Math.hypot(dir.x, dir.y) || 1;
  return { x: (dir.x / l) * strength * 6, y: (dir.y / l) * strength * 6 };
}

/** Advances knockback velocity: returns the displacement this tick and the decayed velocity. */
export function stepKnockback(vel: Vec2, dt: number): { move: Vec2; vel: Vec2 } {
  const k = Math.exp(-9 * dt);
  const v = { x: vel.x * k, y: vel.y * k };
  const speed = Math.hypot(v.x, v.y);
  return { move: { x: vel.x * dt, y: vel.y * dt }, vel: speed < 4 ? { x: 0, y: 0 } : v };
}
