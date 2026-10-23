import { SKILLS } from '../data/skills';
import { QUESTS } from '../data/quests';
import { REALMS } from '../data/realms';
import { xpToNext } from '../core/progression';
import { progressOf } from '../core/quest';
import { countOf } from '../core/inventory';
import { scaledSkill } from '../core/skills';
import type { GameState } from '../core/gameState';
import { MANIFEST } from '../game/assets';
import { $, el, setFill, setText, setWidth } from './dom';
import { abs, fxIconStyle } from './skin';

let built = false;

const SLOT_ICONS = [{ fx: 'xf_flying_sword', frame: 7 }, { fx: 'xf_moon_arc', frame: 4 }, { fx: 'xf_lotus', frame: 5 }, { fx: 'xf_sword_rain', frame: 3 }];

export function buildHud(): void {
  if (built) return;
  $('ui').insertAdjacentHTML('beforeend', `<div id="hudlayer" class="hidden"><div id="vig"></div>
    <div id="pcard">
      <div id="lvl"></div>
      <div class="xbar hp"><i id="hp"></i><b id="hptxt"></b></div>
      <div class="xbar mp"><i id="mp"></i><b id="mptxt"></b></div>
      <div class="xbar qi"><i id="qi"></i><b id="qitxt"></b></div>
      <div class="xpline"><div class="track"><i id="xp"></i></div><span id="xptxt"></span></div>
      <div id="stones"><span class="stone"></span><span id="stonetxt">0</span></div>
    </div>
    <div id="quest" class="hidden"></div>
    <div id="boss" class="hidden"><div class="name" id="bossname"></div><div class="xbar boss"><i id="bosshp"></i><b id="bosshptxt"></b></div></div>
    <div id="objective" class="hidden"><span class="otag">Objective</span><span id="objtext"></span></div>
    <div id="objarrow" class="hidden"><i></i><b id="objdist"></b></div>
    <div id="zonebanner"></div>
    <div id="skills"></div>
    <div id="toasts"></div>
    <div id="prompt" class="hidden"></div>
    <div id="death" class="hidden"><div class="dbox"><h2>Defeated</h2><p id="deathtxt"></p><div class="btnrow"><button class="menu-btn" id="btn-respawn">Respawn (R)</button><button class="menu-btn" id="btn-death-menu">Main menu</button></div></div></div>
    <div id="hint">WASD move · mouse aim · click/Space sword combo · 1-4 techniques · Shift dash · F flask/potion · G mana potion · E interact · M meditate · B breakthrough · I bag · C character · Esc menu</div>
  </div>`);
  const slots: string[] = [];
  slots.push(`<div class="slot wide" id="slot-combo"><div class="ic combo"></div><span class="k">LMB</span><span class="nm">Sword Combo</span><div class="pips"><i></i><i></i><i></i></div></div>`);
  SKILLS.forEach((s, i) => slots.push(`<div class="slot" id="slot${i}" title="${s.name} — ${s.alt}"><div class="ic" style="${fxIconStyle(SLOT_ICONS[i]!.fx, SLOT_ICONS[i]!.frame, 44)}"></div><span class="k">${i + 1}</span><span class="nm">${s.name}</span><span class="slv" id="slv${i}"></span><div class="cd" id="cd${i}"></div><div class="lock" id="lock${i}">Lv ${s.unlockLevel}</div></div>`));
  slots.push(`<div class="slot" id="slot-dash"><div class="ic dash"></div><span class="k">Shift</span><span class="nm">Dash</span><div class="cd" id="cd-dash"></div></div>`);
  slots.push(`<div class="slot pot" id="pot-hp"><div class="ic hpp"></div><span class="k">F</span><span class="cnt" id="cnt-hp">0</span><div class="cd" id="cd-pot1"></div></div>`);
  slots.push(`<div class="slot pot" id="pot-mp"><div class="ic mpp"></div><span class="k">G</span><span class="cnt" id="cnt-mp">0</span><div class="cd" id="cd-pot2"></div></div>`);
  $('skills').innerHTML = slots.join('');
  const icons = MANIFEST.ui;
  $('slot-combo').querySelector<HTMLElement>('.ic')!.style.backgroundImage = `url("${abs(MANIFEST.icons.blade_01_00!.url)}")`;
  $('slot-dash').querySelector<HTMLElement>('.ic')!.style.backgroundImage = `url("${abs(icons.status_swift!.url)}")`;
  $('pot-hp').querySelector<HTMLElement>('.ic')!.style.backgroundImage = `url("${abs(icons.item_gourd!.url)}")`;
  $('pot-mp').querySelector<HTMLElement>('.ic')!.style.backgroundImage = `url("${abs(icons.item_conch!.url)}")`;
  built = true;
}

export function showHud(show: boolean): void { $('hudlayer').classList.toggle('hidden', !show); }

export interface HudFrame {
  gs: GameState; maxHp: number; maxMana: number; meditating: boolean; cooldowns: number[]; cooldownMax: number[]; skillLevels: number[]; freePoints: number;
  comboStep: number; dashCd: number; dashMax: number; potionCd: number; potionMax: number; zone: string; objective: string;
}

export function updateHud(f: HudFrame): void {
  const { gs } = f;
  setText($('lvl'), `${gs.character.name} · Lv ${gs.progress.level} · ${REALMS[gs.cultivation.realm]!.name}${f.meditating ? ' · meditating…' : ''}`);
  setFill($('hp'), (100 * gs.hp) / f.maxHp); setText($('hptxt'), `HP ${Math.ceil(gs.hp)} / ${f.maxHp}`);
  setFill($('mp'), (100 * gs.mana) / f.maxMana); setText($('mptxt'), `Mana ${Math.floor(gs.mana)} / ${f.maxMana}`);
  const need = xpToNext(gs.progress.level);
  setWidth($('xp'), (100 * gs.progress.xp) / need); setText($('xptxt'), `XP ${gs.progress.xp} / ${need}`);
  const qm = REALMS[gs.cultivation.realm]!.qiMax;
  setFill($('qi'), (100 * gs.cultivation.qi) / qm); setText($('qitxt'), `Qi ${Math.floor(gs.cultivation.qi)} / ${qm}`);
  setText($('stonetxt'), String(gs.stones));
  SKILLS.forEach((sk, i) => {
    const locked = gs.progress.level < sk.unlockLevel;
    const slot = $(`slot${i}`);
    slot.classList.toggle('locked', locked);
    slot.classList.toggle('nomana', !locked && gs.mana < sk.manaCost);
    $(`cd${i}`).style.height = `${Math.min(100, (100 * (f.cooldowns[i] ?? 0)) / (f.cooldownMax[i] ?? sk.cooldown))}%`;
    const lv = f.skillLevels[i] ?? 1;
    setText($(`slv${i}`), !locked && (lv > 1 || f.freePoints > 0) ? `${lv > 1 ? `Lv${lv}` : ''}${f.freePoints > 0 && lv < 5 ? ' ▲' : ''}`.trim() : '');
    $(`slot${i}`).title = `${sk.name} — ${sk.alt}\nDamage ×${scaledSkill(sk, lv).damageMult.toFixed(1)} · ${sk.manaCost} mana · ${scaledSkill(sk, lv).cooldown.toFixed(1)}s cooldown · level ${lv}/5`;
  });
  $('cd-pot1').style.height = $('cd-pot2').style.height = `${Math.min(100, (100 * f.potionCd) / f.potionMax)}%`;
  setText($('objtext'), f.objective); $('objective').classList.toggle('hidden', !f.objective);
  $('cd-dash').style.height = `${Math.min(100, (100 * f.dashCd) / f.dashMax)}%`;
  const pips = $('slot-combo').querySelectorAll('.pips i');
  pips.forEach((p, i) => p.classList.toggle('on', i < f.comboStep));
  setText($('cnt-hp'), `${gs.flask.charges}+${countOf(gs.inventory, 'hp-potion')}`); setText($('cnt-mp'), String(countOf(gs.inventory, 'mana-potion')));
  $('pot-hp').classList.toggle('empty', countOf(gs.inventory, 'hp-potion') === 0 && gs.flask.charges === 0); $('pot-mp').classList.toggle('empty', countOf(gs.inventory, 'mana-potion') === 0);
  renderQuestTracker(gs);
}

let lastQuestHtml = '';
function renderQuestTracker(gs: GameState): void {
  const box = $('quest');
  const active = Object.values(QUESTS).find((q) => gs.quests[q.id]?.status === 'active');
  if (!active) { if (lastQuestHtml !== '') { lastQuestHtml = ''; box.classList.add('hidden'); } return; }
  const prog = progressOf(active, gs.quests[active.id]!, gs.inventory, gs.bosses);
  const html = `<h4>${active.name}</h4>${prog.map((p) => `<div class="${p.have >= p.need ? 'done' : ''}">${p.have >= p.need ? '✔' : '•'} ${p.label} ${p.have}/${p.need}</div>`).join('')}`;
  if (html !== lastQuestHtml) { lastQuestHtml = html; box.innerHTML = html; box.classList.remove('hidden'); }
}

export function setBossBar(name: string | null, hp = 0, maxHp = 1): void {
  const box = $('boss');
  box.classList.toggle('hidden', name === null);
  document.body.classList.toggle('bossfight', name !== null); // the objective line steps aside while the boss bar is up
  if (name === null) return;
  setText($('bossname'), name); setFill($('bosshp'), (100 * hp) / maxHp); setText($('bosshptxt'), `${Math.ceil(hp)} / ${maxHp}`);
}

export function setPrompt(text: string | null): void {
  const p = $('prompt'); p.classList.toggle('hidden', text === null); if (text !== null) setText(p, text);
}

export function toast(text: string, ms = 2600): void {
  const t = el('div', 'toast', text); $('toasts').appendChild(t);
  setTimeout(() => t.remove(), ms);
}

let zoneTimer: ReturnType<typeof setTimeout> | undefined;
export function showZoneBanner(name: string, level: string): void {
  const b = $('zonebanner');
  b.innerHTML = `<div class="zn">${name}</div><div class="zl">${level}</div>`;
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  clearTimeout(zoneTimer); zoneTimer = setTimeout(() => b.classList.remove('show'), 3200);
}

/** Points an edge-of-screen arrow at the current objective (hidden while it is already on screen). */
export function setObjectiveArrow(target: { sx: number; sy: number; dist: number } | null, vw: number, vh: number): void {
  const a = $('objarrow');
  if (!target) { a.classList.add('hidden'); return; }
  const m = 70, cx = vw / 2, cy = vh / 2;
  const onScreen = target.sx > m && target.sx < vw - m && target.sy > m && target.sy < vh - m;
  a.classList.toggle('hidden', onScreen);
  if (onScreen) return;
  const dx = target.sx - cx, dy = target.sy - cy, k = Math.min((vw / 2 - m) / Math.abs(dx || 1e-6), (vh / 2 - m) / Math.abs(dy || 1e-6));
  let ax = cx + dx * k, ay = cy + dy * k;
  ay = Math.max(150, Math.min(vh - 130, ay)); // keep clear of the top bars and the skill bar
  if (ax > vw - 300 && ay < 360) ax = vw - 310; // ...and of the minimap / quest panel
  if (ax < 320 && ay < 200) ay = 200;
  a.style.transform = `translate(${ax}px, ${ay}px)`;
  (a.firstElementChild as HTMLElement).style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  setText($('objdist'), `${Math.max(1, Math.round(target.dist / 16))}`);
}

export function showDeath(show: boolean, text = '', handlers?: { respawn(): void; menu(): void }): void {
  const d = $('death'); d.classList.toggle('hidden', !show);
  if (!show) return;
  $('zonebanner').classList.remove('show');
  setText($('deathtxt'), text);
  if (handlers) { $('btn-respawn').onclick = handlers.respawn; $('btn-death-menu').onclick = handlers.menu; }
}
