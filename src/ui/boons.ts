import { BOONS } from '../data/boons';
import { el } from './dom';

let open = false;
export const isBoonPickerOpen = (): boolean => open;

/** Pick-one-of-three overlay. Keys 1-3 or a click choose; there is no skip (the pick stays banked if the page is closed). */
export function showBoonPicker(choices: string[], left: number, onPick: (id: string) => void): void {
  document.getElementById('boonpick')?.remove();
  const root = el('div', 'boonpick'); root.id = 'boonpick';
  const finish = (id: string) => { if (!open) return; open = false; window.removeEventListener('keydown', onKey, true); root.remove(); onPick(id); };
  const onKey = (e: KeyboardEvent) => {
    const i = ['1', '2', '3'].indexOf(e.key);
    if (i >= 0 && choices[i]) { e.preventDefault(); e.stopPropagation(); finish(choices[i]!); }
  };
  root.innerHTML = `<div class="boonbox"><div class="chap">A path opens</div><h2>Choose a boon</h2><div class="boonrow"></div><div class="boonleft">${left > 1 ? `${left - 1} more pick${left > 2 ? 's' : ''} waiting` : 'Press 1–3 or click'}</div></div>`;
  const row = root.querySelector('.boonrow') as HTMLElement;
  choices.forEach((id, i) => {
    const b = BOONS[id]!;
    const c = el('button', `boon ${b.rarity}`); c.dataset.boon = id;
    c.innerHTML = `<small>${i + 1} · ${b.rarity}</small><b>${b.name}</b><span>${b.desc}</span>`;
    c.onclick = () => finish(id);
    row.appendChild(c);
  });
  open = true;
  window.addEventListener('keydown', onKey, true);
  document.getElementById('ui')!.appendChild(root);
  (row.firstElementChild as HTMLElement | null)?.focus();
}
