// Prints how every zone, dungeon and boss plays for a flame-root hero, using the same formulas as tests/balanceWorld.test.ts.
//   node tools/balance_report.mjs [chapter]
// Columns: ttk = seconds of pure sword-combo damage to kill one foe; "%hp" = share of the hero's HP lost per fight.
import './ts-loader.mjs';
const src = (p) => import(new URL(`../src/${p}.ts`, import.meta.url).href);
const [{ scaledEnemy }, { deriveStats }, { COMBO }, { BOSSES }, { CHAPTERS, CHAPTER_IDS }, { DUNGEONS }, { ENEMIES }, { REALMS }, { ZONES, zonesOfChapter }] = await Promise.all([
  src('core/balance'), src('core/character'), src('core/combo'), src('data/boss'), src('data/chapters'), src('data/dungeons'), src('data/enemies'), src('data/realms'), src('data/zones'),
]);
const only = process.argv[2] ? Number(process.argv[2]) : null;
const realmAt = (l) => REALMS.reduce((b, r, i) => (l >= r.reqLevel ? i : b), 0);
const stats = (l, gear) => deriveStats('flame', l, realmAt(l), gear);
const cycle = COMBO.reduce((a, h) => a + h.recover, 0);
const dps = (s, d) => COMBO.reduce((a, h) => a + Math.max(1, s.atk * h.mult - d * 0.5) * (1 + s.critChance * (s.critMult - 1)), 0) / cycle;
const f = (v, n = 1) => v.toFixed(n);
for (const n of CHAPTER_IDS.filter((c) => !only || c === only)) {
  const ch = CHAPTERS[n];
  console.log(`\n=== Chapter ${n}: ${ch.name} ===`);
  const zones = [...zonesOfChapter(n).map((z) => ZONES[z]), ...Object.values(DUNGEONS).filter((d) => d.chapter === n).map((d) => ZONES[d.id])].filter((z) => Object.keys(z.spawns).length);
  let top = 0;
  for (const z of zones) {
    const m = /Lv (\d+)-(\d+)/.exec(z.level); if (!m) continue; const lvl = Math.round((+m[1] + +m[2]) / 2); top = Math.max(top, +m[2]);
    const a = stats(lvl, ch.gear.arrive), s = stats(lvl, ch.gear.shop);
    console.log(`${z.id.padEnd(14)} L${String(lvl).padEnd(3)} tier hp${z.tier.hp} atk${z.tier.atk} | hero hp ${a.maxHp} atk ${a.atk} def ${a.def}`);
    for (const id of Object.keys(z.spawns)) {
      const e = ENEMIES[id], sc = scaledEnemy(e, z.id), ttk = sc.maxHp / dps(a, sc.def), ttkS = sc.maxHp / dps(s, sc.def), d = Math.max(1, sc.atk - a.def * 0.5) / e.attackCooldown;
      console.log(`   ${id.padEnd(16)} hp ${String(sc.maxHp).padEnd(6)} atk ${String(sc.atk).padEnd(4)} ttk ${f(ttk).padStart(5)}s (shop ${f(ttkS)}s)  hero dies in ${f(a.maxHp / d, 0)}s  fight costs ${f(d * ttk / a.maxHp * 100, 0)}%hp`);
    }
  }
  const s = stats(top, ch.gear.shop);
  for (const b of Object.values(BOSSES).filter((x) => x.chapter === n)) console.log(`BOSS ${b.id.padEnd(16)} hp ${String(b.maxHp).padEnd(6)} atk ${String(b.atk).padEnd(4)} ttk ${f(b.maxHp / dps(s, b.def), 0)}s at L${top}  heaviest hit ~${f((b.atk * 1.9 - s.def * 0.5) / s.maxHp * 100, 0)}%hp${b.dungeon ? ' (dungeon)' : ''}`);
}
