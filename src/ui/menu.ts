import { NAME_MAX, validateName } from '../core/character';
import { HEROES, HERO_IDS, type HeroId } from '../data/heroes';
import type { RootId } from '../data/roots';
import { ROOTS } from '../data/roots';
import { $, el } from './dom';
import { propUrl, spriteAnimHtml } from './skin';
import { audio } from '../game/audio';
import type { SlotInfo } from '../core/slots';
import { REALMS } from '../data/realms';

/** Misty sect backdrop built from the pale far-layer props. */
function backdrop(): string {
  const img = (k: string, cls: string) => `<img class="bg ${cls}" src="${propUrl(k)}" alt="">`;
  return `<div class="menu-bg">${img('fargalaxy', 'galaxy')}${img('farisle', 'isle')}${img('farpalace', 'palace')}${img('farpagoda', 'pagoda')}${img('fargate', 'gate')}<div class="moon"></div><div class="mist m1"></div><div class="mist m2"></div></div>`;
}

function screen(withBackdrop = true): HTMLElement {
  const old = document.getElementById('screen'); if (old) old.remove();
  const s = el('div', 'screen'); s.id = 'screen';
  if (withBackdrop) s.innerHTML = backdrop();
  $('ui').appendChild(s);
  return s;
}
export function hideScreen(): void { document.getElementById('screen')?.remove(); }
export const isScreenOpen = (): boolean => document.getElementById('screen') !== null;

function wireArrowNav(root: HTMLElement): void {
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const btns = [...root.querySelectorAll<HTMLButtonElement>('.menu-btn:not(:disabled)')];
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    btns[(i + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length]?.focus();
    e.preventDefault();
  });
}

const title = (sub: string) => `<div class="titlebox"><h1>IMMORTAL REALMS</h1><div class="cloud"></div><div class="sub">${sub}</div></div>`;

export function showLoading(): { set(p: number): void } {
  const s = screen();
  s.insertAdjacentHTML('beforeend', `<div class="menu-fg">${title('Gathering spirit energy…')}<div class="loadbar"><i id="loadfill"></i></div><div class="sub" id="loadtxt">0%</div></div>`);
  return { set: (p) => { const f = document.getElementById('loadfill'), t = document.getElementById('loadtxt'); if (f) f.style.width = `${Math.round(p * 100)}%`; if (t) t.textContent = `${Math.round(p * 100)}%`; } };
}

export function showMainMenu(opts: { hasSave: boolean; saveInfo?: string; error?: string; onNew(): void; onContinue(): void; onSlots(): void }): void {
  const s = screen();
  const fg = el('div', 'menu-fg'); fg.innerHTML = title('A cultivation adventure');
  const nb = el('button', 'menu-btn', 'New Game'); nb.id = 'btn-new'; nb.onclick = opts.onNew;
  const cb = el('button', 'menu-btn', 'Continue'); cb.id = 'btn-continue'; cb.disabled = !opts.hasSave; cb.onclick = opts.onContinue;
  const sb = el('button', 'menu-btn', 'Save Slots'); sb.id = 'btn-slots'; sb.onclick = opts.onSlots;
  fg.append(nb, cb, sb);
  if (opts.saveInfo) fg.appendChild(el('div', 'sub', opts.saveInfo));
  if (opts.error) { const e = el('div', 'err', opts.error); e.id = 'menu-error'; fg.appendChild(e); }
  s.appendChild(fg);
  wireArrowNav(s);
  (opts.hasSave ? cb : nb).focus();
}

export function showCreation(opts: { onStart(name: string, root: RootId, hero: HeroId, slot: number): void; onBack(): void; slots: SlotInfo[]; defaultSlot: number }): void {
  const s = screen();
  let root: RootId = 'flame', hero: HeroId = 'swordsman', slot = opts.defaultSlot;
  const fg = el('div', 'menu-fg wide');
  fg.innerHTML = `<h2>Create Your Cultivator</h2>
    <div class="field"><label for="name">Name (1–${NAME_MAX} characters)</label><input id="name" type="text" maxlength="40" autocomplete="off" /><div class="err" id="name-err"></div></div>
    <div class="sub">Appearance</div><div class="heroes" id="heroes"></div>
    <div class="sub">Spirit Root (press 1–3)</div><div class="roots" id="roots"></div>
    <div class="sub">Save slot</div><div class="slotpick" id="slotpick"></div><div id="slotwarn"></div>`;
  s.appendChild(fg);
  const heroesEl = $('heroes'), rootsEl = $('roots');
  const render = () => {
    heroesEl.innerHTML = '';
    for (const id of HERO_IDS) {
      const h = HEROES[id]; const b = el('button', `hero${id === hero ? ' sel' : ''}`); b.dataset.hero = id;
      b.innerHTML = `<div class="pv">${spriteAnimHtml(`${h.sprite}.idle`, 96)}</div><b>${h.name}</b><small>${h.title}</small><small class="trait" title="${h.trait.desc}">${h.trait.name}: ${h.trait.desc}</small>`;
      b.onclick = () => { hero = id; render(); };
      heroesEl.appendChild(b);
    }
    rootsEl.innerHTML = '';
    (Object.keys(ROOTS) as RootId[]).forEach((id, i) => {
      const r = ROOTS[id]; const b = r.bonus;
      const bonus = [b.atk && `+${b.atk} atk`, b.critChance && `+${Math.round(b.critChance * 100)}% crit`, b.maxMana && `+${b.maxMana} mana`, b.manaRegen && `+${b.manaRegen} regen`, b.maxHp && `+${b.maxHp} hp`, b.def && `+${b.def} def`].filter(Boolean).join(', ');
      const c = el('button', `root${id === root ? ' sel' : ''}`); c.dataset.root = id;
      c.innerHTML = `<b>${i + 1}. ${r.name}</b>${r.description}<small>${bonus}</small>`;
      c.onclick = () => { root = id; render(); };
      rootsEl.appendChild(c);
    });
  };
  const renderSlots = () => {
    const pick = $('slotpick'); pick.innerHTML = '';
    for (const si of opts.slots) {
      const b = el('button', `slotbtn${si.slot === slot ? ' sel' : ''}`, `Slot ${si.slot}${si.status === 'ok' ? ` · ${si.name} Lv ${si.level}` : si.status === 'corrupt' ? ' · damaged' : ' · empty'}`); b.dataset.slot = String(si.slot);
      b.onclick = () => { slot = si.slot; renderSlots(); };
      pick.appendChild(b);
    }
    const warn = $('slotwarn'); warn.innerHTML = '';
    if (opts.slots.find((x) => x.slot === slot)?.status !== 'empty') { const w = el('div', 'err warn', `Slot ${slot} already holds a journey. Beginning a new one will replace it.`); w.id = 'save-warning'; warn.appendChild(w); }
  };
  render(); renderSlots();
  const row = el('div', 'btnrow');
  const start = el('button', 'menu-btn', 'Begin Journey'); start.id = 'btn-start';
  const back = el('button', 'menu-btn', 'Back'); back.id = 'btn-back'; back.onclick = opts.onBack;
  const submit = () => {
    const r = validateName(($('name') as HTMLInputElement).value);
    if (!r.ok) { $('name-err').textContent = r.error; return; }
    opts.onStart(r.name, root, hero, slot);
  };
  start.onclick = submit;
  row.append(start, back); fg.appendChild(row);
  s.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (e.key === 'Enter' && t.id === 'name') submit();
    if (t.id !== 'name' && ['1', '2', '3'].includes(e.key)) { root = (Object.keys(ROOTS) as RootId[])[Number(e.key) - 1]!; render(); }
  });
  ($('name') as HTMLInputElement).focus();
}

export function showPause(opts: { onResume(): void; onSave(): void; onQuit(): void; message?: string }): void {
  const s = screen(false); s.classList.add('pause');
  const fg = el('div', 'menu-fg'); fg.innerHTML = `<h2>Paused</h2>`;
  const r = el('button', 'menu-btn', 'Resume'); r.id = 'btn-resume'; r.onclick = opts.onResume;
  const sv = el('button', 'menu-btn', 'Save Game'); sv.id = 'btn-save'; sv.onclick = opts.onSave;
  const q = el('button', 'menu-btn', 'Save & Quit to Menu'); q.id = 'btn-quit'; q.onclick = opts.onQuit;
  const vol = el('label', 'volrow', 'Volume '); const range = el('input'); range.type = 'range'; range.min = '0'; range.max = '100'; range.id = 'vol'; range.value = String(Math.round(audio.volume * 100));
  range.oninput = () => { audio.setVolume(Number(range.value) / 100); audio.sfx('click'); }; range.onchange = () => range.blur(); vol.appendChild(range);
  fg.append(r, sv, q, vol);
  if (opts.message) fg.appendChild(el('div', 'sub', opts.message));
  s.appendChild(fg);
  wireArrowNav(s);
  r.focus();
}

const when = (t: number): string => (t ? new Date(t).toLocaleString() : '');

/** The slot manager: load, delete, export and import saves. */
export function showSlots(opts: { slots: SlotInfo[]; message?: string; onLoad(slot: number): void; onDelete(slot: number): void; onExport(slot: number): void; onImport(slot: number, text: string): void; onBack(): void }): void {
  const s = screen();
  const fg = el('div', 'menu-fg wide'); fg.innerHTML = '<h2>Save Slots</h2>';
  for (const si of opts.slots) {
    const row = el('div', 'slotrow'); row.dataset.slot = String(si.slot);
    const info = el('div', 'slotinfo');
    if (si.status === 'ok') info.innerHTML = `<b>Slot ${si.slot} · ${si.name}</b><small>Lv ${si.level} · ${REALMS[si.realm]?.name ?? ''} · ${si.kills} kills · ${si.bosses} bosses · ${when(si.savedAt)}${si.recovered ? ' · <span class="warn">restored from backup</span>' : ''}</small>`;
    else if (si.status === 'corrupt') info.innerHTML = `<b>Slot ${si.slot} · damaged</b><small>${si.error}${si.hasBackup ? ' (backup also unusable)' : ''}</small>`;
    else info.innerHTML = `<b>Slot ${si.slot} · empty</b><small>Start a new game to use it, or import a save file.</small>`;
    const btns = el('div', 'slotbtns');
    if (si.status === 'ok') { const l = el('button', 'btn', 'Load'); l.id = `slot-load-${si.slot}`; l.onclick = () => opts.onLoad(si.slot); btns.appendChild(l); const x = el('button', 'btn', 'Export'); x.id = `slot-export-${si.slot}`; x.onclick = () => opts.onExport(si.slot); btns.appendChild(x); }
    if (si.status !== 'empty') {
      const d = el('button', 'btn', 'Delete'); d.id = `slot-del-${si.slot}`;
      d.onclick = () => { if (d.dataset.arm === '1') opts.onDelete(si.slot); else { d.dataset.arm = '1'; d.textContent = 'Really delete?'; } };
      btns.appendChild(d);
    }
    const imp = el('label', 'btn filebtn', 'Import…'); const f = el('input'); f.type = 'file'; f.accept = '.json,application/json,text/plain'; f.id = `slot-import-${si.slot}`; f.hidden = true;
    f.onchange = () => { const file = f.files?.[0]; if (file) void file.text().then((t) => opts.onImport(si.slot, t)); };
    imp.appendChild(f); btns.appendChild(imp);
    row.append(info, btns); fg.appendChild(row);
  }
  if (opts.message) { const m = el('div', 'sub', opts.message); m.id = 'slots-msg'; fg.appendChild(m); }
  const back = el('button', 'menu-btn', 'Back'); back.id = 'btn-slots-back'; back.onclick = opts.onBack; fg.appendChild(back);
  s.appendChild(fg); wireArrowNav(s); back.focus();
}
