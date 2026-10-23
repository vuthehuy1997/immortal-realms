import { describe, expect, it } from 'vitest';
import { mergePads, padKeys, PAD_BUTTONS } from '../src/core/gamepad';

const pad = (axes: number[] = [0, 0], pressed: number[] = []) => ({ axes, buttons: Array.from({ length: 16 }, (_, i) => pressed.includes(i)) });

describe('gamepad mapping', () => {
  it('idle pad and stick drift inside the deadzone produce no keys', () => {
    expect(padKeys(pad()).size).toBe(0);
    expect(padKeys(pad([0.2, -0.3])).size).toBe(0);
  });
  it('stick maps to WASD, diagonals press two keys', () => {
    expect([...padKeys(pad([-1, 0]))]).toEqual(['KeyA']);
    expect([...padKeys(pad([0, 1]))]).toEqual(['KeyS']);
    expect([...padKeys(pad([0.9, -0.9]))].sort()).toEqual(['KeyD', 'KeyW']);
  });
  it('buttons map to the keyboard actions', () => {
    expect([...padKeys(pad([0, 0], [0]))]).toEqual(['Space']);
    expect([...padKeys(pad([0, 0], [1, 2]))].sort()).toEqual(['KeyE', 'ShiftLeft']);
    expect(padKeys(pad([0, 0], [9])).has('Escape')).toBe(true);
  });
  it('d-pad moves like the stick', () => {
    expect([...padKeys(pad([0, 0], [12, 15]))].sort()).toEqual(['KeyD', 'KeyW']);
  });
  it('every mapped button index is unique and a valid key code', () => {
    const codes = Object.values(PAD_BUTTONS);
    expect(new Set(codes).size).toBe(codes.length);
    for (const c of codes) expect(c).toMatch(/^(Key[A-Z]|Digit\d|Space|ShiftLeft|Tab|Escape)$/);
  });
  it('merges pads and tolerates short arrays', () => {
    expect([...mergePads([pad([-1, 0]), { axes: [], buttons: [true] }])].sort()).toEqual(['KeyA', 'Space']);
  });
});
