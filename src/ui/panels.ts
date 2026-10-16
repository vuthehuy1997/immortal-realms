import { statsOf, type GameState } from '../core/gameState';
import { BASE_BREAKTHROUGH_CHANCE, canBreakthrough, hasNextRealm } from '../core/cultivation';
import type { Dialogue, DialogueAction } from '../core/dialogue';
import { ITEMS } from '../data/items';
import { REALMS } from '../data/realms';
import { ROOTS } from '../data/roots';
import { SLOT_COUNT } from '../core/inventory';
import { $, el } from './dom';
import { itemIconHtml, portraitUrl } from './skin';

export interface PanelActions { clickSlot(i: number): void; unequip(): void; toggleMeditate(): void; breakthrough(): void }

let actions: PanelActions;
let built = false;
let lastInv = '', lastChr = '';

const icon = (id: string): string => itemIconHtml(id, 40);

export function buildPanels(a: PanelActions): void {
  actions = a;
  if (built) return;
  const ui = $('ui');
  ui.insertAdjacentHTML('beforeend', `
    <div id="inv" class="panel hidden"><h3>Inventory <small>(I)</small></h3><div id="equip"></div><div class="grid" id="invgrid"></div><div id="tip">Hover an item. Click to use or equip.</div></div>
    <div id="chr" class="panel hidden"><h3>Character <small>(C)</small></h3><div id="chrbody"></div></div>
    <div id="dlg" class="panel hidden"></div>`);
  built = true;
}

export function togglePanel(id: 'inv' | 'chr'): void { $(id).classList.toggle('hidden'); lastInv = lastChr = ''; }
export function closePanels(): void { $('inv').classList.add('hidden'); $('chr').classList.add('hidden'); }
export const isPanelOpen = (id: 'inv' | 'chr'): boolean => !$(id).classList.contains('hidden');

export function refreshPanels(gs: GameState, meditating: boolean): void {
  if (isPanelOpen('inv')) {
    const key = JSON.stringify(gs.inventory);
    if (key !== lastInv) { lastInv = key; renderInventory(gs); }
  }
  if (isPanelOpen('chr')) {
    const key = JSON.stringify([gs.character, gs.progress, gs.cultivation, gs.inventory.weapon, meditating, Math.ceil(gs.hp), Math.floor(gs.mana)]);
    if (key !== lastChr) { lastChr = key; renderCharacter(gs, meditating); }
  }
}

function renderInventory(gs: GameState): void {
  const grid = $('invgrid');
  grid.innerHTML = '';
  for (let i = 0; i < SLOT_COUNT; i++) {
    const s = gs.inventory.slots[i];
    const b = el('button', 'cell'); b.dataset.slot = String(i);
    b.setAttribute('aria-label', s ? `${ITEMS[s.id]!.name} x${s.count}` : `empty slot ${i + 1}`);
    if (s) {
      b.innerHTML = icon(s.id) + (s.count > 1 ? `<span class="cnt">${s.count}</span>` : '');
      const def = ITEMS[s.id]!;
      b.onmouseenter = () => { $('tip').textContent = `${def.name} — ${def.description}`; };
      b.onclick = () => actions.clickSlot(i);
    }
    grid.appendChild(b);
  }
  const eq = $('equip');
  const w = gs.inventory.weapon;
  eq.innerHTML = '<span>Weapon:</span>';
  const cell = el('button', 'cell'); cell.id = 'weapon-slot';
  if (w) { cell.innerHTML = icon(w); cell.onclick = () => actions.unequip(); cell.title = 'Click to unequip'; }
  eq.appendChild(cell);
  eq.appendChild(el('span', '', w ? ITEMS[w]!.name : 'none'));
}

function renderCharacter(gs: GameState, meditating: boolean): void {
  const st = statsOf(gs), root = ROOTS[gs.character.root], realm = REALMS[gs.cultivation.realm]!;
  const body = $('chrbody');
  const row = (k: string, v: string | number) => `<div class="row"><span>${k}</span><span>${v}</span></div>`;
  body.innerHTML = [
    row('Name', gs.character.name), row('Root', root.name), row('Level', gs.progress.level),
    row('Realm', realm.name), row('Qi', `${Math.floor(gs.cultivation.qi)} / ${realm.qiMax}`), row('Spirit stones', gs.stones), '<hr>',
    row('HP', `${Math.ceil(gs.hp)} / ${st.maxHp}`), row('Mana', `${Math.floor(gs.mana)} / ${st.maxMana}`),
    row('Attack', st.atk), row('Defence', st.def), row('Crit', `${Math.round(st.critChance * 100)}%`), row('Mana regen', `${st.manaRegen}/s`),
    row('Kills', gs.kills),
  ].join('');
  const med = el('button', 'btn', meditating ? 'Stop meditating (M)' : 'Meditate (M)'); med.id = 'btn-meditate'; med.onclick = () => actions.toggleMeditate();
  const bt = el('button', 'btn', 'Breakthrough (B)'); bt.id = 'btn-breakthrough'; bt.disabled = !canBreakthrough(gs.cultivation); bt.onclick = () => actions.breakthrough();
  body.appendChild(med); body.appendChild(bt);
  body.appendChild(el('div', '', hasNextRealm(gs.cultivation)
    ? `Breakthrough needs full qi. Success chance ${Math.round(BASE_BREAKTHROUGH_CHANCE * 100)}%; failure loses half your qi.`
    : 'You have reached the highest realm available in this build.'));
}

export function showDialogue(d: Dialogue | null, onAction: (a: DialogueAction) => void): void {
  const box = $('dlg');
  if (!d) { box.classList.add('hidden'); box.innerHTML = ''; return; }
  box.classList.remove('hidden');
  const pic = portraitUrl(d.speaker === 'Elder Lin' ? 'elder_neutral' : 'abbot_neutral');
  box.innerHTML = `<div class="dlgrow">${pic ? `<img class="portrait" src="${pic}" alt="">` : ''}<div class="dlgtext"><div class="who">${d.speaker}</div><div class="txt">${d.text}</div></div></div>`;
  if (d.progress) box.querySelector('.dlgtext')!.insertAdjacentHTML('beforeend', `<ul>${d.progress.map((p) => `<li>${p.label}: ${p.have}/${p.need}</li>`).join('')}</ul>`);
  d.options.forEach((o, i) => {
    const b = el('button', 'btn', `${i + 1}. ${o.label}`); b.dataset.opt = String(i); b.onclick = () => onAction(o.action);
    box.appendChild(b);
  });
}
export const isDialogueOpen = (): boolean => !$('dlg').classList.contains('hidden');
