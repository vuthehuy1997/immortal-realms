/**
 * Gamepad -> virtual key mapping (standard layout). Pure: takes a plain snapshot, returns the KeyboardEvent.code values
 * that should count as held, so the game reuses its keyboard handlers for controllers.
 */
export interface PadSnapshot { axes: readonly number[]; buttons: readonly boolean[] }

export const PAD_DEADZONE = 0.4;

/** Button index -> key code (standard mapping: 0=A 1=B 2=X 3=Y 4/5=LB/RB 6/7=LT/RT 8=Back 9=Start 10/11=stick clicks). */
export const PAD_BUTTONS: Record<number, string> = {
  0: 'Space', 1: 'ShiftLeft', 2: 'KeyE', 3: 'KeyM',
  4: 'Digit1', 5: 'Digit2', 6: 'Digit3', 7: 'Digit4',
  8: 'Tab', 9: 'Escape', 10: 'KeyI', 11: 'KeyC', 12: 'KeyW', 13: 'KeyS', 14: 'KeyA', 15: 'KeyD',
};

export function padKeys(p: PadSnapshot, deadzone = PAD_DEADZONE): Set<string> {
  const keys = new Set<string>();
  p.buttons.forEach((down, i) => { const k = PAD_BUTTONS[i]; if (down && k) keys.add(k); });
  const x = p.axes[0] ?? 0, y = p.axes[1] ?? 0;
  if (Math.hypot(x, y) >= deadzone) {
    if (x <= -deadzone) keys.add('KeyA'); else if (x >= deadzone) keys.add('KeyD');
    if (y <= -deadzone) keys.add('KeyW'); else if (y >= deadzone) keys.add('KeyS');
  }
  return keys;
}

/** Merge several connected pads (any pad may drive the hero). */
export function mergePads(pads: readonly PadSnapshot[]): Set<string> {
  const all = new Set<string>();
  for (const p of pads) for (const k of padKeys(p)) all.add(k);
  return all;
}
