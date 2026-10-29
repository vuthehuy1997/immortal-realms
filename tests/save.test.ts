import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/core/gameState';
import { newGameState, registerKill } from '../src/core/gameState';
import { acceptQuest } from '../src/core/quest';
import { checksum, parseSave, serialize, SAVE_VERSION } from '../src/core/save';

const sample = () => {
  const gs = newGameState('Tester', 'tide', 'monk', { x: 100, y: 120 });
  acceptQuest(gs.quests, 'pests'); registerKill(gs, 'wolf', () => 0); gs.cultivation.qi = 33; gs.hp = 42;
  return gs;
};
interface Env { version: number; checksum: string; state: GameState }
const tamper = (mutate: (e: Env) => void, fixSum = true) => {
  const env = JSON.parse(serialize(sample())) as Env;
  mutate(env);
  if (fixSum) env.checksum = checksum(JSON.stringify(env.state));
  return JSON.stringify(env);
};

describe('save/load: round 22 tips', () => {
  it('a hero who has seen every boss and dungeon tip (about 40 hints) still loads', () => {
    const hints = ['flask', 'poise', 'dodge', ...['sovereign', 'sandwyrm', 'mirageempress', 'furnacewarden', 'cranelord', 'magistrate', 'abyss-matron', 'abyss-daodemon'].map((b) => `mech-${b}`), ...['spike', 'fire', 'mist', 'plates', 'braziers', 'collapse', 'ambush'].map((k) => `dg-${k}`)];
    const gs = sample(); gs.hints = hints;
    const back = parseSave(serialize(gs)); expect(back.ok).toBe(true);
    if (back.ok) expect(back.state.hints).toEqual(hints);
    const many = sample(); many.hints = Array.from({ length: 81 }, (_, i) => `h${i}`);
    expect(parseSave(serialize(many)).ok, 'still bounded').toBe(false);
  });
});

describe('save/load', () => {
  it('roundtrips state exactly', () => {
    const gs = sample(); const r = parseSave(serialize(gs, 123));
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.state).toEqual(gs); expect(r.savedAt).toBe(123); }
  });
  it('rejects missing / non-JSON / wrong version', () => {
    expect(parseSave(null).ok).toBe(false);
    expect(parseSave('{nope').ok).toBe(false);
    expect(parseSave(tamper((e) => { e.version = SAVE_VERSION + 1; })).ok).toBe(false);
  });
  it('detects edits via checksum', () => {
    expect(parseSave(tamper((e) => { e.state.hp = 9999; }, false))).toEqual({ ok: false, error: expect.stringMatching(/checksum/) });
  });
  it.each([
    ['negative hp', (e: Env) => { e.state.hp = -5; }],
    ['NaN-ish level', (e: Env) => { e.state.progress.level = 999; }],
    ['unknown item', (e: Env) => { e.state.inventory.slots[3] = { id: 'god-sword', count: 1 }; }],
    ['over-stacked item', (e: Env) => { e.state.inventory.slots[3] = { id: 'iron-sword', count: 5 }; }],
    ['bad hero', (e: Env) => { e.state.character.hero = 'ghost' as never; }],
    ['armor in the weapon slot', (e: Env) => { e.state.inventory.weapon = 'cloth-robe'; }],
    ['weapon in the armor slot', (e: Env) => { e.state.inventory.armor = 'iron-sword'; }],
    ['unknown skill', (e: Env) => { e.state.skills = { 'god-slash': 2 }; }],
    ['skill level over the cap', (e: Env) => { e.state.progress.level = 20; e.state.skills = { 'flying-sword': 9 }; }],
    ['more skill points than earned', (e: Env) => { e.state.skills = { 'flying-sword': 3 }; }],
    ['bad tutorial step', (e: Env) => { e.state.tut = -1; }],
    ['unknown boss id', (e: Env) => { e.state.bosses = ['dragon-god']; }],
    ['duplicate boss', (e: Env) => { e.state.bosses = ['warden', 'warden']; }],
    ['negative stones', (e: Env) => { e.state.stones = -1; }],
    ['bad root', (e: Env) => { e.state.character.root = 'hax' as never; }],
    ['bad name', (e: Env) => { e.state.character.name = ''; }],
    ['wrong slot count', (e: Env) => { e.state.inventory.slots.pop(); }],
    ['bad quest status', (e: Env) => { e.state.quests.pests!.status = 'done' as never; }],
    ['qi over cap', (e: Env) => { e.state.cultivation.qi = 9999; }],
    ['non-equipment weapon', (e: Env) => { e.state.inventory.weapon = 'hp-potion'; }],
  ])('rejects semantically invalid save even with a valid checksum: %s', (_n, m) => {
    expect(parseSave(tamper(m)).ok).toBe(false);
  });
});
