import { BOONS } from '../data/boons';
import { el } from './dom';

let open = false;
let teardown: (() => void) | null = null;
export const isBoonPickerOpen = (): boolean => open;
export function closeBoonPicker(): void { teardown?.(); }

export interface PickerOpts {
  choices: string[]; left: number; owned: readonly string[];
  /** reroll costs `cost` stones; `stones` is what the hero holds */
  reroll: { cost: number; stones: number; onReroll(): void };
  onPick(id: string): void;
}

/** Pick-one-of-three overlay. Keys 1-3 or a click choose, R rerolls for stones; there is no skip (the pick stays banked if the page is closed). */
export function showBoonPicker(o: PickerOpts): void {
  closeBoonPicker();
  const root = el('div', 'boonpick'); root.id = 'boonpick';
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Choose a boon');
  const close = () => { if (!open) return; open = false; teardown = null; window.removeEventListener('keydown', onKey, true); root.remove(); };
  const canReroll = o.reroll.stones >= o.reroll.cost;
  const doReroll = () => { if (!canReroll) return; close(); o.reroll.onReroll(); };
  const onKey = (e: KeyboardEvent) => {
    const i = ['1', '2', '3'].indexOf(e.key);
    if (i >= 0 && o.choices[i]) { e.preventDefault(); e.stopPropagation(); close(); o.onPick(o.choices[i]!); }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); e.stopPropagation(); doReroll(); }
  };
  const ownedText = o.owned.length ? `Owned: ${o.owned.map((id) => BOONS[id]?.name ?? id).join(', ')}` : 'No boons yet';
  root.innerHTML = `<div class="boonbox"><div class="chap">A path opens</div><h2>Choose a boon</h2><div class="boonrow"></div>
    <div class="boonfoot"><button class="btn" id="boon-reroll"${canReroll ? '' : ' disabled'}>Reroll (R) · ${o.reroll.cost} ◆</button>
    <span class="boonleft">${o.left > 1 ? `${o.left - 1} more pick${o.left > 2 ? 's' : ''} waiting · ` : ''}Press 1–3 or click</span></div>
    <div class="boonowned">${ownedText}</div></div>`;
  const row = root.querySelector('.boonrow') as HTMLElement;
  o.choices.forEach((id, i) => {
    const b = BOONS[id]!;
    const c = el('button', `boon ${b.rarity}`); c.dataset.boon = id;
    c.innerHTML = `<small>${i + 1} · ${b.rarity}</small><b>${b.name}</b><span>${b.desc}</span>`;
    c.onclick = () => { close(); o.onPick(id); };
    row.appendChild(c);
  });
  (root.querySelector('#boon-reroll') as HTMLButtonElement).onclick = doReroll;
  open = true; teardown = close;
  window.addEventListener('keydown', onKey, true);
  document.getElementById('ui')!.appendChild(root);
  (row.firstElementChild as HTMLElement | null)?.focus();
}
