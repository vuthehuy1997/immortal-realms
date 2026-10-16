import { describe, expect, it } from 'vitest';
import { step } from '../src/core/movement';

describe('step', () => {
  it('does not move without input', () => {
    expect(step({ x: 1, y: 2 }, { x: 0, y: 0 }, 100, 1)).toEqual({ x: 1, y: 2 });
  });
  it('diagonal speed equals cardinal speed', () => {
    const p = step({ x: 0, y: 0 }, { x: 1, y: 1 }, 100, 1);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(100);
  });
});
