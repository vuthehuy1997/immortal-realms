import { mergePads } from '../core/gamepad';
/**
 * Keyboard input via plain DOM events.
 * Phaser 4.2.1 re-emits queued key events when several arrive within one frame (observed: one tap of `I` fired the
 * handler twice), which double-toggled panels. One-shot actions here fire exactly once per physical press
 * (up -> down transition, auto-repeat ignored) and `isDown` serves held keys such as movement.
 */
export class KeyInput {
  private down = new Set<string>();
  private virt = new Set<string>(); // keys held by a gamepad
  private handlers = new Map<string, (() => void)[]>();

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  isDown(...codes: string[]): boolean { return codes.some((c) => this.down.has(c) || this.virt.has(c)); }

  /** Poll connected gamepads once per frame; new presses fire the same one-shot handlers as the keyboard. */
  pollGamepads(): void {
    const pads = typeof navigator.getGamepads === 'function' ? [...navigator.getGamepads()].filter((g): g is Gamepad => !!g && g.connected) : [];
    const now = mergePads(pads.map((g) => ({ axes: g.axes, buttons: g.buttons.map((b) => b.pressed) })));
    for (const c of now) if (!this.virt.has(c)) for (const fn of this.handlers.get(c) ?? []) fn();
    this.virt = now;
  }

  /** Register a one-shot handler for one or more key codes (KeyboardEvent.code). */
  onPress(codes: string | string[], fn: () => void): void {
    for (const c of Array.isArray(codes) ? codes : [codes]) {
      const list = this.handlers.get(c) ?? [];
      list.push(fn); this.handlers.set(c, list);
    }
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.down.clear(); this.virt.clear(); this.handlers.clear();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && (t as HTMLInputElement).type !== 'range'))) return;
    if (this.handlers.has(e.code) || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (e.repeat || this.down.has(e.code)) return;
    this.down.add(e.code);
    for (const fn of this.handlers.get(e.code) ?? []) fn();
  };
  private onKeyUp = (e: KeyboardEvent): void => { this.down.delete(e.code); };
  private onBlur = (): void => { this.down.clear(); };
}
