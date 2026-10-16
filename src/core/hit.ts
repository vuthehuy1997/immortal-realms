import type { Vec2 } from './movement';

export const normalize = (v: Vec2): Vec2 => {
  const l = Math.hypot(v.x, v.y);
  return l === 0 ? { x: 1, y: 0 } : { x: v.x / l, y: v.y / l };
};

/** True if target (circle radius tr) intersects a circle sector from origin along aim. */
export function inArc(origin: Vec2, aim: Vec2, range: number, halfAngleRad: number, target: Vec2, tr = 0): boolean {
  const dx = target.x - origin.x, dy = target.y - origin.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range + tr) return false;
  if (dist <= tr) return true;
  const a = normalize(aim);
  const cos = (dx * a.x + dy * a.y) / dist;
  const slack = Math.asin(Math.min(1, tr / dist)); // widen by target size
  return Math.acos(Math.max(-1, Math.min(1, cos))) <= halfAngleRad + slack;
}

export function inCircle(origin: Vec2, radius: number, target: Vec2, tr = 0): boolean {
  return Math.hypot(target.x - origin.x, target.y - origin.y) <= radius + tr;
}

export interface Projectile { pos: Vec2; vel: Vec2; traveled: number; maxDist: number }

/** Advances a projectile; returns false once it has exhausted its range. */
export function stepProjectile(p: Projectile, dt: number): boolean {
  p.pos = { x: p.pos.x + p.vel.x * dt, y: p.pos.y + p.vel.y * dt };
  p.traveled += Math.hypot(p.vel.x, p.vel.y) * dt;
  return p.traveled < p.maxDist;
}
