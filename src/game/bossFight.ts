import Phaser from 'phaser';
import { damagePylon, damageWisp, filterDamage, newMech, shatterDecoy, tickMech, beamHits, poolDps, type MechEvent, type MechState } from '../core/bossMech';
import type { Vec2 } from '../core/movement';
import { bossSpriteKey, type BossDef } from '../data/boss';
import { Actor } from './actor';
import { MANIFEST, sheetOf } from './assets';
import { COLORS, type Fx } from './fx';

/** What the fight view needs from the scene: no Phaser scene internals, only these services. */
export interface FightHost {
  scene: Phaser.Scene;
  fx: Fx;
  heroPos(): Vec2;
  heroRadius: number;
  hurtHero(attack: number, from?: Vec2): void;
  /** hero damage against something with `def` for an attack multiplier of `mult` (the scene's damage formula) */
  damageTo(def: number, mult: number): number;
  floatText(at: Vec2, text: string, color: string, big?: boolean): void;
  toast(text: string, ms?: number): void;
  tip(id: string, text: string): void;
  sfx(name: 'slam' | 'roar' | 'telegraph' | 'pickup' | 'hit' | 'crit'): void;
  /** snap a point to open floor */
  free(p: Vec2): Vec2;
}
export interface FightTarget { pos: Vec2; radius: number; key: unknown; hit(mult: number, o?: { dot?: boolean }): void }

/** What the fight needs from the boss entity it decorates. */
export interface FightBoss { def: BossDef; actor: Actor; pos: Vec2; c: { hp: number; maxHp: number }; ai: { hidden: boolean; phase: 1 | 2 | 3 } }

const ELLIPSE = 0.5; // ground ellipses are squashed to read as lying on the floor
const pulse = (t: number, hz: number): number => 0.5 + 0.5 * Math.sin(t * hz * Math.PI * 2);

interface Orbiter { s: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite; a: number }

/**
 * One boss fight's identity layer: satellites and sigil (look), plus the state and drawing of its mechanic (ward shell, mirror decoys, pools,
 * beams, pylons, leech wisps). Rules live in `core/bossMech.ts`; this class only draws and routes the scene's hits and damage.
 */
export class BossFight {
  mech: MechState;
  private g: Phaser.GameObjects.Graphics;
  private orbit: Orbiter[] = [];
  private sigil: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | null = null;
  private decoys = new Map<number, Actor>();
  private pylonSprites = new Map<number, { img: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image }>();
  private wispSprites = new Map<number, Phaser.GameObjects.Sprite | Phaser.GameObjects.Image>();
  private wardImg: Phaser.GameObjects.Image | null = null;
  private poolBurn = 0;
  private home: Vec2;
  private t = 0;

  constructor(private host: FightHost, private b: FightBoss, home: Vec2) {
    this.home = home;
    this.mech = newMech(b.def);
    this.g = host.scene.add.graphics();
    this.buildLook();
  }

  private get accent(): number { const l = this.b.def.look; return l?.sigil?.color ?? l?.ramp?.[1] ?? COLORS.boss; }

  private buildLook(): void {
    const l = this.b.def.look, sc = this.host.scene;
    if (!l) return;
    if (l.sigil) {
      const f = sheetFx(l.sigil.fx), key = `fx.${l.sigil.fx}`;
      const img = f && f.frames > 1 ? sc.add.sprite(this.b.pos.x, this.b.pos.y, key) : sc.add.image(this.b.pos.x, this.b.pos.y, key);
      img.setOrigin(0.5, 0.5).setBlendMode(Phaser.BlendModes.ADD).setTint(l.sigil.color).setAlpha(0.55).setDepth(2);
      img.setDisplaySize(l.sigil.size, l.sigil.size * ELLIPSE);
      if (img instanceof Phaser.GameObjects.Sprite && f && f.frames > 1) img.play({ key, repeat: -1 });
      this.sigil = img;
    }
    if (l.orbit) {
      const o = l.orbit, f = sheetFx(o.fx), key = `fx.${o.fx}`;
      for (let i = 0; i < o.count; i++) {
        const s = f && f.frames > 1 ? sc.add.sprite(0, 0, key) : sc.add.image(0, 0, key);
        s.setScale(o.scale).setTint(o.tint).setBlendMode(Phaser.BlendModes.ADD);
        if (s instanceof Phaser.GameObjects.Sprite && f && f.frames > 1) s.play({ key, repeat: -1, startFrame: (i * 3) % f.frames });
        this.orbit.push({ s, a: (i / o.count) * Math.PI * 2 });
      }
    }
  }

  // ---------- per frame ----------
  /** Advance the mechanics and redraw. `engaged` false freezes the mechanic (the boss is idle in its court). */
  update(dt: number, engaged: boolean, hpRatio: number, rng: () => number, target: Vec2): void {
    this.t += dt;
    const b = this.b, l = b.def.look, hidden = b.ai.hidden;
    const ev = tickMech(this.mech, b.def, { phase: b.ai.phase, self: b.pos, target, home: this.home, dt, rng, engaged });
    for (const e of ev) this.onEvent(e);
    void hpRatio;
    // look: satellites and sigil follow the body
    if (this.sigil) { this.sigil.setPosition(b.pos.x, b.pos.y - 1).setAlpha(hidden ? 0.15 : 0.4 + 0.2 * pulse(this.t, 0.5)); }
    if (l?.orbit) {
      const o = l.orbit, speed = o.speed * (b.ai.phase === 3 ? 1.6 : 1);
      for (const it of this.orbit) {
        it.a += dt * speed;
        const x = b.pos.x + Math.cos(it.a) * o.radius, y = b.pos.y + Math.sin(it.a) * o.radius * 0.38 - (o.lift ?? 30);
        it.s.setPosition(x, y).setDepth(b.pos.y + Math.sin(it.a) * 12 + 1).setAlpha(hidden ? 0 : 0.95).setRotation(it.s instanceof Phaser.GameObjects.Sprite && o.fx === 'xf_flying_sword' ? Math.sin(it.a) * 0.4 : 0);
      }
    }
    this.drawMech(dt, engaged);
  }

  private drawMech(dt: number, engaged: boolean): void {
    const g = this.g, m = this.mech, b = this.b, hero = this.host.heroPos();
    g.clear().setDepth(b.pos.y + 3);
    // ward shell
    if (m.ward) {
      if (!this.wardImg) this.wardImg = this.host.scene.add.image(b.pos.x, b.pos.y, 'ring').setBlendMode(Phaser.BlendModes.ADD).setTint(this.accent);
      const sz = b.def.radius * 3.6 * (1 + 0.04 * pulse(this.t, 1.2));
      this.wardImg.setPosition(b.pos.x, b.pos.y - this.bodyHeight() * 0.4).setDisplaySize(sz, sz * 0.9).setDepth(b.pos.y + 2).setAlpha(0.5 + 0.3 * pulse(this.t, 1.5));
      const w = 44, x = b.pos.x - w / 2, y = b.pos.y - this.bodyHeight() - 8;
      g.fillStyle(0x0a1020, 0.8).fillRect(x - 1, y - 1, w + 2, 5).fillStyle(this.accent, 0.95).fillRect(x, y, (w * m.ward.hp) / m.ward.max, 3);
    } else if (this.wardImg) { this.wardImg.destroy(); this.wardImg = null; }
    // pools: red warning ring, then a bubbling glow
    for (const q of m.pools) {
      const warn = q.warn > 0, c = this.accent;
      if (warn) {
        const k = 1 - q.warn / (this.b.def.mech?.pools?.warn ?? 1);
        g.lineStyle(2, 0xff3b30, 0.9).strokeEllipse(q.at.x, q.at.y, q.radius * 2, q.radius * 2 * ELLIPSE);
        g.fillStyle(0xff3b30, 0.12 + 0.2 * k).fillEllipse(q.at.x, q.at.y, q.radius * 2 * k, q.radius * 2 * ELLIPSE * k);
      } else {
        const fade = Math.min(1, q.ttl / 1.2);
        g.fillStyle(0x3a0c00, 0.5 * fade).fillEllipse(q.at.x, q.at.y, q.radius * 2.3, q.radius * 2.3 * ELLIPSE);
        g.fillStyle(c, 0.6 * fade).fillEllipse(q.at.x, q.at.y, q.radius * 2, q.radius * 2 * ELLIPSE);
        g.fillStyle(0xffd060, 0.75 * fade * (0.6 + 0.4 * pulse(this.t + q.id, 1.8))).fillEllipse(q.at.x, q.at.y, q.radius * 1.2, q.radius * 1.2 * ELLIPSE);
        g.lineStyle(2, 0xff5a20, 0.95 * fade).strokeEllipse(q.at.x, q.at.y, q.radius * 2, q.radius * 2 * ELLIPSE);
        if (Math.random() < dt * 3) this.host.fx.burst(q.at.x + (Math.random() - 0.5) * q.radius, q.at.y, 0xffa040, 2);
      }
    }
    if (m.pools.length && engaged) {
      this.poolBurn += dt;
      const dps = poolDps(m, b.def, hero, this.host.heroRadius);
      if (dps > 0 && this.poolBurn >= 0.6) { this.poolBurn = 0; this.host.hurtHero(b.def.atk * dps * 0.6, b.pos); }
    }
    // beams
    const bm = m.beam;
    if (bm) {
      for (let k = 0; k < bm.arms; k++) {
        const a = bm.angle + (k * Math.PI * 2) / bm.arms, ex = bm.origin.x + Math.cos(a) * bm.length, ey = bm.origin.y + Math.sin(a) * bm.length * 1;
        if (bm.warn > 0) { // a wide pulsing red band with bright edges and a hot core: readable on a dark floor
          const p = 0.5 + 0.5 * Math.sin(this.t * 14), w = bm.width + this.host.heroRadius * 0.6;
          g.lineStyle(w * 2, 0xff2a1a, 0.18 + 0.14 * p).lineBetween(bm.origin.x, bm.origin.y, ex, ey);
          const nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
          g.lineStyle(2, 0xff8a60, 0.8).lineBetween(bm.origin.x + nx, bm.origin.y + ny, ex + nx, ey + ny).lineBetween(bm.origin.x - nx, bm.origin.y - ny, ex - nx, ey - ny);
          g.lineStyle(2.5, 0xffe0c0, 0.55 + 0.4 * p).lineBetween(bm.origin.x, bm.origin.y, ex, ey);
        } else {
          g.lineStyle(bm.width * 2.6, this.accent, 0.28).lineBetween(bm.origin.x, bm.origin.y, ex, ey);
          g.lineStyle(bm.width * 1.2, this.accent, 0.75).lineBetween(bm.origin.x, bm.origin.y, ex, ey);
          g.lineStyle(bm.width * 0.4, 0xffffff, 0.95).lineBetween(bm.origin.x, bm.origin.y, ex, ey);
          g.fillStyle(0xffffff, 0.9).fillCircle(ex, ey, bm.width * 0.7);
        }
      }
      // hub on the floor under the boss, tethered up to its body so the wheel reads as the boss's own attack
      g.fillStyle(this.accent, 0.45).fillEllipse(bm.origin.x, bm.origin.y, bm.width * 3.2, bm.width * 3.2 * ELLIPSE);
      g.lineStyle(2, 0xffffff, 0.8).strokeEllipse(bm.origin.x, bm.origin.y, bm.width * 3.2, bm.width * 3.2 * ELLIPSE);
      g.lineStyle(2, this.accent, 0.5).lineBetween(bm.origin.x, bm.origin.y, b.pos.x, b.pos.y - this.bodyHeight() * 0.5);
      if (engaged && beamHits(bm, hero, this.host.heroRadius)) this.host.hurtHero(b.def.atk * (b.def.mech?.beams?.damageMult ?? 1), bm.origin);
    }
    // pylons: pillar, glow, link to the boss, hp bar
    for (const p of m.pylons) {
      const s = this.pylonSprites.get(p.id);
      if (s) {
        s.glow.setAlpha(0.45 + 0.3 * pulse(this.t + p.id, 1.4));
        g.lineStyle(2, this.accent, 0.35 + 0.35 * pulse(this.t + p.id, 2)).lineBetween(p.at.x, p.at.y - 24, b.pos.x, b.pos.y - this.bodyHeight() * 0.4);
        g.fillStyle(0x0a1020, 0.8).fillRect(p.at.x - 11, p.at.y + 3, 22, 4).fillStyle(0xffe08a, 0.95).fillRect(p.at.x - 10, p.at.y + 4, (20 * p.hp) / p.maxHp, 2);
      }
    }
    // wisps
    for (const w of m.wisps) {
      const s = this.wispSprites.get(w.id);
      if (s) s.setPosition(w.pos.x, w.pos.y - 10 + Math.sin(this.t * 6 + w.id) * 2).setDepth(w.pos.y + 4);
      g.lineStyle(1, 0xff5ad0, 0.25).lineBetween(w.pos.x, w.pos.y - 8, b.pos.x, b.pos.y - this.bodyHeight() * 0.3);
    }
    // illusion markers: a gold ring + chevron under the REAL one, cyan broken rings under the images
    if (m.illusion && !b.ai.hidden) {
      const p = 0.5 + 0.5 * Math.sin(this.t * 5), r = b.def.radius * 2.4;
      g.lineStyle(2.5, 0xffd23f, 0.6 + 0.35 * p).strokeEllipse(b.pos.x, b.pos.y, r, r * ELLIPSE);
      g.fillStyle(0xffd23f, 0.9).fillTriangle(b.pos.x - 6, b.pos.y - this.bodyHeight() - 22 - 3 * p, b.pos.x + 6, b.pos.y - this.bodyHeight() - 22 - 3 * p, b.pos.x, b.pos.y - this.bodyHeight() - 12 - 3 * p);
      for (const d of m.illusion.decoys) g.lineStyle(1.5, 0x7fd8ff, 0.4 + 0.3 * Math.sin(this.t * 9 + d.id)).strokeEllipse(d.pos.x, d.pos.y, r, r * ELLIPSE);
    }
    // decoys: drift (state is in core), flicker, no shadow
    if (m.illusion) for (const d of m.illusion.decoys) {
      const a = this.decoys.get(d.id);
      if (!a) continue;
      a.setPos(d.pos.x, d.pos.y); a.face(hero.x < d.pos.x ? -1 : 1);
      a.setAlpha(0.55 + 0.12 * Math.sin(this.t * 9 + d.id)); a.shadow.setVisible(false);
    }
  }

  private bodyHeight(): number { const s = sheetOf(`${bossSpriteKey(this.b.def)}.idle`); return s ? s.fh * this.b.def.scale * s.oy : 60; }

  // ---------- events ----------
  private onEvent(e: MechEvent): void {
    const h = this.host, b = this.b, def = b.def, sc = h.scene;
    if (def.mechTip) h.tip(`mech-${def.id}`, def.mechTip);
    switch (e.type) {
      case 'wardUp':
        h.toast(`${def.name} wraps itself in a spirit ward!`, 2600); h.sfx('roar'); h.fx.ring(b.pos.x, b.pos.y, 70, this.accent, 500); break;
      case 'wardBreak':
        h.toast('Ward shattered!', 1800); h.sfx('crit'); h.fx.ring(b.pos.x, b.pos.y, 90, 0xffffff, 450); h.fx.burst(b.pos.x, b.pos.y - 24, this.accent, 24);
        h.fx.play('xf_mirror_shatter', b.pos.x, b.pos.y - 26, { scale: 0.5, tint: this.accent, depth: b.pos.y + 4 }); break;
      case 'wardExpire':
        h.toast('The ward fades and the boss recovers.', 2200); this.healBoss(e.heal); break;
      case 'illusion': {
        h.toast('Mirror images! The real one wears the gold ring.', 2200); h.sfx('roar');
        const real = h.free(e.real);
        h.fx.ring(b.pos.x, b.pos.y, 60, this.accent, 380); h.fx.burst(b.pos.x, b.pos.y - 24, this.accent, 10); // small puff: the big shatter sprite whited out the screen on a huge boss
        b.pos.x = real.x; b.pos.y = real.y; // the boss steps into its slot
        h.fx.play('xf_soul_wisp', real.x, real.y - 20, { scale: 0.3, tint: this.accent });
        for (const d of e.decoys) {
          const live = this.mech.illusion?.decoys.find((x) => x.id === d.id);
          if (live) { const p = h.free(live.pos); live.pos.x = p.x; live.pos.y = p.y; }
          const p = live?.pos ?? d.pos;
          const a = new Actor(sc, bossSpriteKey(def), p.x, p.y, def.scale, 56);
          a.sprite.setTint(0xcfe0ff); a.shadow.setVisible(false);
          this.decoys.set(d.id, a);
          h.fx.play('xf_soul_wisp', p.x, p.y - 20, { scale: 0.25, tint: this.accent });
        }
        break;
      }
      case 'illusionEnd':
        for (const a of this.decoys.values()) { h.fx.burst(a.sprite.x, a.sprite.y - 20, this.accent, 10); a.destroy(); }
        this.decoys.clear();
        if (e.reason === 'cleared') h.toast('Every image broken: the boss is exposed!', 2000);
        break;
      case 'decoyShatter': {
        const a = this.decoys.get(e.id);
        if (a) { a.destroy(); this.decoys.delete(e.id); }
        h.fx.play('xf_mirror_shatter', e.at.x, e.at.y - 24, { scale: 0.45, tint: this.accent, depth: e.at.y + 4 });
        h.fx.ring(e.at.x, e.at.y, e.radius, this.accent, 320); h.sfx('crit');
        const hp = h.heroPos();
        if (Math.hypot(hp.x - e.at.x, hp.y - e.at.y) <= e.radius + h.heroRadius) h.hurtHero(def.atk * e.burstMult, e.at);
        break;
      }
      case 'pool': h.sfx('telegraph'); break;
      case 'poolEnd': break;
      case 'beam': h.sfx('telegraph'); h.toast('Blades of wind: slip between the arms!', 1800); break;
      case 'beamEnd': break;
      case 'pylons': {
        h.toast('Seal pylons rise! Break them to harm the boss.', 2800); h.sfx('roar'); h.fx.shake(250, 0.006);
        for (const p of e.pylons) {
          const live = this.mech.pylons.find((x) => x.id === p.id);
          if (live) { const q = h.free(live.at); live.at.x = q.x; live.at.y = q.y; }
          const at = live?.at ?? p.at;
          const img = sc.add.image(at.x, at.y, 'prop.standstone').setOrigin(0.5, 1).setScale(0.3).setTint(0xffe9a8).setDepth(at.y);
          const glow = sc.add.image(at.x, at.y - 22, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(this.accent).setDisplaySize(46, 46).setDepth(at.y + 1);
          this.pylonSprites.set(p.id, { img, glow });
          h.fx.play('xf_stone_spike', at.x, at.y + 2, { scale: 0.2, tint: this.accent, depth: at.y + 2 });
        }
        break;
      }
      case 'pylonDown': {
        const s = this.pylonSprites.get(e.id);
        if (s) { s.img.destroy(); s.glow.destroy(); this.pylonSprites.delete(e.id); }
        h.fx.play('xf_mirror_shatter', e.at.x, e.at.y - 20, { scale: 0.4, tint: this.accent, depth: e.at.y + 4 }); h.fx.burst(e.at.x, e.at.y - 20, this.accent, 16); h.sfx('crit');
        h.toast(e.remaining ? `Pylon destroyed (${e.remaining} left)` : 'All pylons destroyed: the boss is vulnerable!', 1800);
        break;
      }
      case 'wisps':
        h.sfx('telegraph');
        for (const w of e.wisps) {
          const s = sc.add.sprite(w.pos.x, w.pos.y, 'fx.xf_soul_wisp').setScale(0.14).setTint(0xff5ad0).setBlendMode(Phaser.BlendModes.ADD);
          if (sc.anims.exists('fx.xf_soul_wisp')) s.play({ key: 'fx.xf_soul_wisp', repeat: -1 });
          this.wispSprites.set(w.id, s);
        }
        break;
      case 'wispHeal': { this.dropWisp(e.id); h.fx.burst(e.at.x, e.at.y, 0xff5ad0, 10); this.healBoss(e.heal); break; }
      case 'wispDown': this.dropWisp(e.id); h.fx.burst(e.at.x, e.at.y, 0xff5ad0, 10); h.sfx('hit'); break;
    }
  }

  private dropWisp(id: number): void { const s = this.wispSprites.get(id); if (s) { s.destroy(); this.wispSprites.delete(id); } }

  private healBoss(amount: number): void {
    const b = this.b;
    b.c.hp = Math.min(b.c.maxHp, b.c.hp + amount);
    this.host.floatText({ x: b.pos.x, y: b.pos.y - 10 }, `+${amount}`, '#7dffb0', true);
    this.host.fx.burst(b.pos.x, b.pos.y - 24, COLORS.heal, 12);
  }

  // ---------- damage routing ----------
  /** The amount of a hero hit that actually reaches the boss's HP, with events dressed. `staggered` asks the scene to stagger it. */
  filter(amount: number): { amount: number; staggered: boolean } {
    const r = filterDamage(this.mech, this.b.def, amount, this.b.ai.hidden);
    for (const e of r.events) this.onEvent(e);
    return { amount: r.amount, staggered: r.staggered };
  }

  /** Extra things the hero can hit: decoys, pylons, leech wisps. */
  targets(): FightTarget[] {
    const m = this.mech, h = this.host, def = this.b.def, out: FightTarget[] = [];
    for (const d of m.illusion?.decoys ?? []) out.push({ pos: d.pos, radius: def.radius, key: d, hit: () => { for (const e of shatterDecoy(m, def, d.id)) this.onEvent(e); } });
    for (const p of m.pylons) out.push({ pos: { x: p.at.x, y: p.at.y - 10 }, radius: 12, key: p, hit: (mult) => {
      const dmg = h.damageTo(def.def * (def.mech?.pylons?.defMult ?? 0.5), mult);
      h.floatText(p.at, String(dmg), '#ffe08a'); h.fx.burst(p.at.x, p.at.y - 16, this.accent, 6); h.sfx('hit');
      for (const e of damagePylon(m, p.id, dmg)) this.onEvent(e);
    } });
    for (const w of m.wisps) out.push({ pos: w.pos, radius: 9, key: w, hit: (mult) => { const dmg = h.damageTo(0, mult); for (const e of damageWisp(m, w.id, dmg)) this.onEvent(e); } });
    return out;
  }

  /** Everything the fight created is cleared (leash reset): the mechanic starts over. */
  reset(): void {
    for (const a of this.decoys.values()) a.destroy();
    this.decoys.clear();
    for (const s of this.pylonSprites.values()) { s.img.destroy(); s.glow.destroy(); }
    this.pylonSprites.clear();
    for (const s of this.wispSprites.values()) s.destroy();
    this.wispSprites.clear();
    this.wardImg?.destroy(); this.wardImg = null; this.g.clear();
    this.mech = newMech(this.b.def);
  }

  /** Death: the identity props fade out with a flourish. */
  die(): void {
    const b = this.b, l = b.def.look, h = this.host;
    this.reset();
    if (l?.deathFx) { h.fx.play(l.deathFx.fx, b.pos.x, b.pos.y - 20, { scale: l.deathFx.scale, tint: l.deathFx.tint, depth: b.pos.y + 6 }); h.fx.ring(b.pos.x, b.pos.y, 150, l.deathFx.tint, 1100); }
    this.destroy();
  }

  phaseFx(): void {
    const b = this.b, l = b.def.look;
    if (l?.phaseFx) this.host.fx.play(l.phaseFx.fx, b.pos.x, b.pos.y - 20, { scale: l.phaseFx.scale, tint: l.phaseFx.tint, depth: b.pos.y + 6 });
  }

  destroy(): void {
    this.reset();
    for (const o of this.orbit) o.s.destroy();
    this.orbit = []; this.sigil?.destroy(); this.sigil = null; this.g.destroy();
  }

  /** compact state for the test hooks */
  snapshot(): { ward: number; pylons: number; decoys: number; pools: number; beam: boolean; beamArmed: boolean; wisps: number; decoyAt: Vec2[]; pylonAt: Vec2[]; beamAt: { x: number; y: number; angle: number } | null } {
    const m = this.mech;
    return {
      ward: m.ward?.hp ?? 0, pylons: m.pylons.length, decoys: m.illusion?.decoys.length ?? 0, pools: m.pools.length, beam: !!m.beam, beamArmed: !!m.beam && m.beam.warn <= 0, wisps: m.wisps.length,
      decoyAt: (m.illusion?.decoys ?? []).map((d) => ({ ...d.pos })), pylonAt: m.pylons.map((p) => ({ x: p.at.x, y: p.at.y - 10 })), beamAt: m.beam ? { x: m.beam.origin.x, y: m.beam.origin.y, angle: m.beam.angle } : null,
    };
  }
}

const sheetFx = (key: string): { frames: number } | null => MANIFEST.fx[key] ?? null;
