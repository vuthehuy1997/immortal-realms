import { SKILLS } from '../data/skills';

export interface HudState {
  hp: number; maxHp: number; mana: number; maxMana: number;
  cooldowns: number[]; // remaining seconds per skill
  kills: number; xp: number; dead: boolean;
}

const $ = (id: string) => document.getElementById(id)!;
let built = false;

function build(): void {
  const root = $('skills');
  root.innerHTML = SKILLS.map((s, i) => `<div class="slot" id="slot${i}"><span class="k">${i + 1}</span><span class="n">${s.name}${s.manaCost ? ` · ${s.manaCost}` : ''}</span><div class="cd" id="cd${i}" style="height:0"></div></div>`).join('');
  built = true;
}

export function updateHud(s: HudState): void {
  if (!built) build();
  $('hp').style.width = `${(100 * s.hp) / s.maxHp}%`;
  $('hptxt').textContent = `HP ${Math.ceil(s.hp)} / ${s.maxHp}`;
  $('mp').style.width = `${(100 * s.mana) / s.maxMana}%`;
  $('mptxt').textContent = `Mana ${Math.floor(s.mana)} / ${s.maxMana}`;
  $('stats').textContent = `Kills ${s.kills}  ·  XP ${s.xp}`;
  SKILLS.forEach((sk, i) => {
    const cd = s.cooldowns[i] ?? 0;
    $(`cd${i}`).style.height = `${Math.min(100, (100 * cd) / sk.cooldown)}%`;
    $(`slot${i}`).classList.toggle('nomana', s.mana < sk.manaCost);
  });
  const msg = $('msg');
  msg.style.display = s.dead ? 'flex' : 'none';
  msg.textContent = s.dead ? 'You have fallen — press R to restart' : '';
}
