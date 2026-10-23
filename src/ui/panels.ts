import { BOONS } from '../data/boons';
import { HEROES } from '../data/heroes';
import { statsOf, type GameState } from '../core/gameState';
import { BASE_BREAKTHROUGH_CHANCE, canBreakthrough, hasNextRealm, nextRealmLevel } from '../core/cultivation';
import type { Dialogue, DialogueAction } from '../core/dialogue';
import { ITEMS, RARITY_COLOR } from '../data/items';
import { REALMS } from '../data/realms';
import { ROOTS } from '../data/roots';
import { countOf, SLOT_COUNT, type EquipKey } from '../core/inventory';
import { SKILLS } from '../data/skills';
import { freePoints, SKILL_MAX, scaledSkill, skillLevel } from '../core/skills';
import { progressOf } from '../core/quest';
import { QUESTS, questsOfChapter } from '../data/quests';
import { CHAPTERS, CHAPTER_IDS } from '../data/chapters';
import { $, el } from './dom';
import { itemIconHtml, portraitUrl } from './skin';

export interface PanelActions { clickSlot(i: number): void; unequip(key: EquipKey): void; upgradeSkill(id: string): void; toggleMeditate(): void; breakthrough(): void }

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
    <div id="qlog" class="panel hidden"><h3>Quest Journal <small>(J)</small></h3><div id="qlogbody"></div></div>
    <div id="chr" class="panel hidden"><h3>Character <small>(C)</small></h3><div id="chrbody"></div></div>
    <div id="dlg" class="panel hidden"></div>`);
  built = true;
}

export function togglePanel(id: 'inv' | 'chr' | 'qlog'): void { $(id).classList.toggle('hidden'); lastInv = lastChr = ''; }
export function closePanels(): void { $('inv').classList.add('hidden'); $('chr').classList.add('hidden'); $('qlog').classList.add('hidden'); }
export const isPanelOpen = (id: 'inv' | 'chr' | 'qlog'): boolean => !$(id).classList.contains('hidden');

export function refreshPanels(gs: GameState, meditating: boolean): void {
  if (isPanelOpen('qlog')) renderQuestLog(gs);
  if (isPanelOpen('inv')) {
    const key = JSON.stringify(gs.inventory);
    if (key !== lastInv) { lastInv = key; renderInventory(gs); }
  }
  if (isPanelOpen('chr')) {
    const key = JSON.stringify([gs.character, gs.progress, gs.cultivation, gs.inventory, gs.skills, gs.stones, meditating, Math.ceil(gs.hp), Math.floor(gs.mana)]);
    if (key !== lastChr) { lastChr = key; renderCharacter(gs, meditating); }
  }
}

const QSTATUS: Record<string, string> = { inactive: 'Not started', active: 'In progress', turnedIn: 'Completed' };
function renderQuestLog(gs: GameState): void {
  const key = JSON.stringify([gs.quests, gs.bosses, gs.inventory.slots, gs.chapter]);
  const body = $('qlogbody');
  if (body.dataset.key === key) return; body.dataset.key = key;
  const entry = (q: (typeof QUESTS)[string]): string => {
    const st = gs.quests[q.id]!;
    const locked = st.status === 'inactive' && q.requires && gs.quests[q.requires]?.status !== 'turnedIn';
    const prog = st.status === 'active' ? progressOf(q, st, gs.inventory, gs.bosses) : [];
    const rewards = [`${q.reward.xp} XP`, ...q.reward.items.map((r) => `${r.count}× ${ITEMS[r.id]!.name}`)].join(', ');
    return `<div class="qentry ${st.status}"><div class="qh"><b>${q.name}</b><span>${locked ? 'Locked' : QSTATUS[st.status]}</span></div>`
      + (st.status === 'turnedIn' || locked ? '' : `<div class="qd">${q.intro}</div>`)
      + prog.map((p) => `<div class="qo ${p.have >= p.need ? 'done' : ''}">${p.have >= p.need ? '✔' : '•'} ${p.label} ${p.have}/${p.need}</div>`).join('')
      + `<div class="qr">Reward: ${rewards}</div></div>`;
  };
  // newest chapter first; later chapters stay hidden until reached
  body.innerHTML = [...CHAPTER_IDS].reverse().filter((n) => n <= gs.chapter || questsOfChapter(n).some((q) => gs.quests[q.id]?.status !== 'inactive'))
    .map((n) => `<h4 class="qchap">${CHAPTERS[n]!.subtitle} · ${CHAPTERS[n]!.name}</h4>` + questsOfChapter(n).map(entry).join('')).join('');
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
      b.style.borderColor = RARITY_COLOR[def.rarity];
      b.onmouseenter = () => { $('tip').textContent = `${def.name} (${def.rarity}) — ${def.description}`; };
      b.onclick = () => actions.clickSlot(i);
    }
    grid.appendChild(b);
  }
  const eq = $('equip');
  eq.innerHTML = '';
  for (const [key, label] of [['weapon', 'Weapon'], ['armor', 'Armor'], ['charm', 'Charm']] as [EquipKey, string][]) {
    const id = gs.inventory[key];
    const wrap = el('div', 'eqslot');
    const cell = el('button', 'cell'); cell.id = `${key}-slot`; cell.dataset.slot = key;
    if (id) { cell.innerHTML = icon(id); cell.style.borderColor = RARITY_COLOR[ITEMS[id]!.rarity]; cell.onclick = () => actions.unequip(key); cell.title = 'Click to unequip'; cell.onmouseenter = () => { $('tip').textContent = `${ITEMS[id]!.name} (${ITEMS[id]!.rarity}) — ${ITEMS[id]!.description}`; }; }
    wrap.appendChild(cell); wrap.appendChild(el('span', 'eqname', id ? ITEMS[id]!.name : `${label}: none`));
    eq.appendChild(wrap);
  }
}

function renderCharacter(gs: GameState, meditating: boolean): void {
  const st = statsOf(gs), root = ROOTS[gs.character.root], realm = REALMS[gs.cultivation.realm]!;
  const body = $('chrbody');
  const row = (k: string, v: string | number) => `<div class="row"><span>${k}</span><span>${v}</span></div>`;
  body.innerHTML = [
    row('Name', gs.character.name), row('Style', HEROES[gs.character.hero].trait.name), row('Root', root.name), row('Level', gs.progress.level),
    row('Realm', realm.name), row('Qi', `${Math.floor(gs.cultivation.qi)} / ${realm.qiMax}`), row('Spirit stones', gs.stones), '<hr>',
    row('HP', `${Math.ceil(gs.hp)} / ${st.maxHp}`), row('Mana', `${Math.floor(gs.mana)} / ${st.maxMana}`),
    row('Attack', st.atk), row('Defence', st.def), row('Crit', `${Math.round(st.critChance * 100)}%`), row('Mana regen', `${st.manaRegen}/s`),
    row('Kills', gs.kills), row('Foundation Pills', countOf(gs.inventory, 'foundation-pill')),
    ...(gs.boons.length ? ['<hr>', ...gs.boons.map((id) => `<div class="row" title="${BOONS[id]!.desc}"><span>${BOONS[id]!.name}</span><span>${BOONS[id]!.desc}</span></div>`)] : []),
  ].join('');
  const med = el('button', 'btn', meditating ? 'Stop meditating (M)' : 'Meditate (M)'); med.id = 'btn-meditate'; med.onclick = () => actions.toggleMeditate();
  const bt = el('button', 'btn', 'Breakthrough (B)'); bt.id = 'btn-breakthrough'; bt.disabled = !canBreakthrough(gs.cultivation, gs.progress.level) || countOf(gs.inventory, 'foundation-pill') < 1; bt.onclick = () => actions.breakthrough();
  body.appendChild(med); body.appendChild(bt);
  const pts = freePoints(gs);
  const skills = el('div', 'skills'); skills.innerHTML = `<h4>Techniques <small>${pts} point${pts === 1 ? '' : 's'}</small></h4>`;
  for (const sk of SKILLS) {
    const lvl = skillLevel(gs, sk.id), locked = gs.progress.level < sk.unlockLevel, sc = scaledSkill(sk, lvl);
    const r = el('div', `skrow${locked ? ' locked' : ''}`);
    r.innerHTML = `<span class="skn"><b>${sk.name}</b><small>${locked ? `unlocks at level ${sk.unlockLevel}` : `Lv ${lvl}/${SKILL_MAX} · ×${sc.damageMult.toFixed(1)} dmg · ${sc.cooldown.toFixed(1)}s cd`}</small></span>`;
    const up = el('button', 'btn', '+'); up.dataset.skill = sk.id; up.disabled = locked || lvl >= SKILL_MAX || pts < 1; up.onclick = () => actions.upgradeSkill(sk.id);
    r.appendChild(up); skills.appendChild(r);
  }
  body.appendChild(skills);
  body.appendChild(el('div', '', hasNextRealm(gs.cultivation)
    ? `Breakthrough needs full qi, level ${nextRealmLevel(gs.cultivation)} and a Foundation Pill (consumed each attempt). Success chance ${Math.round(BASE_BREAKTHROUGH_CHANCE * 100)}%; failure loses half your qi and wounds you (25% HP).`
    : 'You have reached the highest realm available in this build.'));
}

export function showDialogue(d: Dialogue | null, onAction: (a: DialogueAction) => void): void {
  const box = $('dlg');
  if (!d) { box.classList.add('hidden'); box.innerHTML = ''; return; }
  box.classList.remove('hidden');
  const pic = portraitUrl(d.portrait);
  box.innerHTML = `<div class="dlgrow">${pic ? `<img class="portrait" src="${pic}" alt="">` : ''}<div class="dlgtext"><div class="who">${d.speaker}</div><div class="txt">${d.text}</div></div></div>`;
  if (d.progress) box.querySelector('.dlgtext')!.insertAdjacentHTML('beforeend', `<ul>${d.progress.map((p) => `<li>${p.label}: ${p.have}/${p.need}</li>`).join('')}</ul>`);
  d.options.forEach((o, i) => {
    const b = el('button', 'btn', `${i + 1}. ${o.label}`); b.dataset.opt = String(i); b.onclick = () => onAction(o.action);
    box.appendChild(b);
  });
}
export const isDialogueOpen = (): boolean => !$('dlg').classList.contains('hidden');
