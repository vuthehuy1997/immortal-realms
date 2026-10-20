import { describe, expect, it } from 'vitest';
import { getDialogue } from '../src/core/dialogue';
import { newGameState, registerKill, turnInQuest } from '../src/core/gameState';
import { addItem, countOf } from '../src/core/inventory';
import { acceptQuest } from '../src/core/quest';
import { parseSave, serialize } from '../src/core/save';
import { NPCS, QUESTS } from '../src/data/quests';

const mk = () => newGameState('Tester', 'flame', 'swordsman', { x: 10, y: 10 });
const never = () => 0.999;

describe('side quests', () => {
  it('every quest has a known giver that lists it, and rewards exist', () => {
    for (const q of Object.values(QUESTS)) expect(NPCS[q.giver]?.quests, q.id).toContain(q.id);
  });
  it('traders just trade until a quest is on offer, then offer it alongside their wares', () => {
    const gs = mk();
    expect(getDialogue('merchant-qiao', gs.quests, gs.inventory).quest).toBe(false); // gated behind the first main quest
    gs.quests.pests!.status = 'turnedIn';
    const d = getDialogue('merchant-qiao', gs.quests, gs.inventory);
    expect(d.quest).toBe(true);
    expect(d.options.map((o) => o.action.type)).toEqual(['accept', 'trade', 'close']);
  });
  it('kill quest pays xp, stones and items on turn-in', () => {
    const gs = mk(); gs.quests.pests!.status = 'turnedIn';
    expect(acceptQuest(gs.quests, 'toads')).toBe(true);
    for (let i = 0; i < 6; i++) registerKill(gs, 'toad', never, { zone: 'marsh' });
    const before = gs.stones, potions = countOf(gs.inventory, 'hp-potion');
    expect(turnInQuest(gs, 'toads').ok).toBe(true);
    expect(gs.stones).toBe(before + 60); expect(countOf(gs.inventory, 'hp-potion')).toBe(potions + 2);
  });
  it('collect quest consumes the herbs', () => {
    const gs = mk(); gs.quests.pests!.status = 'turnedIn';
    acceptQuest(gs.quests, 'furnace'); addItem(gs.inventory, 'spirit-herb', 5);
    expect(turnInQuest(gs, 'furnace').ok).toBe(true);
    expect(countOf(gs.inventory, 'spirit-herb')).toBe(0);
  });
  it('elite quest counts only elite kills', () => {
    const gs = mk(); gs.quests.pests!.status = gs.quests.fox!.status = gs.quests.warden!.status = 'turnedIn';
    acceptQuest(gs.quests, 'champions');
    registerKill(gs, 'wolf', never); registerKill(gs, 'wolf', never);
    expect(turnInQuest(gs, 'champions').ok).toBe(false);
    registerKill(gs, 'wolf', never, { elite: true }); registerKill(gs, 'snake', never, { elite: true });
    expect(turnInQuest(gs, 'champions').ok).toBe(true);
  });
  it('saves written before side quests existed still load', () => {
    const gs = mk();
    const old = serialize({ ...gs, quests: Object.fromEntries(Object.entries(gs.quests).filter(([k]) => ['pests', 'fox', 'warden'].includes(k))) } as typeof gs, 0);
    const r = parseSave(old);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.quests.toads?.status).toBe('inactive');
  });
});

describe('Jiao Dragon (round 7)', () => {
  it('is the capstone: offered only after the champions trial, tracked, and pays a unique pearl once', async () => {
    const { BOSSES } = await import('../src/data/boss');
    const { DROPS } = await import('../src/data/items');
    expect(BOSSES.jiaolong!.home).toBe('pool'); expect(BOSSES.jiaolong!.zone).toBe('marsh');
    expect(DROPS.jiaolong!.some((d) => d.item === 'dragon-pearl' && d.chance === 1)).toBe(true);
    const gs = mk(); gs.quests.pests!.status = gs.quests.fox!.status = gs.quests.warden!.status = 'turnedIn';
    expect(getDialogue('elder-lin', gs.quests, gs.inventory, gs.bosses).text).toContain('elite'); // champions comes first
    gs.quests.champions!.status = 'turnedIn';
    expect(getDialogue('elder-lin', gs.quests, gs.inventory, gs.bosses).text).toContain('jiao dragon');
    expect(acceptQuest(gs.quests, 'jiaolong')).toBe(true);
    registerKill(gs, 'jiaolong', never, { zone: 'marsh' });
    expect(gs.bosses).toContain('jiaolong'); expect(countOf(gs.inventory, 'dragon-pearl')).toBe(1);
    expect(turnInQuest(gs, 'jiaolong').ok).toBe(true);
    const back = parseSave(serialize(gs)); expect(back.ok).toBe(true);
  });
  it('every NPC has a dedicated portrait, not the shared abbot', () => {
    expect(NPCS['merchant-qiao']!.portrait).toBe('peddler_neutral');
    expect(NPCS['alchemist-yun']!.portrait).toBe('alchemist_neutral');
    const gs = mk(); gs.quests.pests!.status = 'turnedIn';
    expect(getDialogue('alchemist-yun', gs.quests, gs.inventory).portrait).toBe('alchemist_neutral');
  });
});
