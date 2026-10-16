import { NAME_MAX, validateName } from '../core/character';
import type { RootId } from '../data/roots';
import { ROOTS } from '../data/roots';
import { $, el } from './dom';

function screen(): HTMLElement {
  const old = document.getElementById('screen'); if (old) old.remove();
  const s = el('div', 'screen'); s.id = 'screen';
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

export function showMainMenu(opts: { hasSave: boolean; saveInfo?: string; error?: string; onNew(): void; onContinue(): void }): void {
  const s = screen();
  s.innerHTML = `<h1>IMMORTAL REALMS</h1><div class="sub">A cultivation adventure</div>`;
  const nb = el('button', 'menu-btn', 'New Game'); nb.id = 'btn-new'; nb.onclick = opts.onNew;
  const cb = el('button', 'menu-btn', 'Continue'); cb.id = 'btn-continue'; cb.disabled = !opts.hasSave; cb.onclick = opts.onContinue;
  s.append(nb, cb);
  if (opts.saveInfo) s.appendChild(el('div', 'sub', opts.saveInfo));
  if (opts.error) { const e = el('div', 'err', opts.error); e.id = 'menu-error'; s.appendChild(e); }
  wireArrowNav(s);
  (opts.hasSave ? cb : nb).focus();
}

export function showCreation(opts: { onStart(name: string, root: RootId): void; onBack(): void }): void {
  const s = screen();
  let selected: RootId = 'flame';
  s.innerHTML = `<h1>Create Your Cultivator</h1>
    <div class="field"><label for="name">Name (1–${NAME_MAX} characters)</label><input id="name" type="text" maxlength="40" autocomplete="off" /><div class="err" id="name-err"></div></div>
    <div class="sub" style="margin:0">Spirit Root (press 1–3)</div><div class="roots" id="roots"></div>`;
  const rootsEl = $('roots');
  const render = () => {
    rootsEl.innerHTML = '';
    (Object.keys(ROOTS) as RootId[]).forEach((id, i) => {
      const r = ROOTS[id]; const b = r.bonus;
      const bonus = [b.atk && `+${b.atk} atk`, b.critChance && `+${Math.round(b.critChance * 100)}% crit`, b.maxMana && `+${b.maxMana} mana`, b.manaRegen && `+${b.manaRegen} regen`, b.maxHp && `+${b.maxHp} hp`, b.def && `+${b.def} def`].filter(Boolean).join(', ');
      const c = el('button', `root${id === selected ? ' sel' : ''}`); c.dataset.root = id;
      c.innerHTML = `<b>${i + 1}. ${r.name}</b>${r.description}<small>${bonus}</small>`;
      c.onclick = () => { selected = id; render(); };
      rootsEl.appendChild(c);
    });
  };
  render();
  const start = el('button', 'menu-btn', 'Begin Journey'); start.id = 'btn-start';
  const back = el('button', 'menu-btn', 'Back'); back.id = 'btn-back'; back.onclick = opts.onBack;
  const submit = () => {
    const r = validateName(($('name') as HTMLInputElement).value);
    if (!r.ok) { $('name-err').textContent = r.error; return; }
    opts.onStart(r.name, selected);
  };
  start.onclick = submit;
  s.append(start, back);
  s.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (e.key === 'Enter' && t.id === 'name') { submit(); }
    if (t.id !== 'name' && ['1', '2', '3'].includes(e.key)) { selected = (Object.keys(ROOTS) as RootId[])[Number(e.key) - 1]!; render(); }
  });
  ($('name') as HTMLInputElement).focus();
}

export function showPause(opts: { onResume(): void; onSave(): void; onQuit(): void; message?: string }): void {
  const s = screen();
  s.innerHTML = `<h1>Paused</h1>`;
  const r = el('button', 'menu-btn', 'Resume'); r.id = 'btn-resume'; r.onclick = opts.onResume;
  const sv = el('button', 'menu-btn', 'Save Game'); sv.id = 'btn-save'; sv.onclick = opts.onSave;
  const q = el('button', 'menu-btn', 'Save & Quit to Menu'); q.id = 'btn-quit'; q.onclick = opts.onQuit;
  s.append(r, sv, q);
  if (opts.message) s.appendChild(el('div', 'sub', opts.message));
  wireArrowNav(s);
  r.focus();
}
