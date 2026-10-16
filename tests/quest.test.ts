import { describe, expect, it } from 'vitest';
import { getDialogue } from '../src/core/dialogue';
import { gatherHerb, newGameState, registerKill, statsOf, turnInQuest, unequipWeapon, useItemSlot, WARDEN_ID } from '../src/core/gameState';
import { addItem, countOf } from '../src/core/inventory';
import { acceptQuest } from '../src/core/quest';

const mk = () => newGameState('Tester', 'flame', 'swordsman', { x: 10, y: 10 });
const never = () => 0.999; // no drops
const always = () => 0; // all drops

describe('dialogue reflects quest state', () => {
  it('offers, reminds, completes, chains, then idles', () => {
    const gs = mk();
    let d = getDialogue('elder-lin', gs.quests, gs.inventory);
    expect(d.options[0]!.action).toEqual({ type: 'accept', questId: 'pests' });
    expect(acceptQuest(gs.quests, 'pests')).toBe(true);
    expect(acceptQuest(gs.quests, 'pests')).toBe(false);
    d = getDialogue('elder-lin', gs.quests, gs.inventory);
    expect(d.options[0]!.action).toEqual({ type: 'close' }); expect(d.progress).toHaveLength(2);
    for (let i = 0; i < 4; i++) registerKill(gs, 'wolf', never);
    addItem(gs.inventory, 'spirit-herb', 2);
    d = getDialogue('elder-lin', gs.quests, gs.inventory);
    expect(d.options[0]!.action).toEqual({ type: 'turnin', questId: 'pests' });
    expect(turnInQuest(gs, 'pests').ok).toBe(true);
    d = getDialogue('elder-lin', gs.quests, gs.inventory);
    expect(d.options[0]!.action).toEqual({ type: 'accept', questId: 'warden' });
    acceptQuest(gs.quests, 'warden'); registerKill(gs, WARDEN_ID, never);
    expect(turnInQuest(gs, 'warden').ok).toBe(true);
    d = getDialogue('elder-lin', gs.quests, gs.inventory);
    expect(d.options[0]!.action).toEqual({ type: 'close' });
    expect(d.text).toMatch(/quiet/);
  });
  it('second quest cannot be accepted before the first is turned in', () => {
    const gs = mk();
    expect(acceptQuest(gs.quests, 'warden')).toBe(false);
  });
});

describe('quest turn-in', () => {
  it('rejects incomplete quests and changes nothing', () => {
    const gs = mk(); acceptQuest(gs.quests, 'pests');
    const before = JSON.stringify(gs);
    expect(turnInQuest(gs, 'pests')).toEqual({ ok: false, reason: 'incomplete' });
    expect(JSON.stringify(gs)).toBe(before);
  });
  it('consumes collect items and pays rewards', () => {
    const gs = mk(); acceptQuest(gs.quests, 'pests');
    for (let i = 0; i < 4; i++) registerKill(gs, 'wolf', never);
    addItem(gs.inventory, 'spirit-herb', 3);
    const r = turnInQuest(gs, 'pests');
    expect(r.ok).toBe(true);
    expect(countOf(gs.inventory, 'spirit-herb')).toBe(1);
    expect(countOf(gs.inventory, 'iron-sword')).toBe(1);
    expect(gs.quests.pests!.status).toBe('turnedIn');
    expect(gs.progress.xp + gs.progress.level).toBeGreaterThan(1);
  });
  it('fails atomically when rewards do not fit', () => {
    const gs = mk(); acceptQuest(gs.quests, 'pests');
    for (let i = 0; i < 4; i++) registerKill(gs, 'wolf', never);
    gs.inventory.slots.fill({ id: 'iron-sword', count: 1 }); // every slot taken (swords do not stack)
    gs.inventory.slots[0] = { id: 'spirit-herb', count: 2 }; // turn-in frees exactly one slot; rewards need two
    const before = JSON.stringify(gs);
    expect(turnInQuest(gs, 'pests')).toEqual({ ok: false, reason: 'inventory-full' });
    expect(JSON.stringify(gs)).toBe(before);
    expect(gs.quests.pests!.status).toBe('active');
  });
  it('turn-in works when it frees just enough room', () => {
    const gs = mk(); acceptQuest(gs.quests, 'pests');
    for (let i = 0; i < 4; i++) registerKill(gs, 'wolf', never);
    gs.inventory.slots.fill({ id: 'iron-sword', count: 1 });
    gs.inventory.slots[0] = { id: 'spirit-herb', count: 1 };
    gs.inventory.slots[1] = { id: 'spirit-herb', count: 1 }; // turn-in frees both slots => exactly enough for 2 reward stacks
    expect(turnInQuest(gs, 'pests').ok).toBe(true);
    expect(countOf(gs.inventory, 'iron-sword')).toBe(18 + 1); // 18 pre-filled + 1 reward
    expect(countOf(gs.inventory, 'hp-potion')).toBe(3);
    expect(countOf(gs.inventory, 'spirit-herb')).toBe(0);
  });
})

describe('kills, drops and level-up', () => {
  it('kill awards xp, counts, drops items', () => {
    const gs = mk(); const r = registerKill(gs, 'wolf', always);
    expect(gs.kills).toBe(1); expect(r.xp).toBe(12);
    expect(r.drops.map((d) => d.id)).toEqual(['hp-potion']);
    expect(r.stones).toBeGreaterThan(0); expect(gs.stones).toBe(r.stones);
  });
  it('elites give triple xp/stones and better drop odds', () => {
    const a = mk(), b = mk();
    const normal = registerKill(a, 'wolf', () => 0.2), elite = registerKill(b, 'wolf', () => 0.2, { elite: true });
    expect(elite.xp).toBe(normal.xp * 3);
    expect(normal.drops).toHaveLength(0); expect(elite.drops).toHaveLength(1); // 0.2 >= 0.12 but < 0.24
  });
  it('gathering a herb adds it to the bag', () => {
    const gs = mk(); expect(gatherHerb(gs)).toBe(true); expect(countOf(gs.inventory, 'spirit-herb')).toBe(1);
    gs.inventory.slots.fill({ id: 'iron-sword', count: 1 }); expect(gatherHerb(gs)).toBe(false);
  });
  it('level-up fully heals', () => {
    const gs = mk(); gs.hp = 1;
    const need = 20; // xpToNext(1)
    registerKill(gs, 'golem', never); registerKill(gs, 'golem', never);
    expect(gs.progress.level).toBeGreaterThan(1);
    expect(gs.hp).toBe(statsOf(gs).maxHp);
    expect(need).toBe(20);
  });
  it('boss kill flips the flag, always drops its reward, and quest progress only counts while active', () => {
    const gs = mk(); registerKill(gs, WARDEN_ID, never);
    expect(gs.bossDefeated).toBe(true);
    expect(gs.quests.warden!.kills[WARDEN_ID]).toBeUndefined();
    expect(countOf(gs.inventory, 'jade-sword')).toBe(1); // chance 1 => guaranteed
  });
  it('using potions clamps to max and consumes one', () => {
    const gs = mk(); gs.hp = 10;
    const slot = gs.inventory.slots.findIndex((s) => s?.id === 'hp-potion');
    expect(useItemSlot(gs, slot)).toBe(true);
    expect(gs.hp).toBe(50); expect(countOf(gs.inventory, 'hp-potion')).toBe(1);
    expect(useItemSlot(gs, 19)).toBe(false);
  });
});

describe('unequip', () => {
  it('returns the weapon to the bag and lowers attack', () => {
    const gs = mk(); gs.inventory.weapon = 'iron-sword';
    const atk = statsOf(gs).atk;
    expect(unequipWeapon(gs)).toBe(true);
    expect(gs.inventory.weapon).toBeNull(); expect(countOf(gs.inventory, 'iron-sword')).toBe(1);
    expect(statsOf(gs).atk).toBe(atk - 4);
    expect(unequipWeapon(gs)).toBe(false);
  });
  it('fails without changes when the bag is full', () => {
    const gs = mk(); gs.inventory.weapon = 'iron-sword'; gs.inventory.slots.fill({ id: 'iron-sword', count: 1 });
    expect(unequipWeapon(gs)).toBe(false); expect(gs.inventory.weapon).toBe('iron-sword');
  });
});
