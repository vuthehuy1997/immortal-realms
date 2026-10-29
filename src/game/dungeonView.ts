import Phaser from 'phaser';
import { newRuntime, pitUnder, tickFeatures, trapPhase, BRAZIER_RADIUS, CRACK_TIME, PLATE_RADIUS, type FeatureEvent, type FeatureLayout, type FeatureRuntime, type Trap } from '../core/dungeonFeatures';
import type { Vec2 } from '../core/movement';
import { TILE_SIZE, type WorldMap } from '../core/world';
import { MANIFEST } from './assets';
import { COLORS, type Fx } from './fx';

export interface DungeonHost {
  scene: Phaser.Scene; fx: Fx; world: WorldMap;
  heroPos(): Vec2; setHeroPos(p: Vec2): void;
  /** damage as a share of max HP (traps, falls); respects dash i-frames */
  hurtPct(pct: number, from?: Vec2): void;
  toast(text: string, ms?: number): void; tip(id: string, text: string): void;
  sfx(name: 'slam' | 'roar' | 'telegraph' | 'pickup' | 'hit' | 'crit' | 'moon'): void;
  floatText(at: Vec2, text: string, color: string, big?: boolean): void;
  addStones(n: number): void;
  /** spawn `count` foes of the dungeon's own kind around these rune positions, already hunting the hero */
  spawnAmbush(count: number, at: Vec2[]): void;
  ambushAlive(): number;
}

const SQUASH = 0.55;
const pulse = (t: number, hz: number): number => 0.5 + 0.5 * Math.sin(t * hz * Math.PI * 2);
const STYLE_COLOR = { spike: 0xc8d4e8, fire: 0xff7a30, mist: 0x7fe05a } as const;
const TIPS = {
  spike: 'Floor spikes flash red before they strike. Watch the rhythm and step through the gaps: a hit costs a slice of your health.',
  fire: 'Fire jets glow before they burst. Cross between bursts.',
  mist: 'Poison mist breathes: it thickens, burns, then thins. Cross while it is thin, or dash through.',
  plates: 'A seal bars the way on. Step on every glowing plate in this part of the dungeon to break it.',
  braziers: 'A brazier seal: walk beside every brazier to light it. They burn out, so light them all in one run.',
  collapse: 'Cracked floor crumbles into a pit if you linger. Keep moving. The spirit stones in the middle are worth the risk.',
  ambush: 'Rune circle! Stepping inside calls waves of foes out of the runes. Clear them for a reward.',
} as const;

/** Draws and applies the mechanics of one dungeon (`core/dungeonFeatures.ts` decides everything; this only paints and resolves events). */
export class DungeonView {
  readonly rt: FeatureRuntime;
  private g: Phaser.GameObjects.Graphics;
  private gateG: Phaser.GameObjects.Graphics;
  private t = 0;
  private lastSafe: Vec2;
  private fallCd = 0;
  private spriteAt = new Map<string, Phaser.GameObjects.Sprite | Phaser.GameObjects.Image>();
  private lastPhase = new Map<number, string>();
  private tipTimer = 0;

  constructor(private host: DungeonHost, readonly layout: FeatureLayout) {
    this.rt = newRuntime(layout);
    this.g = host.scene.add.graphics().setDepth(2.5);
    this.gateG = host.scene.add.graphics().setDepth(1e4);
    this.lastSafe = { ...host.heroPos() };
    const sc = host.scene;
    layout.plates.forEach((p, i) => this.fxSprite(`plate${i}`, 'xf_array_seal', p, 0.1, 0xffd060, 0.8));
    layout.braziers.forEach((b, i) => this.fxSprite(`brazier${i}`, 'xf_soul_wisp', { x: b.x, y: b.y - 14 }, 0.1, 0x6080c0, 0.6));
    layout.patches.forEach((p) => this.fxSprite(`cache${p.id}`, 'xf_pill_light', { x: p.centre.x, y: p.centre.y - 6 }, 0.16, 0xffd23f, 0.9));
    if (layout.ambush) {
      layout.ambush.runes.forEach((r, i) => this.fxSprite(`rune${i}`, 'xf_array_seal', r, 0.1, 0xb07bff, 0.55));
      this.fxSprite('ambush', 'xf_star_array', layout.ambush.at, 0.45, 0xb07bff, 0.4, true);
    }
    void sc;
  }

  /** A looping, flattened fx strip lying on the floor. */
  private fxSprite(key: string, fx: string, at: Vec2, scale: number, tint: number, alpha: number, flat = true): void {
    const def = MANIFEST.fx[fx], tex = `fx.${fx}`, sc = this.host.scene;
    if (!def) return;
    const s = def.frames > 1 ? sc.add.sprite(at.x, at.y, tex) : sc.add.image(at.x, at.y, tex);
    s.setOrigin(0.5, 0.5).setScale(scale, flat ? scale * SQUASH : scale).setBlendMode(Phaser.BlendModes.ADD).setTint(tint).setAlpha(alpha).setDepth(flat ? 2 : at.y + 4);
    if (s instanceof Phaser.GameObjects.Sprite && def.frames > 1) s.play({ key: tex, repeat: -1, startFrame: Math.floor(Math.random() * def.frames) });
    this.spriteAt.set(key, s);
  }
  private sprite(key: string): Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | undefined { return this.spriteAt.get(key); }

  /** Cleared dungeons keep their seal open (the puzzle was solved once). */
  preOpen(): void {
    const l = this.layout, w = this.host.world;
    if (!l.gate) return;
    this.rt.gateOpen = true; this.rt.platesOn.fill(true); this.rt.brazierLeft.fill(1);
    for (const i of l.gate.tiles) w.blocked[i] = 0;
    l.plates.forEach((_, i) => this.sprite(`plate${i}`)?.setTint(0x6dff9a));
  }

  // ---------- per frame ----------
  update(dt: number): void {
    this.t += dt;
    const h = this.host, l = this.layout, hero = h.heroPos();
    for (const e of tickFeatures(this.rt, l, hero, dt, h.ambushAlive())) this.onEvent(e);
    this.fallCd = Math.max(0, this.fallCd - dt);
    const pit = pitUnder(this.rt, l, hero);
    if (pit && this.fallCd <= 0) {
      this.fallCd = 1.2; h.hurtPct(pit.fall, pit.centre); h.floatText(hero, 'You fall!', '#c9b8a0', true); h.sfx('slam');
      h.fx.burst(hero.x, hero.y, 0x8a7a60, 14); h.setHeroPos({ ...this.lastSafe });
    } else if (!pit) {
      const tx = Math.floor(hero.x / TILE_SIZE), ty = Math.floor(hero.y / TILE_SIZE);
      const unsafe = l.patches.some((p, pi) => p.tiles.some((tt, i) => tt.x === tx && tt.y === ty && this.rt.patches[pi]![i]!.state !== 'solid'));
      if (!unsafe) this.lastSafe = { ...hero };
    }
    this.draw();
    this.tipTimer += dt;
    if (this.tipTimer > 0.8) { this.tipTimer = 0; this.proximityTips(hero); }
  }

  private proximityTips(hero: Vec2): void {
    const l = this.layout, near = (p: Vec2, d = 150): boolean => Math.hypot(p.x - hero.x, p.y - hero.y) < d;
    for (const t of l.traps) if (near(t.at, t.style === 'mist' ? 190 : 130)) this.host.tip(`dg-${t.style}`, TIPS[t.style]);
    if (l.gate && l.plates.some((p) => near(p))) this.host.tip('dg-plates', TIPS.plates);
    if (l.gate && l.braziers.some((p) => near(p))) this.host.tip('dg-braziers', TIPS.braziers);
    if (l.gate && l.gate.tiles.some((i) => near({ x: ((i % this.host.world.width) + 0.5) * TILE_SIZE, y: (Math.floor(i / this.host.world.width) + 0.5) * TILE_SIZE }, 120))) this.host.tip(l.gate.by === 'plates' ? 'dg-plates' : 'dg-braziers', l.gate.by === 'plates' ? TIPS.plates : TIPS.braziers);
    if (l.patches.some((p) => near(p.centre, 130))) this.host.tip('dg-collapse', TIPS.collapse);
    if (l.ambush && near(l.ambush.at, 130)) this.host.tip('dg-ambush', TIPS.ambush);
  }

  private onEvent(e: FeatureEvent): void {
    const h = this.host, l = this.layout;
    switch (e.type) {
      case 'trapHit': {
        h.hurtPct(e.pct, e.at);
        if (e.style === 'mist') h.floatText(e.at, 'Poison', '#9be36a');
        break;
      }
      case 'plate': {
        const s = this.sprite(`plate${e.index}`); s?.setTint(0x6dff9a).setAlpha(1);
        const p = l.plates[e.index]!; h.fx.ring(p.x, p.y, 24, 0x6dff9a, 420); h.fx.burst(p.x, p.y, 0x6dff9a, 12); h.sfx('pickup');
        h.toast(e.left ? `Seal plate pressed. ${e.left} to go.` : 'Last plate pressed!', 1800); break;
      }
      case 'brazier': {
        const b = l.braziers[e.index]!, s = this.sprite(`brazier${e.index}`); s?.setTint(0xff9a3a).setAlpha(1).setScale(0.2);
        h.fx.ring(b.x, b.y, 26, 0xff9a3a, 380); h.fx.burst(b.x, b.y - 10, 0xff9a3a, 12); h.sfx('moon');
        h.toast(`Brazier lit (${e.lit}/${e.of})`, 1400); break;
      }
      case 'brazierOut': { const s = this.sprite(`brazier${e.index}`); s?.setTint(0x6080c0).setAlpha(0.6).setScale(0.1, 0.1 * SQUASH); h.toast('A brazier burned out. Light them all in one run!', 1800); break; }
      case 'gateOpen': this.openGate(e.by); break;
      case 'crack': {
        const p = l.patches.find((x) => x.id === e.patch)!, tt = p.tiles[e.tile]!;
        h.fx.burst((tt.x + 0.5) * TILE_SIZE, (tt.y + 0.5) * TILE_SIZE, 0x8a7a60, 3); break;
      }
      case 'pit': {
        const p = l.patches.find((x) => x.id === e.patch)!, tt = p.tiles[e.tile]!;
        h.fx.burst((tt.x + 0.5) * TILE_SIZE, (tt.y + 0.5) * TILE_SIZE, 0x5a4a38, 5); if (Math.random() < 0.3) h.sfx('slam'); break;
      }
      case 'regrow': break;
      case 'fall': break;
      case 'cache': {
        const s = this.sprite(`cache${e.patch}`); s?.setVisible(false);
        h.addStones(e.stones); h.floatText(e.at, `+${e.stones} stones`, '#7fd8ff', true); h.fx.burst(e.at.x, e.at.y - 6, COLORS.gold, 16); h.sfx('pickup');
        h.toast(`Hidden cache: +${e.stones} spirit stones`, 2200); break;
      }
      case 'ambushStart': h.toast('Ambush! The runes flare and foes pour out.', 2600); h.sfx('roar'); h.tip('dg-ambush', TIPS.ambush); break;
      case 'ambushWave': {
        h.toast(`Wave ${e.wave}`, 1500); h.sfx('telegraph');
        for (const r of e.at) { h.fx.ring(r.x, r.y, 34, 0xb07bff, 480); h.fx.play('xf_soul_wisp', r.x, r.y - 10, { scale: 0.25, tint: 0xb07bff }); }
        h.spawnAmbush(e.count, e.at); break;
      }
      case 'ambushDone': {
        h.addStones(e.stones); h.toast(`Ambush cleared: +${e.stones} spirit stones`, 3200); h.sfx('crit');
        const a = l.ambush!; h.fx.ring(a.at.x, a.at.y, 90, COLORS.gold, 700); h.fx.play('xf_ascend', a.at.x, a.at.y, { scale: 0.5, tint: COLORS.gold });
        for (const k of [...this.spriteAt.keys()]) if (k.startsWith('rune') || k === 'ambush') this.spriteAt.get(k)?.setAlpha(0.12);
        break;
      }
    }
  }

  private openGate(by: 'plates' | 'braziers'): void {
    const h = this.host, w = h.world, gate = this.layout.gate!;
    for (const i of gate.tiles) {
      w.blocked[i] = 0;
      const x = ((i % w.width) + 0.5) * TILE_SIZE, y = (Math.floor(i / w.width) + 0.5) * TILE_SIZE;
      h.fx.burst(x, y - 8, 0xc9a7ff, 4);
      if (i % 3 === 0) h.fx.play('xf_mirror_shatter', x, y - 10, { scale: 0.22, tint: 0xc9a7ff, depth: y + 6 });
    }
    h.fx.shake(380, 0.007); h.sfx('roar');
    h.toast(by === 'plates' ? 'The seal shatters: the way to the guardian is open!' : 'The braziers blaze and the seal dissolves!', 3200);
  }

  // ---------- drawing ----------
  private draw(): void {
    const g = this.g, gg = this.gateG, l = this.layout, rt = this.rt, w = this.host.world, t = this.t;
    g.clear(); gg.clear();
    for (const tr of l.traps) this.drawTrap(g, tr);
    // collapsing floor
    l.patches.forEach((p, pi) => p.tiles.forEach((tt, i) => {
      const s = rt.patches[pi]![i]!, x = tt.x * TILE_SIZE, y = tt.y * TILE_SIZE;
      if (s.state === 'solid') { g.lineStyle(1, 0x2a2018, 0.5).lineBetween(x + 3, y + 5, x + 9, y + 9).lineBetween(x + 9, y + 9, x + 13, y + 4); }
      else if (s.state === 'cracking') {
        const k = 1 - s.t / CRACK_TIME, sh = Math.sin(t * 40 + i) * 0.6;
        g.fillStyle(0x4a3020, 0.45 + 0.3 * k).fillRect(x + sh, y, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1.5, 0xff9a3a, 0.5 + 0.5 * k).lineBetween(x + 1, y + 2, x + 8, y + 8).lineBetween(x + 8, y + 8, x + 15, y + 3).lineBetween(x + 8, y + 8, x + 6, y + 15);
      } else {
        const fade = Math.min(1, s.t / 0.8);
        g.fillStyle(0x07050a, 0.95 * Math.min(1, fade + 0.2)).fillRect(x, y, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x6a5a48, 0.8).strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }));
    // plate / brazier rings
    l.plates.forEach((p, i) => { g.lineStyle(1.5, rt.platesOn[i] ? 0x6dff9a : 0xffd060, 0.8).strokeEllipse(p.x, p.y, PLATE_RADIUS * 2, PLATE_RADIUS * 2 * SQUASH); });
    l.braziers.forEach((b, i) => {
      const left = rt.brazierLeft[i]!, lit = left > 0;
      g.fillStyle(0x1a1410, 0.95).fillEllipse(b.x, b.y, 16, 9).lineStyle(1.5, 0x8a6a40, 1).strokeEllipse(b.x, b.y, 16, 9);
      if (lit) {
        g.lineStyle(2, 0xffb050, 0.9).beginPath().arc(b.x, b.y, BRAZIER_RADIUS * 0.55, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * left) / Math.max(0.1, l.litFor)).strokePath();
        g.fillStyle(0xff9a3a, 0.16 + 0.08 * pulse(t + i, 3)).fillCircle(b.x, b.y - 10, 22);
      }
      this.sprite(`brazier${i}`)?.setDepth(b.y + 4).setY(b.y - 12);
    });
    if (l.ambush && rt.ambush.state !== 'done') { g.lineStyle(1.5, 0xb07bff, 0.25 + 0.15 * pulse(t, 0.8)).strokeEllipse(l.ambush.at.x, l.ambush.at.y, l.ambush.radius * 2, l.ambush.radius * 2 * SQUASH); }
    // seal gate: glowing talisman wall
    if (l.gate && !rt.gateOpen) {
      for (const i of l.gate.tiles) {
        const x = (i % w.width) * TILE_SIZE, y = Math.floor(i / w.width) * TILE_SIZE, a = 0.5 + 0.25 * pulse(t + i * 0.13, 1.1);
        gg.fillStyle(0x6a3fd0, 0.3 * a).fillRect(x, y - 22, TILE_SIZE, TILE_SIZE + 22);
        gg.fillStyle(0xc9a7ff, 0.28 * a).fillRect(x + 2, y - 18, TILE_SIZE - 4, TILE_SIZE + 14);
        gg.fillStyle(0xffffff, 0.5 * a).fillRect(x + 6, y - 22 + ((t * 18 + i * 5) % 30), 4, 6);
        gg.lineStyle(1, 0xe9d8ff, 0.7 * a).lineBetween(x, y - 22, x, y + TILE_SIZE).lineBetween(x + TILE_SIZE, y - 22, x + TILE_SIZE, y + TILE_SIZE);
      }
    }
  }

  private drawTrap(g: Phaser.GameObjects.Graphics, tr: Trap): void {
    const { phase, left, cycle } = trapPhase(tr, this.rt.clock), c = STYLE_COLOR[tr.style], k = this.t;
    const prev = this.lastPhase.get(tr.id);
    if (prev !== phase) {
      this.lastPhase.set(tr.id, phase);
      if (phase === 'active' && prev !== undefined) this.activeFx(tr, cycle);
    }
    if (tr.style === 'mist') {
      const a = phase === 'active' ? 0.5 : phase === 'warn' ? 0.2 + 0.25 * (1 - left / tr.warn) : 0.09;
      for (let i = 0; i < 6; i++) {
        const ang = k * 0.4 + (i * Math.PI) / 3, r = tr.radius * (0.35 + 0.25 * Math.sin(k * 0.9 + i)), x = tr.at.x + Math.cos(ang) * r, y = tr.at.y + Math.sin(ang) * r * SQUASH;
        g.fillStyle(0x6fd04a, a * 0.55).fillEllipse(x, y, tr.radius * 1.3, tr.radius * 1.3 * SQUASH);
      }
      g.fillStyle(0x9be36a, a * 0.55).fillEllipse(tr.at.x, tr.at.y, tr.radius * 2.1, tr.radius * 2.1 * SQUASH);
      if (phase === 'warn') g.lineStyle(1.5, 0xff3b30, 0.5 + 0.4 * pulse(k, 5)).strokeEllipse(tr.at.x, tr.at.y, tr.radius * 2, tr.radius * 2 * SQUASH);
      if (phase === 'active' && Math.random() < 0.35) this.host.fx.burst(tr.at.x + (Math.random() - 0.5) * tr.radius * 1.4, tr.at.y + (Math.random() - 0.5) * tr.radius * 0.6, 0x9be36a, 1);
      return;
    }
    const r = tr.radius, x = tr.at.x, y = tr.at.y;
    // base plate, always visible so the rhythm can be learned
    g.fillStyle(0x15121a, 0.9).fillEllipse(x, y, r * 2.1, r * 2.1 * SQUASH).lineStyle(1, 0x6a6070, 0.9).strokeEllipse(x, y, r * 2.1, r * 2.1 * SQUASH);
    for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2 + 0.78; g.fillStyle(tr.style === 'fire' ? 0x6a2a10 : 0x3a3a44, 1).fillCircle(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45 * SQUASH, 1.6); }
    if (phase === 'warn') {
      const f = 1 - left / tr.warn;
      g.fillStyle(0xff3b30, 0.18 + 0.3 * f).fillEllipse(x, y, r * 2.4, r * 2.4 * SQUASH).lineStyle(2, 0xff5a4a, 0.9).strokeEllipse(x, y, r * 2.4, r * 2.4 * SQUASH);
      if (tr.style === 'fire') g.fillStyle(0xff9a3a, 0.5 * f).fillCircle(x, y - 3, 4 + 4 * f);
    } else if (phase === 'active') {
      if (tr.style === 'spike') { for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2, px = x + (i ? Math.cos(a) * r * 0.55 : 0), py = y + (i ? Math.sin(a) * r * 0.3 : 0); g.fillStyle(c, 1).fillTriangle(px - 2.5, py, px + 2.5, py, px, py - 13).lineStyle(1, 0xffffff, 0.9).lineBetween(px, py - 13, px, py - 3); } }
      else { g.fillStyle(0xff7a30, 0.85).fillEllipse(x, y - 5, r * 1.3, 20).fillStyle(0xffe27a, 0.9).fillEllipse(x, y - 6, r * 0.8, 14).fillStyle(0xff4a10, 0.4).fillEllipse(x, y - 14, r * 0.9, 14); }
    }
  }

  private activeFx(tr: Trap, cycle: number): void {
    void cycle;
    const h = this.host, hero = h.heroPos();
    if (Math.hypot(hero.x - tr.at.x, hero.y - tr.at.y) > 260) return;
    if (tr.style === 'spike') h.fx.play('xf_stone_spike', tr.at.x, tr.at.y + 2, { scale: 0.13, tint: 0xd8e0ee, blend: 'normal', alpha: 0.9, depth: tr.at.y + 3 });
    else { h.fx.burst(tr.at.x, tr.at.y - 8, 0xff8a30, 10); h.fx.play('xf_soul_wisp', tr.at.x, tr.at.y - 10, { scale: 0.22, tint: 0xff7a30, depth: tr.at.y + 3 }); }
  }

  /** compact state for the test hooks */
  snapshot(): { gateAt: Vec2 | null; plateAt: Vec2[]; brazierAt: Vec2[]; ambushAt: Vec2 | null; gateTiles: number; gateOpen: boolean; plates: boolean[]; braziers: number[]; traps: { id: number; style: string; phase: string; x: number; y: number }[]; patches: { id: number; states: string[]; x: number; y: number }[]; ambush: string; ambushWave: number } {
    const rt = this.rt, l = this.layout;
    return {
      gateAt: l.gate ? this.gateCentre() : null, plateAt: l.plates, brazierAt: l.braziers, ambushAt: l.ambush?.at ?? null, gateTiles: l.gate?.tiles.length ?? 0,
      gateOpen: rt.gateOpen, plates: [...rt.platesOn], braziers: rt.brazierLeft.map((x) => Math.round(x * 10) / 10),
      traps: l.traps.map((t) => ({ id: t.id, style: t.style, phase: trapPhase(t, rt.clock).phase, x: t.at.x, y: t.at.y })),
      patches: l.patches.map((p, i) => ({ id: p.id, states: rt.patches[i]!.map((s) => s.state), x: p.centre.x, y: p.centre.y })),
      ambush: rt.ambush.state, ambushWave: rt.ambush.wave,
    };
  }

  private gateCentre(): Vec2 {
    const w = this.host.world.width, t = this.layout.gate!.tiles, mid = t[Math.floor(t.length / 2)]!;
    return { x: ((mid % w) + 0.5) * TILE_SIZE, y: (Math.floor(mid / w) + 0.5) * TILE_SIZE };
  }

  destroy(): void { this.g.destroy(); this.gateG.destroy(); for (const s of this.spriteAt.values()) s.destroy(); this.spriteAt.clear(); }
}
