import { padKeys } from '../core/gamepad';
import type { KeyInput } from '../game/input';
import { $, el } from './dom';

/** True on phones/tablets (coarse primary pointer) or when forced with ?touch=1 (used by tests). */
export function wantsTouchControls(): boolean {
  try { if (new URLSearchParams(location.search).get('touch') === '1') return true; } catch { /* ignore */ }
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
}

const BUTTONS: { id: string; label: string; code: string; cls?: string }[] = [
  { id: 'tc-attack', label: '⚔', code: 'Space', cls: 'big' },
  { id: 'tc-dash', label: 'Dash', code: 'ShiftLeft' },
  { id: 'tc-interact', label: 'Talk', code: 'KeyE' },
  { id: 'tc-meditate', label: 'Qi', code: 'KeyM' },
  { id: 'tc-bag', label: 'Bag', code: 'KeyI' },
  { id: 'tc-quest', label: 'Quest', code: 'KeyJ' },
  { id: 'tc-map', label: 'Map', code: 'Tab' },
  { id: 'tc-menu', label: '☰', code: 'Escape' },
];
/** Existing skill-bar slots become tappable. */
const SLOT_KEYS: Record<string, string> = { slot0: 'Digit1', slot1: 'Digit2', slot2: 'Digit3', slot3: 'Digit4', 'pot-hp': 'KeyF', 'pot-mp': 'KeyG' };
const STICK_RADIUS = 56;

/** Builds the joystick and buttons, feeding the same KeyInput as the keyboard. Returns a disposer. */
export function mountTouchControls(kb: KeyInput): () => void {
  const root = el('div', 'touchctl'); root.id = 'touchctl';
  const stick = el('div', 'tc-stick'); stick.id = 'tc-stick'; const nub = el('i'); stick.appendChild(nub);
  const pad = el('div', 'tc-btns');
  root.append(stick, pad);
  $('hudlayer').appendChild(root);
  document.body.classList.add('touch');

  let moveKeys = new Set<string>(); let stickId = -1; let ox = 0, oy = 0;
  const applyStick = (dx: number, dy: number) => {
    const len = Math.hypot(dx, dy) || 1, k = Math.min(1, len / STICK_RADIUS);
    nub.style.transform = `translate(${(dx / len) * k * STICK_RADIUS}px, ${(dy / len) * k * STICK_RADIUS}px)`;
    const next = padKeys({ axes: [(dx / len) * k, (dy / len) * k], buttons: [] });
    for (const c of moveKeys) if (!next.has(c)) kb.setTouch(c, false);
    for (const c of next) kb.setTouch(c, true);
    moveKeys = next;
  };
  const endStick = () => { stickId = -1; applyStick(0, 0); nub.style.transform = ''; };
  stick.addEventListener('pointerdown', (e) => { stickId = e.pointerId; stick.setPointerCapture(e.pointerId); const r = stick.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2; applyStick(e.clientX - ox, e.clientY - oy); e.preventDefault(); });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId === stickId) applyStick(e.clientX - ox, e.clientY - oy); });
  stick.addEventListener('pointerup', (e) => { if (e.pointerId === stickId) endStick(); });
  stick.addEventListener('pointercancel', endStick);

  const hold = (target: HTMLElement, code: string) => {
    target.addEventListener('pointerdown', (e) => { target.setPointerCapture(e.pointerId); kb.setTouch(code, true); e.preventDefault(); e.stopPropagation(); });
    const up = () => kb.setTouch(code, false);
    target.addEventListener('pointerup', up); target.addEventListener('pointercancel', up);
  };
  for (const b of BUTTONS) { const n = el('button', `tc-btn ${b.cls ?? ''}`, b.label); n.id = b.id; hold(n, b.code); pad.appendChild(n); }
  for (const [id, code] of Object.entries(SLOT_KEYS)) { const n = document.getElementById(id); if (n) hold(n, code); }

  return () => { root.remove(); document.body.classList.remove('touch'); endStick(); };
}
