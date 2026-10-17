import { MANIFEST } from '../game/assets';
import { ITEM_ICON } from '../data/icons';

export const abs = (rel: string): string => new URL(rel, document.baseURI).href;
const ui = (k: string): string => abs(MANIFEST.ui[k]!.url);

/** Publishes the art of the Xianxia UI kit as CSS custom properties (absolute URLs). */
export function installSkin(): void {
  const r = document.documentElement.style;
  const set = (name: string, key: string) => r.setProperty(name, `url("${ui(key)}")`);
  set('--img-panel', 'panel_01_ink'); set('--img-panel-jade', 'panel_01_jade'); set('--img-panel-silk', 'panel_01_silk');
  set('--img-btn', 'button_01_jade_normal'); set('--img-btn-hover', 'button_01_jade_hover'); set('--img-btn-down', 'button_01_jade_pressed');
  set('--img-btn-silk', 'button_01_silk_normal'); set('--img-btn-silk-hover', 'button_01_silk_hover');
  set('--img-bar-frame', 'bar_01_frame'); set('--img-bar-hp', 'bar_01_hp'); set('--img-bar-mp', 'bar_01_mp'); set('--img-bar-spirit', 'bar_01_spirit');
  set('--img-div-cloud', '01_divider_cloud'); set('--img-div-jade', '01_divider_jade'); set('--img-corner', '01_corner');
  set('--img-cursor', '01_cursor_sword');
  r.setProperty('--img-stone', `url("${ui('item_spirit_stone')}")`);
}

/** Inline style that draws one frame of an fx strip scaled into a square box (used for skill icons). */
export function fxIconStyle(fxKey: string, frame: number, box: number): string {
  const f = MANIFEST.fx[fxKey]!;
  const s = box / Math.max(f.fw, f.fh);
  return `background-image:url(&quot;${abs(f.url)}&quot;);background-size:${f.fw * f.frames * s}px ${f.fh * s}px;background-position:${-frame * f.fw * s}px ${(box - f.fh * s) / 2}px;background-repeat:no-repeat;width:${box}px;height:${box}px`;
}

/** `<div>` HTML for an item icon at `box` px. Returns '' for unknown items. */
export function itemIconHtml(itemId: string, box = 40): string {
  const ic = ITEM_ICON[itemId];
  if (!ic) return '';
  const url = ic.kind === 'ui' ? ui(ic.key) : abs(MANIFEST.icons[ic.key]!.url);
  return `<div class="ico" style="background-image:url(&quot;${url}&quot;);width:${box}px;height:${box}px"></div>`;
}

/** Animated CSS sprite for a manifest sheet (hero idle previews in menus). */
export function spriteAnimHtml(sheetKey: string, heightPx: number): string {
  const s = MANIFEST.sheets[sheetKey];
  if (!s) return '';
  const k = heightPx / s.fh, w = Math.round(s.fw * k);
  const dur = (s.frames / s.fps).toFixed(2);
  return `<div class="strip" style="width:${w}px;height:${heightPx}px;background-image:url(&quot;${abs(s.url)}&quot;);background-size:${w * s.frames}px ${heightPx}px;--end:${-w * s.frames}px;--n:${s.frames};--dur:${dur}s"></div>`;
}

export const portraitUrl = (key: string): string | null => (MANIFEST.portraits[key] ? abs(MANIFEST.portraits[key]!.url) : null);
export const propUrl = (key: string): string => abs(MANIFEST.props[key]!.url);
