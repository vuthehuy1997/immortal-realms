import { describe, expect, it } from 'vitest';
import { newGameState } from '../src/core/gameState';
import { ACTIVE_KEY, activeSlot, allSlots, backupKey, continueSlot, deleteSlot, exportSlot, firstEmptySlot, importToSlot, loadSlot, saveToSlot, setActiveSlot, slotInfo, slotKey, type StorageLike } from '../src/core/slots';

const mem = (): StorageLike & { m: Map<string, string> } => { const m = new Map<string, string>(); return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }; };
const gs = (name: string, level = 1) => { const g = newGameState(name, 'flame', 'swordsman', { x: 10, y: 10 }); g.progress.level = level; return g; };

describe('save slots', () => {
  it('slot 1 uses the legacy key so older saves still load', () => {
    expect(slotKey(1)).toBe('immortal-realms/save-v1');
    const st = mem(); saveToSlot(st, 1, gs('Old'));
    expect(loadSlot(st, 1).ok).toBe(true);
  });
  it('slots are independent and summarised', () => {
    const st = mem(); saveToSlot(st, 1, gs('A', 3)); saveToSlot(st, 3, gs('C', 7));
    expect(allSlots(st).map((s) => s.status)).toEqual(['ok', 'empty', 'ok']);
    const c = slotInfo(st, 3); expect(c.status === 'ok' && c.name === 'C' && c.level === 7).toBe(true);
    expect(firstEmptySlot(st)).toBe(2);
  });
  it('active slot defaults to 1, ignores junk, and Continue falls back to a slot that has data', () => {
    const st = mem(); expect(activeSlot(st)).toBe(1); expect(continueSlot(st)).toBeNull();
    st.setItem(ACTIVE_KEY, '9'); expect(activeSlot(st)).toBe(1);
    saveToSlot(st, 2, gs('B')); setActiveSlot(st, 3);
    expect(continueSlot(st)).toBe(2); // slot 3 is empty
    setActiveSlot(st, 2); expect(continueSlot(st)).toBe(2);
  });
  it('keeps the previous good save as a backup and recovers from a corrupted main file', () => {
    const st = mem(); saveToSlot(st, 1, gs('First', 2)); saveToSlot(st, 1, gs('Second', 5));
    expect(st.m.has(backupKey(1))).toBe(true);
    st.setItem(slotKey(1), 'garbage {{{');
    const r = loadSlot(st, 1);
    expect(r.ok && r.recovered && r.state.character.name === 'First').toBe(true);
    const i = slotInfo(st, 1); expect(i.status === 'ok' && i.recovered).toBe(true);
  });
  it('a corrupted backup is never used and a corrupt save without a backup is reported', () => {
    const st = mem(); saveToSlot(st, 1, gs('Only')); st.setItem(slotKey(1), 'x');
    const r = loadSlot(st, 1); expect(r.ok).toBe(false);
    expect(slotInfo(st, 1)).toMatchObject({ status: 'corrupt', hasBackup: false });
    saveToSlot(st, 2, gs('B')); saveToSlot(st, 2, gs('B2')); st.setItem(backupKey(2), 'bad'); st.setItem(slotKey(2), 'bad');
    expect(loadSlot(st, 2).ok).toBe(false);
  });
  it('a corrupt main file is not backed up over a good backup', () => {
    const st = mem(); saveToSlot(st, 1, gs('A')); saveToSlot(st, 1, gs('B')); st.setItem(slotKey(1), 'junk');
    saveToSlot(st, 1, gs('C')); // junk must not replace the good backup
    const c = loadSlot(st, 1); expect(c.ok && c.state.character.name).toBe('C');
    const bak = JSON.parse(st.getItem(backupKey(1))!); expect(bak.state.character.name).toBe('A');
  });
  it('delete clears main and backup; invalid slot numbers are rejected', () => {
    const st = mem(); saveToSlot(st, 2, gs('A')); saveToSlot(st, 2, gs('B')); deleteSlot(st, 2);
    expect(slotInfo(st, 2).status).toBe('empty'); expect(st.m.size).toBe(0);
    expect(saveToSlot(st, 0, gs('X'))).toBe(false); expect(saveToSlot(st, 4, gs('X'))).toBe(false); expect(loadSlot(st, 7).ok).toBe(false);
  });
  it('export/import round-trips, and import refuses tampered or garbage files without touching the slot', () => {
    const a = mem(), b = mem(); saveToSlot(a, 1, gs('Hero', 4));
    const text = exportSlot(a, 1)!;
    expect(importToSlot(b, 2, text).ok).toBe(true);
    const i = slotInfo(b, 2); expect(i.status === 'ok' && i.name === 'Hero').toBe(true);
    saveToSlot(b, 3, gs('Keep'));
    expect(importToSlot(b, 3, text.replace(/"hp":\d+/, '"hp":99999')).ok).toBe(false);
    expect(importToSlot(b, 3, 'nope').ok).toBe(false);
    const k = slotInfo(b, 3); expect(k.status === 'ok' && k.name === 'Keep').toBe(true);
    expect(exportSlot(b, 1)).toBeNull();
  });
});
