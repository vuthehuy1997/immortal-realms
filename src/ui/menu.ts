import { NAME_MAX, validateName } from '../core/character';
import { HEROES, HERO_IDS, type HeroId } from '../data/heroes';
import type { RootId } from '../data/roots';
import { ROOTS } from '../data/roots';
import { $, el } from './dom';
import { propUrl, spriteAnimHtml } from './skin';
import { audio } from '../game/audio';

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

export function showMainMenu(opts: { hasSave: boolean; saveInfo?: string; error?: string; onNew(): void; onContinue(): void }): void {
  const s = screen();
  const fg = el('div', 'menu-fg'); fg.innerHTML = title('A cultivation adventure');
  const nb = el('button', 'menu-btn', 'New Game'); nb.id = 'btn-new'; nb.onclick = opts.onNew;
  const cb = el('button', 'menu-btn', 'Continue'); cb.id = 'btn-continue'; cb.disabled = !opts.hasSave; cb.onclick = opts.onContinue;
  fg.append(nb, cb);
  if (opts.saveInfo) fg.appendChild(el('div', 'sub', opts.saveInfo));
  if (opts.error) { const e = el('div', 'err', opts.error); e.id = 'menu-error'; fg.appendChild(e); }
  s.appendChild(fg);
  wireArrowNav(s);
  (opts.hasSave ? cb : nb).focus();
}

export function showCreation(opts: { onStart(name: string, root: RootId, hero: HeroId): void; onBack(): void; replacesSave?: boolean }): void {
  const s = screen();
  let root: RootId = 'flame', hero: HeroId = 'swordsman';
  const fg = el('div', 'menu-fg wide');
  fg.innerHTML = `<h2>Create Your Cultivator</h2>
    <div class="field"><label for="name">Name (1–${NAME_MAX} characters)</label><input id="name" type="text" maxlength="40" autocomplete="off" /><div class="err" id="name-err"></div></div>
    <div class="sub">Appearance</div><div class="heroes" id="heroes"></div>
    <div class="sub">Spirit Root (press 1–3)</div><div class="roots" id="roots"></div>`;
  s.appendChild(fg);
  const heroesEl = $('heroes'), rootsEl = $('roots');
  const render = () => {
    heroesEl.innerHTML = '';
    for (const id of HERO_IDS) {
      const h = HEROES[id]; const b = el('button', `hero${id === hero ? ' sel' : ''}`); b.dataset.hero = id;
      b.innerHTML = `<div class="pv">${spriteAnimHtml(`${h.sprite}.idle`, 96)}</div><b>${h.name}</b><small>${h.title}</small>`;
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
  render();
  if (opts.replacesSave) { const w = el('div', 'err warn', 'You already have a saved journey. Beginning a new one will replace it.'); w.id = 'save-warning'; fg.appendChild(w); }
  const row = el('div', 'btnrow');
  const start = el('button', 'menu-btn', 'Begin Journey'); start.id = 'btn-start';
  const back = el('button', 'menu-btn', 'Back'); back.id = 'btn-back'; back.onclick = opts.onBack;
  const submit = () => {
    const r = validateName(($('name') as HTMLInputElement).value);
    if (!r.ok) { $('name-err').textContent = r.error; return; }
    opts.onStart(r.name, root, hero);
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
