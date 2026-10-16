import { SKILLS } from '../data/skills';
import { QUESTS } from '../data/quests';
import { REALMS } from '../data/realms';
import { xpToNext } from '../core/progression';
import { progressOf } from '../core/quest';
import type { GameState } from '../core/gameState';
import { $, el, setText, setWidth } from './dom';

let built = false;

export function buildHud(): void {
  if (built) return;
  const ui = $('ui');
  ui.insertAdjacentHTML('beforeend', `<div id="hudlayer" class="hidden">
    <div id="bars">
      <div id="lvl"></div>
      <div class="bar hp"><i id="hp"></i><b id="hptxt"></b></div>
      <div class="bar mp"><i id="mp"></i><b id="mptxt"></b></div>
      <div class="bar xp"><i id="xp"></i><b id="xptxt"></b></div>
      <div class="bar qi"><i id="qi"></i><b id="qitxt"></b></div>
    </div>
    <div id="quest" class="hidden"></div>
    <div id="boss" class="hidden"><div class="name" id="bossname"></div><div class="bar boss"><i id="bosshp"></i><b id="bosshptxt"></b></div></div>
    <div id="skills"></div>
    <div id="toasts"></div>
    <div id="prompt" class="hidden"></div>
    <div id="hint">WASD move · mouse aim · click/Space/1 slash · 2 bolt · 3 burst · Q/Z potions · E talk · M meditate · B breakthrough · I inventory · C character · Esc menu</div></div>`);
  $('skills').innerHTML = SKILLS.map((s, i) => `<div class="slot" id="slot${i}"><span class="k">${i + 1}</span><span class="n">${s.name}${s.manaCost ? ` · ${s.manaCost}` : ''}</span><div class="cd" id="cd${i}"></div></div>`).join('');
  built = true;
}

export function showHud(show: boolean): void { $('hudlayer').classList.toggle('hidden', !show); }

export interface HudFrame { gs: GameState; maxHp: number; maxMana: number; cooldowns: number[]; meditating: boolean }

export function updateHud(f: HudFrame): void {
  const { gs } = f;
  setText($('lvl'), `${gs.character.name} · Lv ${gs.progress.level} · ${REALMS[gs.cultivation.realm]!.name}${f.meditating ? ' · meditating…' : ''}`);
  setWidth($('hp'), (100 * gs.hp) / f.maxHp); setText($('hptxt'), `HP ${Math.ceil(gs.hp)} / ${f.maxHp}`);
  setWidth($('mp'), (100 * gs.mana) / f.maxMana); setText($('mptxt'), `Mana ${Math.floor(gs.mana)} / ${f.maxMana}`);
  const need = xpToNext(gs.progress.level);
  setWidth($('xp'), (100 * gs.progress.xp) / need); setText($('xptxt'), `XP ${gs.progress.xp} / ${need}`);
  const qm = REALMS[gs.cultivation.realm]!.qiMax;
  setWidth($('qi'), (100 * gs.cultivation.qi) / qm); setText($('qitxt'), `Qi ${Math.floor(gs.cultivation.qi)} / ${qm}`);
  SKILLS.forEach((sk, i) => {
    $(`cd${i}`).style.height = `${Math.min(100, (100 * (f.cooldowns[i] ?? 0)) / sk.cooldown)}%`;
    $(`slot${i}`).classList.toggle('nomana', gs.mana < sk.manaCost);
  });
  renderQuestTracker(gs);
}

let lastQuestHtml = '';
function renderQuestTracker(gs: GameState): void {
  const box = $('quest');
  const active = Object.values(QUESTS).find((q) => gs.quests[q.id]?.status === 'active');
  if (!active) { if (lastQuestHtml !== '') { lastQuestHtml = ''; box.classList.add('hidden'); } return; }
  const prog = progressOf(active, gs.quests[active.id]!, gs.inventory);
  const html = `<h4>${active.name}</h4>${prog.map((p) => `<div class="${p.have >= p.need ? 'done' : ''}">${p.have >= p.need ? '✔' : '•'} ${p.label} ${p.have}/${p.need}</div>`).join('')}`;
  if (html !== lastQuestHtml) { lastQuestHtml = html; box.innerHTML = html; box.classList.remove('hidden'); }
}

export function setBossBar(name: string | null, hp = 0, maxHp = 1): void {
  const box = $('boss');
  box.classList.toggle('hidden', name === null);
  if (name === null) return;
  setText($('bossname'), name); setWidth($('bosshp'), (100 * hp) / maxHp); setText($('bosshptxt'), `${Math.ceil(hp)} / ${maxHp}`);
}

export function setPrompt(text: string | null): void {
  const p = $('prompt'); p.classList.toggle('hidden', text === null); if (text !== null) setText(p, text);
}

export function toast(text: string, ms = 2600): void {
  const t = el('div', 'toast', text); $('toasts').appendChild(t);
  setTimeout(() => t.remove(), ms);
}
