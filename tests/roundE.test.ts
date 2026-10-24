import { describe, expect, it } from 'vitest';
import { boonTag, BOONS, TAG_LABEL } from '../src/data/boons';
import { newGameState } from '../src/core/gameState';
import { parseSave, serialize, checksum } from '../src/core/save';
import { getDialogue } from '../src/core/dialogue';
import { newInventory } from '../src/core/inventory';
import { newQuestLog } from '../src/core/quest';

describe('boon cards', () => {
  it('every boon has an offence/defence/utility tag with a glyph and label', () => {
    const seen = new Set<string>();
    for (const b of Object.values(BOONS)) { const t = boonTag(b.mods); seen.add(t); expect(TAG_LABEL[t][0].length).toBeGreaterThan(0); }
    expect(seen.size).toBe(3);
    expect(boonTag(BOONS['sword-heart']!.mods)).toBe('off'); expect(boonTag(BOONS['iron-bone']!.mods)).toBe('def'); expect(boonTag(BOONS['deep-lake']!.mods)).toBe('util');
  });
});

describe('tips are saved', () => {
  it('hints round-trip, old saves get none, junk is rejected', () => {
    const gs = newGameState('Lin', 'flame', 'swordsman', { x: 1, y: 1 }); gs.hints = ['flask', 'dodge'];
    const r = parseSave(serialize(gs)); expect(r.ok && r.state.hints).toEqual(['flask', 'dodge']);
    const env = JSON.parse(serialize(gs)) as { state: Record<string, unknown>; checksum: string };
    delete env.state.hints; env.checksum = checksum(JSON.stringify(env.state));
    const o = parseSave(JSON.stringify(env)); expect(o.ok && o.state.hints).toEqual([]);
    gs.hints = [123 as unknown as string]; expect(parseSave(serialize(gs)).ok).toBe(false);
  });
});

describe('Trial Rift keeper explains the rules', () => {
  it('the dialogue states the rules and a recommended level', () => {
    const d = getDialogue('keeper-ming', newQuestLog(), newInventory(), [], { best: 0, active: false });
    expect(d.text).toContain('Rules'); expect(d.text).toContain('deeper than your best'); expect(d.text).toContain('Level 8');
  });
});
