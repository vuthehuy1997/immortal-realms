export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

const cache = new WeakMap<HTMLElement, string>();
/** Writes textContent only when it changed (HUD runs every frame). */
export function setText(e: HTMLElement, v: string): void {
  if (cache.get(e) !== v) { cache.set(e, v); e.textContent = v; }
}
export function setWidth(e: HTMLElement, pct: number): void {
  const v = `${Math.max(0, Math.min(100, pct)).toFixed(1)}%`;
  if (cache.get(e) !== v) { cache.set(e, v); e.style.width = v; }
}

/** Fills a skinned bar by clipping its (full) image; the art has ~3% caps on each side. */
export function setFill(e: HTMLElement, pct: number): void {
  const p = Math.max(0, Math.min(100, pct)) / 100;
  const v = `inset(0 ${(3 + 94 * (1 - p)).toFixed(1)}% 0 0)`;
  if (cache.get(e) !== v) { cache.set(e, v); e.style.clipPath = v; }
}
