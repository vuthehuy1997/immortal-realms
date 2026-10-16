import Phaser from 'phaser';
import townUrl from '../../assets/third_party/kenney-tiny-town/Tilemap/tilemap_packed.png';
import dungeonUrl from '../../assets/third_party/kenney-tiny-dungeon/Tilemap/tilemap_packed.png';
import { applyDamage, computeDamage, Cooldowns, regenMana, tryCast, type Combatant } from '../core/combat';
import { newEnemyAI, updateEnemyAI, type EnemyAI } from '../core/enemyAI';
import { inArc, inCircle, normalize, stepProjectile, type Projectile } from '../core/hit';
import { step, type Vec2 } from '../core/movement';
import { createRng } from '../core/rng';
import { generateWorld, isBlockedTile, moveWithCollision, TILE_SIZE, type WorldMap } from '../core/world';
import { ENEMIES, type EnemyDef } from '../data/enemies';
import { SKILLS } from '../data/skills';
import { DECO_FRAMES, DUNGEON_FRAME, GROUND_FRAME } from '../data/tiles';
import { updateHud } from './hud';

const PLAYER_SPEED = 70;
const PLAYER_RADIUS = 5;
const ENEMY_RADIUS = 6;
const WORLD_SEED = 20261016;
const ENEMY_FRAME: Record<string, number> = { slime: DUNGEON_FRAME.slime, wraith: 121, brute: 109 };
const SPAWN_PLAN: [string, number][] = [['slime', 4], ['wraith', 2], ['brute', 2]];

interface Enemy { id: number; def: EnemyDef; c: Combatant; ai: EnemyAI; pos: Vec2; img: Phaser.GameObjects.Image; flash: number }
interface Bolt { p: Projectile; img: Phaser.GameObjects.Image; hostile: boolean; damage: number }

/** M1+M2: walkable overworld + real-time combat. VFX here are PLACEHOLDER (simple shapes) pending ART-2. */
export class WorldScene extends Phaser.Scene {
  private world!: WorldMap;
  private rng = createRng(WORLD_SEED + 1);
  private pos: Vec2 = { x: 0, y: 0 };
  private player!: Phaser.GameObjects.Image;
  private pc!: Combatant;
  private cds = new Cooldowns();
  private now = 0;
  private enemies: Enemy[] = [];
  private bolts: Bolt[] = [];
  private nextId = 1;
  private kills = 0;
  private xp = 0;
  private hpBars!: Phaser.GameObjects.Graphics;
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'ONE' | 'TWO' | 'THREE' | 'SPACE' | 'R', Phaser.Input.Keyboard.Key>;

  constructor() { super('World'); }

  preload(): void {
    this.load.spritesheet('town', townUrl, { frameWidth: TILE_SIZE, frameHeight: TILE_SIZE });
    this.load.spritesheet('dungeon', dungeonUrl, { frameWidth: TILE_SIZE, frameHeight: TILE_SIZE });
  }

  create(): void {
    this.enemies = []; this.bolts = []; this.kills = 0; this.xp = 0; this.now = 0; this.cds = new Cooldowns();
    this.rng = createRng(WORLD_SEED + 1);
    this.world = generateWorld(WORLD_SEED);
    const { width, height } = this.world;

    for (let ty = 0; ty < height; ty++) {
      for (let tx = 0; tx < width; tx++) {
        const i = ty * width + tx;
        this.add.image(tx * TILE_SIZE, ty * TILE_SIZE, 'town', GROUND_FRAME[this.world.ground[i]!]).setOrigin(0).setDepth(0);
        const d = this.world.deco[i]!;
        if (d !== 'none') {
          const frames = DECO_FRAMES[d];
          frames.forEach((frame, n) => {
            const row = ty - (frames.length - 1) + n;
            this.add.image(tx * TILE_SIZE, row * TILE_SIZE, 'town', frame).setOrigin(0).setDepth((ty + 1) * TILE_SIZE);
          });
        }
      }
    }

    if (!this.textures.exists('bolt')) { // PLACEHOLDER projectile art
      const g = this.make.graphics({}, false);
      g.fillStyle(0xffffff, 1).fillCircle(4, 4, 3);
      g.generateTexture('bolt', 8, 8); g.destroy();
    }

    this.pos = { ...this.world.spawn };
    this.pc = { hp: 100, maxHp: 100, mana: 50, maxMana: 50, atk: 10, def: 2, critChance: 0.1, critMult: 1.75, manaRegen: 3 };
    this.player = this.add.image(this.pos.x, this.pos.y, 'dungeon', DUNGEON_FRAME.hero).setOrigin(0.5, 0.8);
    this.add.image(this.pos.x + 48, this.pos.y - 8, 'dungeon', DUNGEON_FRAME.wizard).setOrigin(0.5, 0.8).setDepth(this.pos.y); // PLACEHOLDER NPC (no dialogue yet)

    for (const [type, n] of SPAWN_PLAN) for (let i = 0; i < n; i++) this.spawnRandomEnemy(type);
    this.hpBars = this.add.graphics().setDepth(1e5);

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,ONE,TWO,THREE,SPACE,R') as typeof this.keys;
    const cast = (i: number) => this.castSkill(i);
    this.keys.ONE.on('down', () => cast(0)); this.keys.TWO.on('down', () => cast(1)); this.keys.THREE.on('down', () => cast(2));
    this.keys.SPACE.on('down', () => cast(0));
    this.input.on('pointerdown', () => cast(0));
    this.keys.R.on('down', () => { if (this.pc.hp <= 0) this.scene.restart(); });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, width * TILE_SIZE, height * TILE_SIZE);
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.setRoundPixels(true);
    this.applyZoom();
    this.scale.on('resize', () => this.applyZoom());

    const w = window as unknown as Record<string, unknown>;
    w.__world = () => ({ x: this.pos.x, y: this.pos.y });
    w.__combat = {
      state: () => ({ now: this.now, hp: this.pc.hp, mana: this.pc.mana, kills: this.kills, xp: this.xp, enemies: this.enemies.map((e) => ({ id: e.id, type: e.def.id, hp: e.c.hp, x: e.pos.x, y: e.pos.y, ai: e.ai.state })) }),
      cast: (i: number, x: number, y: number) => this.castSkill(i, { x, y }),
      teleport: (x: number, y: number) => { this.pos = { x, y }; },
      spawn: (type: string, x: number, y: number) => this.spawnEnemy(type, { x, y }),
      clear: () => { this.enemies.forEach((e) => e.img.destroy()); this.enemies = []; },
    };
  }

  private applyZoom(): void {
    this.cameras.main.setZoom(Math.max(2, Math.round(this.scale.height / (TILE_SIZE * 15))));
  }

  private spawnRandomEnemy(type: string): void {
    for (let tries = 0; tries < 200; tries++) {
      const tx = 3 + Math.floor(this.rng() * (this.world.width - 6));
      const ty = 3 + Math.floor(this.rng() * (this.world.height - 6));
      const p = { x: (tx + 0.5) * TILE_SIZE, y: (ty + 0.5) * TILE_SIZE };
      const d = Math.hypot(p.x - this.world.spawn.x, p.y - this.world.spawn.y);
      if (d < 90 || d > 260 || isBlockedTile(this.world, tx, ty)) continue;
      this.spawnEnemy(type, p);
      return;
    }
  }

  private spawnEnemy(type: string, pos: Vec2): void {
    const def = ENEMIES[type];
    if (!def) return;
    const c: Combatant = { hp: def.maxHp, maxHp: def.maxHp, mana: 0, maxMana: 0, atk: def.atk, def: def.def, critChance: 0, critMult: 1, manaRegen: 0 };
    const img = this.add.image(pos.x, pos.y, 'dungeon', ENEMY_FRAME[type] ?? 108).setOrigin(0.5, 0.8);
    this.enemies.push({ id: this.nextId++, def, c, ai: newEnemyAI(), pos: { ...pos }, img, flash: 0 });
  }

  private aimDir(aim?: Vec2): Vec2 {
    const p = this.input.activePointer;
    const t = aim ?? { x: p.worldX, y: p.worldY };
    return normalize({ x: t.x - this.pos.x, y: t.y - this.pos.y });
  }

  private castSkill(i: number, aim?: Vec2): void {
    const sk = SKILLS[i];
    if (!sk || this.pc.hp <= 0) return;
    if (!tryCast(this.pc, this.cds, sk, this.now).ok) return;
    const dir = this.aimDir(aim);
    if (sk.shape === 'arc') {
      this.vfxArc(dir, sk.range);
      for (const e of [...this.enemies]) if (inArc(this.pos, dir, sk.range, Math.PI / 3, e.pos, ENEMY_RADIUS)) this.hitEnemy(e, sk.damageMult);
    } else if (sk.shape === 'burst') {
      this.vfxRing(sk.range);
      for (const e of [...this.enemies]) if (inCircle(this.pos, sk.range, e.pos, ENEMY_RADIUS)) this.hitEnemy(e, sk.damageMult);
    } else {
      const speed = sk.speed ?? 200;
      const img = this.add.image(this.pos.x, this.pos.y, 'bolt').setTint(0x66ccff).setDepth(1e4);
      this.bolts.push({ p: { pos: { ...this.pos }, vel: { x: dir.x * speed, y: dir.y * speed }, traveled: 0, maxDist: sk.range }, img, hostile: false, damage: sk.damageMult });
    }
  }

  private hitEnemy(e: Enemy, mult: number): void {
    const r = computeDamage(this.pc, e.c, mult, this.rng);
    const killed = applyDamage(e.c, r.amount);
    this.floatText(e.pos, String(r.amount), r.crit ? '#ffd23f' : '#ffffff');
    e.flash = 0.1;
    if (killed) {
      this.kills++; this.xp += e.def.xp;
      e.img.destroy();
      this.enemies = this.enemies.filter((x) => x !== e);
    }
  }

  private hurtPlayer(base: number): void {
    if (this.pc.hp <= 0) return;
    const r = computeDamage({ atk: base, critChance: 0, critMult: 1 }, this.pc, 1, this.rng);
    applyDamage(this.pc, r.amount);
    this.floatText(this.pos, String(r.amount), '#ff6b6b');
    this.player.setTint(0xff5555);
    this.time.delayedCall(100, () => this.player.clearTint());
    if (this.pc.hp <= 0) this.player.setAlpha(0.4);
  }

  private floatText(at: Vec2, text: string, color: string): void {
    const t = this.add.text(at.x, at.y - 10, text, { color, fontSize: '9px', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(1e6);
    this.tweens.add({ targets: t, y: t.y - 14, alpha: 0, duration: 650, onComplete: () => t.destroy() });
  }

  // PLACEHOLDER VFX (replace under ART-2)
  private vfxArc(dir: Vec2, range: number): void {
    const g = this.add.graphics().setDepth(1e4);
    const a = Math.atan2(dir.y, dir.x);
    g.fillStyle(0xffffff, 0.7).slice(this.pos.x, this.pos.y, range, a - Math.PI / 3, a + Math.PI / 3).fillPath();
    this.tweens.add({ targets: g, alpha: 0, duration: 140, onComplete: () => g.destroy() });
  }
  private vfxRing(radius: number): void {
    const g = this.add.graphics().setDepth(1e4);
    g.lineStyle(3, 0x55ffaa, 1).strokeCircle(this.pos.x, this.pos.y, radius);
    g.fillStyle(0x55ffaa, 0.25).fillCircle(this.pos.x, this.pos.y, radius);
    this.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() });
  }

  update(_t: number, deltaMs: number): void {
    const dt = Math.min(deltaMs, 50) / 1000;
    this.now += dt;
    const alive = this.pc.hp > 0;

    if (alive) {
      const k = this.keys;
      const dir = {
        x: Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown),
        y: Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown),
      };
      this.pos = moveWithCollision(this.world, this.pos, step(this.pos, dir, PLAYER_SPEED, dt), PLAYER_RADIUS);
      regenMana(this.pc, dt);
      this.player.setFlipX(this.input.activePointer.worldX < this.pos.x);
    }
    this.player.setPosition(this.pos.x, this.pos.y).setDepth(this.pos.y);

    for (const e of this.enemies) {
      const out = updateEnemyAI(e.ai, e.def, e.pos, alive ? this.pos : { x: 1e9, y: 1e9 }, dt);
      e.pos = moveWithCollision(this.world, e.pos, { x: e.pos.x + out.vel.x * dt, y: e.pos.y + out.vel.y * dt }, ENEMY_RADIUS);
      if (out.attack?.kind === 'melee') {
        if (Math.hypot(this.pos.x - e.pos.x, this.pos.y - e.pos.y) <= e.def.attackRange + 8 + (e.def.behavior === 'charger' ? 4 : 0)) this.hurtPlayer(e.def.atk);
      } else if (out.attack?.kind === 'projectile') {
        const d = normalize({ x: this.pos.x - e.pos.x, y: this.pos.y - e.pos.y });
        const img = this.add.image(e.pos.x, e.pos.y, 'bolt').setTint(0xc77dff).setDepth(1e4);
        this.bolts.push({ p: { pos: { ...e.pos }, vel: { x: d.x * 90, y: d.y * 90 }, traveled: 0, maxDist: 170 }, img, hostile: true, damage: e.def.atk });
      }
      e.img.setPosition(e.pos.x, e.pos.y).setDepth(e.pos.y).setFlipX(this.pos.x < e.pos.x);
      e.flash = Math.max(0, e.flash - dt);
      if (e.flash > 0) e.img.setTint(0xff7777);
      else if (e.ai.state === 'windup') e.img.setTint(0xffaa33); // telegraph
      else e.img.clearTint();
    }

    for (const b of [...this.bolts]) {
      const live = stepProjectile(b.p, dt);
      b.img.setPosition(b.p.pos.x, b.p.pos.y);
      let consumed = !live || isBlockedTile(this.world, Math.floor(b.p.pos.x / TILE_SIZE), Math.floor(b.p.pos.y / TILE_SIZE));
      if (!consumed && b.hostile && alive && inCircle(b.p.pos, 4, this.pos, PLAYER_RADIUS)) { this.hurtPlayer(b.damage); consumed = true; }
      if (!consumed && !b.hostile) {
        const target = this.enemies.find((e) => inCircle(b.p.pos, 4, e.pos, ENEMY_RADIUS));
        if (target) { this.hitEnemy(target, b.damage); consumed = true; }
      }
      if (consumed) { b.img.destroy(); this.bolts = this.bolts.filter((x) => x !== b); }
    }

    this.hpBars.clear();
    for (const e of this.enemies) {
      if (e.c.hp >= e.c.maxHp) continue;
      this.hpBars.fillStyle(0x000000, 0.8).fillRect(e.pos.x - 7, e.pos.y - 14, 14, 3);
      this.hpBars.fillStyle(0xe74c3c, 1).fillRect(e.pos.x - 7, e.pos.y - 14, (14 * e.c.hp) / e.c.maxHp, 3);
    }

    updateHud({
      hp: this.pc.hp, maxHp: this.pc.maxHp, mana: this.pc.mana, maxMana: this.pc.maxMana,
      cooldowns: SKILLS.map((s) => this.cds.remaining(s.id, this.now)), kills: this.kills, xp: this.xp, dead: !alive,
    });
  }
}
