import Phaser from 'phaser';
import townUrl from '../../assets/third_party/kenney-tiny-town/Tilemap/tilemap_packed.png';
import dungeonUrl from '../../assets/third_party/kenney-tiny-dungeon/Tilemap/tilemap_packed.png';
import { newBossAI, updateBoss, type BossAI } from '../core/boss';
import { applyDamage, computeDamage, Cooldowns, regenMana, tryCast, type Combatant } from '../core/combat';
import { attemptBreakthrough, canBreakthrough, meditate } from '../core/cultivation';
import { getDialogue } from '../core/dialogue';
import { newEnemyAI, updateEnemyAI, type EnemyAI } from '../core/enemyAI';
import { grantXp, registerKill, statsOf, turnInQuest, unequipWeapon, useItemSlot, WARDEN_ID, type GameState } from '../core/gameState';
import { inArc, inCircle, normalize, stepProjectile, type Projectile } from '../core/hit';
import { addItem, equipFromSlot } from '../core/inventory';
import { step, type Vec2 } from '../core/movement';
import { acceptQuest } from '../core/quest';
import { createRng } from '../core/rng';
import { generateWorld, isBlockedTile, moveWithCollision, TILE_SIZE, type WorldMap } from '../core/world';
import { WARDEN, type BossDef } from '../data/boss';
import { ENEMIES, type EnemyDef } from '../data/enemies';
import { ITEMS } from '../data/items';
import { QUESTS } from '../data/quests';
import { REALMS } from '../data/realms';
import { SKILLS } from '../data/skills';
import { DECO_FRAMES, DUNGEON_FRAME, GROUND_FRAME } from '../data/tiles';
import { buildPanels, closePanels, isDialogueOpen, isPanelOpen, refreshPanels, showDialogue, togglePanel } from '../ui/panels';
import { hideScreen, showPause } from '../ui/menu';
import { setBossBar, setPrompt, toast, updateHud } from '../ui/hud';
import { KeyInput } from './input';
import { saveGame } from './storage';

const PLAYER_SPEED = 70;
const PLAYER_RADIUS = 5;
const ENEMY_RADIUS = 6;
const BOSS_RADIUS = 14;
const NPC_OFFSET = { x: 48, y: -8 };
const TALK_RANGE = 34;
const WORLD_SEED = 20261016;
const AUTOSAVE_SECONDS = 30;
const MAX_ROAMERS = 8;
const RESPAWN_SECONDS = 15;
const ENEMY_FRAME: Record<string, number> = { slime: DUNGEON_FRAME.slime, wraith: 121, brute: 109 };
const SPAWN_PLAN: [string, number][] = [['slime', 4], ['wraith', 2], ['brute', 2]];

export interface GameHost { quitToMenu(): void }
interface Enemy { id: number; def: EnemyDef; c: Combatant; ai: EnemyAI; pos: Vec2; img: Phaser.GameObjects.Image; flash: number; minion: boolean }
interface BossEnt { slams: number; def: BossDef; c: Combatant; ai: BossAI; pos: Vec2; img: Phaser.GameObjects.Image; flash: number; engaged: boolean; tele: Phaser.GameObjects.Graphics | null }
interface Bolt { p: Projectile; img: Phaser.GameObjects.Image; hostile: boolean; damage: number }
interface Target { pos: Vec2; radius: number; hit(mult: number): void }


/** Overworld + real-time combat + progression UI. VFX are PLACEHOLDER shapes pending ART-2. */
export class WorldScene extends Phaser.Scene {
  private gs!: GameState;
  private host!: GameHost;
  private world!: WorldMap;
  private rng = createRng(WORLD_SEED + 1);
  private rngOverride: number | null = null;
  private pos: Vec2 = { x: 0, y: 0 };
  private player!: Phaser.GameObjects.Image;
  private npc!: Phaser.GameObjects.Image;
  private npcMark!: Phaser.GameObjects.Text;
  private aura!: Phaser.GameObjects.Graphics;
  private pc!: Combatant;
  private cds = new Cooldowns();
  private now = 0;
  private enemies: Enemy[] = [];
  private bolts: Bolt[] = [];
  private boss: BossEnt | null = null;
  private nextId = 1;
  private hpBars!: Phaser.GameObjects.Graphics;
  private kb!: KeyInput;
  private meditating = false;
  private uiPause = false;
  private hasPointer = false;
  private facing: Vec2 = { x: 1, y: 0 };
  private respawnTimer = 0;
  private autosaveTimer = 0;

  constructor() { super('World'); }

  init(data: { state: GameState; host: GameHost }): void { this.gs = data.state; this.host = data.host; }

  preload(): void {
    this.load.spritesheet('town', townUrl, { frameWidth: TILE_SIZE, frameHeight: TILE_SIZE });
    this.load.spritesheet('dungeon', dungeonUrl, { frameWidth: TILE_SIZE, frameHeight: TILE_SIZE });
  }

  create(): void {
    this.enemies = []; this.bolts = []; this.boss = null; this.now = 0; this.cds = new Cooldowns();
    this.meditating = false; this.uiPause = false; this.respawnTimer = 0; this.autosaveTimer = 0;
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

    this.pos = this.gs.hp > 0 ? { ...this.gs.pos } : { ...this.world.spawn };
    this.pc = { hp: 0, maxHp: 1, mana: 0, maxMana: 1, atk: 0, def: 0, critChance: 0, critMult: 1, manaRegen: 0 };
    this.pullFromState();
    this.aura = this.add.graphics().setDepth(1e4);
    this.player = this.add.image(this.pos.x, this.pos.y, 'dungeon', DUNGEON_FRAME.hero).setOrigin(0.5, 0.8);
    const np = this.npcPos();
    this.npc = this.add.image(np.x, np.y, 'dungeon', DUNGEON_FRAME.wizard).setOrigin(0.5, 0.8).setDepth(np.y);
    this.npcMark = this.add.text(np.x, np.y - 20, '!', { color: '#ffd23f', fontSize: '12px', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(1e5);

    for (const [type, n] of SPAWN_PLAN) for (let i = 0; i < n; i++) this.spawnRandomEnemy(type);
    if (!this.gs.bossDefeated) this.spawnBoss();
    this.hpBars = this.add.graphics().setDepth(1e5);

    this.kb?.dispose();
    const kb = this.kb = new KeyInput();
    kb.onPress(['Digit1', 'Numpad1'], () => this.digit(0)); kb.onPress(['Digit2', 'Numpad2'], () => this.digit(1)); kb.onPress(['Digit3', 'Numpad3'], () => this.digit(2));
    kb.onPress('Space', () => this.castSkill(0));
    kb.onPress('KeyQ', () => this.quickUse('hp-potion')); kb.onPress('KeyZ', () => this.quickUse('mana-potion'));
    kb.onPress('KeyE', () => this.interact());
    kb.onPress('KeyM', () => this.toggleMeditate()); kb.onPress('KeyB', () => this.breakthrough());
    kb.onPress('KeyI', () => { if (!this.uiPause) togglePanel('inv'); }); kb.onPress('KeyC', () => { if (!this.uiPause) togglePanel('chr'); });
    kb.onPress('Escape', () => this.escape());
    kb.onPress('KeyR', () => { if (this.pc.hp <= 0) this.respawn(); });
    this.input.on('pointerdown', () => { if (!this.uiPause) this.castSkill(0); });
    this.input.on('pointermove', () => { this.hasPointer = true; });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, width * TILE_SIZE, height * TILE_SIZE);
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.setRoundPixels(true);
    this.applyZoom();
    this.scale.on('resize', () => this.applyZoom());
    this.events.once('shutdown', () => { this.kb.dispose(); this.scale.off('resize'); closePanels(); showDialogue(null, () => undefined); setBossBar(null); setPrompt(null); });

    buildPanels({
      clickSlot: (i) => this.useSlot(i),
      unequip: () => { this.mutate(() => unequipWeapon(this.gs)); },
      toggleMeditate: () => this.toggleMeditate(),
      breakthrough: () => this.breakthrough(),
    });
    this.installTestHooks();
  }

  private applyZoom(): void {
    this.cameras.main.setZoom(Math.max(2, Math.round(this.scale.height / (TILE_SIZE * 15))));
  }

  // ---------- state sync (gs <-> live combatant) ----------
  private pushToState(): void { this.gs.hp = this.pc.hp; this.gs.mana = this.pc.mana; this.gs.pos = { ...this.pos }; }
  private pullFromState(): void {
    const s = statsOf(this.gs);
    Object.assign(this.pc, s, { hp: this.gs.hp, mana: this.gs.mana });
  }
  /** Run a gs-mutating operation with the live vitals flushed before and reloaded after. */
  private mutate<T>(fn: () => T): T { this.pushToState(); const r = fn(); this.pullFromState(); return r; }
  private roll = (): number => this.rngOverride ?? this.rng();
  private npcPos(): Vec2 { return { x: this.world.spawn.x + NPC_OFFSET.x, y: this.world.spawn.y + NPC_OFFSET.y }; }

  private save(announce: boolean): boolean {
    this.pushToState();
    const ok = saveGame(this.gs);
    if (announce) toast(ok ? 'Game saved.' : 'Could not save (storage unavailable).');
    return ok;
  }

  // ---------- spawning ----------
  private spawnRandomEnemy(type: string): void {
    for (let tries = 0; tries < 200; tries++) {
      const tx = 3 + Math.floor(this.rng() * (this.world.width - 6));
      const ty = 3 + Math.floor(this.rng() * (this.world.height - 6));
      const p = { x: (tx + 0.5) * TILE_SIZE, y: (ty + 0.5) * TILE_SIZE };
      const d = Math.hypot(p.x - this.world.spawn.x, p.y - this.world.spawn.y);
      const dl = Math.hypot(p.x - this.world.lair.x, p.y - this.world.lair.y);
      if (d < 90 || d > 260 || dl < 8 * TILE_SIZE || isBlockedTile(this.world, tx, ty)) continue;
      this.spawnEnemy(type, p);
      return;
    }
  }

  private spawnEnemy(type: string, pos: Vec2, minion = false): void {
    const def = ENEMIES[type];
    if (!def) return;
    const c: Combatant = { hp: def.maxHp, maxHp: def.maxHp, mana: 0, maxMana: 0, atk: def.atk, def: def.def, critChance: 0, critMult: 1, manaRegen: 0 };
    const img = this.add.image(pos.x, pos.y, 'dungeon', ENEMY_FRAME[type] ?? 108).setOrigin(0.5, 0.8);
    this.enemies.push({ id: this.nextId++, def, c, ai: newEnemyAI(), pos: { ...pos }, img, flash: 0, minion });
  }

  private spawnBoss(): void {
    const def = WARDEN;
    const c: Combatant = { hp: def.maxHp, maxHp: def.maxHp, mana: 0, maxMana: 0, atk: def.atk, def: def.def, critChance: 0, critMult: 1, manaRegen: 0 };
    const pos = { ...this.world.lair };
    const img = this.add.image(pos.x, pos.y, 'dungeon', DUNGEON_FRAME.bossPlaceholder).setOrigin(0.5, 0.8).setScale(3); // PLACEHOLDER boss art (integer scale keeps pixels even)
    this.boss = { slams: 0, def, c, ai: newBossAI(), pos, img, flash: 0, engaged: false, tele: null };
  }

  // ---------- input actions ----------
  private digit(i: number): void {
    if (isDialogueOpen()) { document.querySelector<HTMLButtonElement>(`#dlg button[data-opt="${i}"]`)?.click(); return; }
    this.castSkill(i);
  }

  private escape(): void {
    if (isDialogueOpen()) { showDialogue(null, () => undefined); this.uiPause = false; return; }
    if (isPanelOpen('inv') || isPanelOpen('chr')) { closePanels(); return; }
    if (this.uiPause) { this.resume(); return; }
    this.uiPause = true;
    showPause({ onResume: () => this.resume(), onSave: () => { this.save(true); }, onQuit: () => { this.save(false); hideScreen(); this.host.quitToMenu(); } });
  }
  private resume(): void { hideScreen(); this.uiPause = false; }

  private toggleMeditate(): void {
    if (this.uiPause || this.pc.hp <= 0) return;
    this.meditating = !this.meditating;
    toast(this.meditating ? 'You begin to meditate…' : 'You stop meditating.', 1400);
  }

  private breakthrough(): void {
    if (this.uiPause || this.pc.hp <= 0) return;
    if (!canBreakthrough(this.gs.cultivation)) { toast('Your qi is not full enough to break through.', 1800); return; }
    const res = this.mutate(() => attemptBreakthrough(this.gs.cultivation, this.roll));
    if (!res.ok) return;
    this.meditating = false;
    if (res.success) {
      this.mutate(() => { const s = statsOf(this.gs); this.gs.hp = s.maxHp; this.gs.mana = s.maxMana; });
      toast(`Breakthrough! You reach ${REALMS[this.gs.cultivation.realm]!.name}.`, 3200);
      this.vfxRing(36, 0xffd23f);
      this.save(false);
    } else {
      toast('The breakthrough fails — your qi scatters. Half of it is lost.', 3200);
    }
  }

  private quickUse(itemId: string): void {
    if (this.uiPause || this.pc.hp <= 0) return;
    const i = this.gs.inventory.slots.findIndex((s) => s?.id === itemId);
    if (i >= 0) this.useSlot(i); else toast(`No ${ITEMS[itemId]!.name}.`, 1200);
  }

  /** Inventory slot click (also used by Q/Z): consumables are used, weapons are equipped. */
  useSlot(i: number): void {
    const stack = this.gs.inventory.slots[i];
    const def = stack ? ITEMS[stack.id] : undefined;
    if (!stack || !def || this.pc.hp <= 0) return;
    if (def.type === 'equipment') { this.mutate(() => equipFromSlot(this.gs.inventory, i)); toast(`Equipped ${def.name}.`, 1400); return; }
    if (def.type !== 'consumable') { toast(`${def.name} cannot be used.`, 1200); return; }
    const st = statsOf(this.gs);
    if (def.heal && !def.mana && !def.qi && this.pc.hp >= st.maxHp) { toast('HP is already full.', 1200); return; }
    if (def.mana && !def.heal && !def.qi && this.pc.mana >= st.maxMana) { toast('Mana is already full.', 1200); return; }
    this.mutate(() => useItemSlot(this.gs, i));
    toast(`Used ${def.name}.`, 1200);
  }

  private interact(): void {
    if (this.uiPause || this.pc.hp <= 0) return;
    if (Math.hypot(this.pos.x - this.npc.x, this.pos.y - this.npc.y) > TALK_RANGE) return;
    this.meditating = false;
    this.openDialogue();
  }

  private openDialogue(): void {
    this.uiPause = true;
    showDialogue(getDialogue('elder-lin', this.gs.quests, this.gs.inventory), (a) => {
      if (a.type === 'close') { showDialogue(null, () => undefined); this.uiPause = false; return; }
      if (a.type === 'accept') {
        if (acceptQuest(this.gs.quests, a.questId)) toast(`Quest accepted: ${QUESTS[a.questId]!.name}`, 2600);
        showDialogue(null, () => undefined); this.uiPause = false; return;
      }
      const r = this.mutate(() => turnInQuest(this.gs, a.questId));
      if (r.ok) {
        toast(`Quest complete: ${QUESTS[a.questId]!.name} (+${QUESTS[a.questId]!.reward.xp} XP)`, 3200);
        if (r.levelsGained > 0) toast(`Level up! You are now level ${this.gs.progress.level}.`, 3000);
        this.save(false);
        this.openDialogue(); // chain: shows the next quest offer or farewell
      } else {
        toast(r.reason === 'inventory-full' ? 'Your inventory is too full for the reward.' : 'The quest is not complete.', 2600);
      }
    });
  }

  // ---------- combat ----------
  private targets(): Target[] {
    const t: Target[] = this.enemies.map((e) => ({ pos: e.pos, radius: ENEMY_RADIUS, hit: (m: number) => this.hitEnemy(e, m) }));
    if (this.boss) { const b = this.boss; t.push({ pos: b.pos, radius: BOSS_RADIUS, hit: (m: number) => this.hitBoss(b, m) }); }
    return t;
  }

  private aimDir(aim?: Vec2): Vec2 {
    if (aim) return normalize({ x: aim.x - this.pos.x, y: aim.y - this.pos.y });
    if (!this.hasPointer) return this.facing;
    const p = this.input.activePointer;
    return normalize({ x: p.worldX - this.pos.x, y: p.worldY - this.pos.y });
  }

  private castSkill(i: number, aim?: Vec2): void {
    const sk = SKILLS[i];
    if (!sk || this.pc.hp <= 0 || this.uiPause) return;
    if (!tryCast(this.pc, this.cds, sk, this.now).ok) return;
    this.meditating = false;
    const dir = this.aimDir(aim);
    if (sk.shape === 'arc') {
      this.vfxArc(dir, sk.range);
      for (const t of this.targets()) if (inArc(this.pos, dir, sk.range, Math.PI / 3, t.pos, t.radius)) t.hit(sk.damageMult);
    } else if (sk.shape === 'burst') {
      this.vfxRing(sk.range, 0x55ffaa);
      for (const t of this.targets()) if (inCircle(this.pos, sk.range, t.pos, t.radius)) t.hit(sk.damageMult);
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
    if (!killed) return;
    e.img.destroy();
    this.enemies = this.enemies.filter((x) => x !== e);
    if (!e.minion) this.onKill(e.def.id);
  }

  private hitBoss(b: BossEnt, mult: number): void {
    if (!b.engaged) { b.engaged = true; }
    const r = computeDamage(this.pc, b.c, mult, this.rng);
    const killed = applyDamage(b.c, r.amount);
    this.floatText(b.pos, String(r.amount), r.crit ? '#ffd23f' : '#ffffff');
    b.flash = 0.1;
    if (!killed) return;
    b.tele?.destroy(); b.img.destroy(); this.boss = null;
    for (const m of this.enemies.filter((x) => x.minion)) m.img.destroy();
    this.enemies = this.enemies.filter((x) => !x.minion);
    setBossBar(null);
    this.onKill(WARDEN_ID);
    toast('The Stone Warden has fallen!', 4000);
    this.save(false);
  }

  private onKill(type: string): void {
    const r = this.mutate(() => registerKill(this.gs, type, this.roll));
    for (const d of r.drops) toast(`Found ${ITEMS[d.id]!.name}`, 1800);
    for (const o of r.overflow) toast(`Inventory full: lost ${ITEMS[o]!.name}`, 2200);
    if (r.levelsGained > 0) { toast(`Level up! You are now level ${this.gs.progress.level}.`, 3000); this.vfxRing(30, 0xffd23f); this.save(false); }
  }

  private hurtPlayer(attackValue: number): void {
    if (this.pc.hp <= 0) return;
    const r = computeDamage({ atk: attackValue, critChance: 0, critMult: 1 }, this.pc, 1, this.rng);
    applyDamage(this.pc, r.amount);
    this.meditating = false;
    this.floatText(this.pos, String(r.amount), '#ff6b6b');
    this.player.setTint(0xff5555);
    this.time.delayedCall(100, () => this.player.clearTint());
    if (this.pc.hp <= 0) { this.player.setAlpha(0.4); this.meditating = false; this.save(false); }
  }

  private respawn(): void {
    this.mutate(() => { const s = statsOf(this.gs); this.gs.hp = s.maxHp; this.gs.mana = s.maxMana; this.gs.pos = { ...this.world.spawn }; });
    this.scene.restart({ state: this.gs, host: this.host });
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
  private vfxRing(radius: number, color: number, at: Vec2 = this.pos): void {
    const g = this.add.graphics().setDepth(1e4);
    g.lineStyle(3, color, 1).strokeCircle(at.x, at.y, radius);
    g.fillStyle(color, 0.25).fillCircle(at.x, at.y, radius);
    this.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() });
  }

  // ---------- frame update ----------
  update(_t: number, deltaMs: number): void {
    const alive = this.pc.hp > 0;
    if (!this.uiPause) this.simulate(Math.min(deltaMs, 50) / 1000, alive);
    this.player.setPosition(this.pos.x, this.pos.y).setDepth(this.pos.y);
    this.drawOverlays();

    const near = alive && Math.hypot(this.pos.x - this.npc.x, this.pos.y - this.npc.y) <= TALK_RANGE;
    setPrompt(!this.uiPause && near ? 'Press E to talk to Elder Lin' : alive ? null : 'You have fallen — press R to respawn');
    const d = getDialogue('elder-lin', this.gs.quests, this.gs.inventory);
    const act = d.options[0]!.action;
    this.npcMark.setVisible(act.type === 'accept' || act.type === 'turnin');

    this.pushToState();
    updateHud({ gs: this.gs, maxHp: this.pc.maxHp, maxMana: this.pc.maxMana, cooldowns: SKILLS.map((s) => this.cds.remaining(s.id, this.now)), meditating: this.meditating });
    refreshPanels(this.gs, this.meditating);
  }

  private simulate(dt: number, alive: boolean): void {
    this.now += dt;
    if (alive) {
      const kb = this.kb;
      const dir = {
        x: Number(kb.isDown('KeyD', 'ArrowRight')) - Number(kb.isDown('KeyA', 'ArrowLeft')),
        y: Number(kb.isDown('KeyS', 'ArrowDown')) - Number(kb.isDown('KeyW', 'ArrowUp')),
      };
      if (dir.x !== 0 || dir.y !== 0) { this.meditating = false; this.facing = normalize(dir); }
      this.pos = moveWithCollision(this.world, this.pos, step(this.pos, dir, PLAYER_SPEED, dt), PLAYER_RADIUS);
      regenMana(this.pc, dt);
      if (this.meditating) { this.pushToState(); meditate(this.gs.cultivation, dt); }
      this.player.setFlipX(this.hasPointer ? this.input.activePointer.worldX < this.pos.x : this.facing.x < 0);
      this.autosaveTimer += dt;
      if (this.autosaveTimer >= AUTOSAVE_SECONDS) { this.autosaveTimer = 0; this.save(false); }
    }
    const target = alive ? this.pos : { x: 1e9, y: 1e9 };

    for (const e of this.enemies) {
      const out = updateEnemyAI(e.ai, e.def, e.pos, target, dt);
      e.pos = moveWithCollision(this.world, e.pos, { x: e.pos.x + out.vel.x * dt, y: e.pos.y + out.vel.y * dt }, ENEMY_RADIUS);
      if (out.attack?.kind === 'melee') {
        if (Math.hypot(this.pos.x - e.pos.x, this.pos.y - e.pos.y) <= e.def.attackRange + 8 + (e.def.behavior === 'charger' ? 4 : 0)) this.hurtPlayer(e.def.atk);
      } else if (out.attack?.kind === 'projectile') {
        this.fireHostile(e.pos, normalize({ x: this.pos.x - e.pos.x, y: this.pos.y - e.pos.y }), 90, 170, e.def.atk);
      }
      e.img.setPosition(e.pos.x, e.pos.y).setDepth(e.pos.y).setFlipX(this.pos.x < e.pos.x);
      e.flash = Math.max(0, e.flash - dt);
      if (e.flash > 0) e.img.setTint(0xff7777);
      else if (e.ai.state === 'windup') e.img.setTint(0xffaa33);
      else e.img.clearTint();
    }

    if (this.boss) this.updateBossEntity(this.boss, target, alive, dt);

    for (const b of [...this.bolts]) {
      const live = stepProjectile(b.p, dt);
      b.img.setPosition(b.p.pos.x, b.p.pos.y);
      let consumed = !live || isBlockedTile(this.world, Math.floor(b.p.pos.x / TILE_SIZE), Math.floor(b.p.pos.y / TILE_SIZE));
      if (!consumed && b.hostile && alive && inCircle(b.p.pos, 4, this.pos, PLAYER_RADIUS)) { this.hurtPlayer(b.damage); consumed = true; }
      if (!consumed && !b.hostile) {
        const t = this.targets().find((x) => inCircle(b.p.pos, 4, x.pos, x.radius));
        if (t) { t.hit(b.damage); consumed = true; }
      }
      if (consumed) { b.img.destroy(); this.bolts = this.bolts.filter((x) => x !== b); }
    }

    this.respawnTimer += dt;
    if (this.respawnTimer >= RESPAWN_SECONDS) {
      this.respawnTimer = 0;
      if (this.enemies.filter((e) => !e.minion).length < MAX_ROAMERS) {
        const r = this.rng();
        this.spawnRandomEnemy(r < 0.5 ? 'slime' : r < 0.75 ? 'wraith' : 'brute');
      }
    }
  }

  private fireHostile(from: Vec2, dir: Vec2, speed: number, maxDist: number, damage: number): void {
    const img = this.add.image(from.x, from.y, 'bolt').setTint(0xc77dff).setDepth(1e4);
    this.bolts.push({ p: { pos: { ...from }, vel: { x: dir.x * speed, y: dir.y * speed }, traveled: 0, maxDist }, img, hostile: true, damage });
  }

  private updateBossEntity(b: BossEnt, target: Vec2, alive: boolean, dt: number): void {
    const dist = Math.hypot(target.x - b.pos.x, target.y - b.pos.y);
    if (!b.engaged && alive && dist < 150) b.engaged = true;
    if (b.engaged && (dist > 320 || !alive)) { // leash / player died: reset the fight
      b.engaged = false; b.c.hp = b.c.maxHp; b.ai = newBossAI(); b.tele?.destroy(); b.tele = null;
      for (const m of this.enemies.filter((x) => x.minion)) m.img.destroy();
      this.enemies = this.enemies.filter((x) => !x.minion);
      setBossBar(null);
    }
    if (b.engaged) {
      const out = updateBoss(b.ai, b.def, b.c.hp / b.c.maxHp, b.pos, target, dt, this.enemies.filter((x) => x.minion).length);
      b.pos = moveWithCollision(this.world, b.pos, { x: b.pos.x + out.vel.x * dt, y: b.pos.y + out.vel.y * dt }, BOSS_RADIUS - 2);
      for (const ev of out.events) {
        if (ev.type === 'phase') toast(ev.phase === 2 ? 'The Warden calls its brood!' : 'The Warden is enraged!', 2600);
        else if (ev.type === 'slam-telegraph') {
          b.tele?.destroy();
          const g = this.add.graphics().setDepth(5);
          g.fillStyle(0xff3b30, 0.28).fillCircle(ev.at.x, ev.at.y, ev.radius).lineStyle(2, 0xff3b30, 0.9).strokeCircle(ev.at.x, ev.at.y, ev.radius);
          b.tele = g;
        } else if (ev.type === 'slam') {
          b.slams++;
          b.tele?.destroy(); b.tele = null;
          this.vfxRing(ev.radius, 0xff7043, ev.at);
          this.cameras.main.shake(120, 0.004);
          if (inCircle(ev.at, ev.radius, this.pos, PLAYER_RADIUS)) this.hurtPlayer(b.def.atk * ev.damageMult);
        } else if (ev.type === 'summon') {
          for (let i = 0; i < ev.count; i++) {
            const a = this.rng() * Math.PI * 2;
            const p = { x: b.pos.x + Math.cos(a) * 28, y: b.pos.y + Math.sin(a) * 28 };
            if (!isBlockedTile(this.world, Math.floor(p.x / TILE_SIZE), Math.floor(p.y / TILE_SIZE))) this.spawnEnemy(ev.minionType, p, true);
          }
        } else if (ev.type === 'ring') {
          for (let i = 0; i < ev.projectiles; i++) {
            const a = (i / ev.projectiles) * Math.PI * 2;
            this.fireHostile(b.pos, { x: Math.cos(a), y: Math.sin(a) }, 80, 200, b.def.atk * ev.damageMult);
          }
        }
      }
      setBossBar(b.def.name, b.c.hp, b.c.maxHp);
    }
    b.img.setPosition(b.pos.x, b.pos.y).setDepth(b.pos.y).setFlipX(target.x < b.pos.x);
    b.flash = Math.max(0, b.flash - dt);
    const st = b.ai.state;
    if (b.flash > 0) b.img.setTint(0xff7777);
    else if (st === 'slam-windup') b.img.setTint(0xff8844);
    else if (st === 'summon-windup') b.img.setTint(0x77ff88);
    else if (st === 'ring-windup') b.img.setTint(0xc77dff);
    else if (b.ai.phase === 3) b.img.setTint(0xff9999);
    else b.img.clearTint();
  }

  private drawOverlays(): void {
    this.hpBars.clear();
    for (const e of this.enemies) {
      if (e.c.hp >= e.c.maxHp) continue;
      this.hpBars.fillStyle(0x000000, 0.8).fillRect(e.pos.x - 7, e.pos.y - 14, 14, 3);
      this.hpBars.fillStyle(0xe74c3c, 1).fillRect(e.pos.x - 7, e.pos.y - 14, (14 * e.c.hp) / e.c.maxHp, 3);
    }
    this.aura.clear();
    if (this.meditating) { // PLACEHOLDER meditation aura
      const r = 10 + 3 * Math.sin(this.now * 5);
      this.aura.lineStyle(2, 0x44ffcc, 0.9).strokeCircle(this.pos.x, this.pos.y - 4, r).fillStyle(0x44ffcc, 0.15).fillCircle(this.pos.x, this.pos.y - 4, r);
    }
  }

  // ---------- test hooks (used by e2e only) ----------
  private installTestHooks(): void {
    const w = window as unknown as Record<string, unknown>;
    w.__world = () => ({ x: this.pos.x, y: this.pos.y });
    w.__rpg = {
      state: () => ({
        now: this.now, hp: this.pc.hp, mana: this.pc.mana, maxHp: this.pc.maxHp, kills: this.gs.kills, xp: this.gs.progress.xp, level: this.gs.progress.level,
        realm: this.gs.cultivation.realm, qi: this.gs.cultivation.qi, weapon: this.gs.inventory.weapon, meditating: this.meditating, bossDefeated: this.gs.bossDefeated,
        quests: Object.fromEntries(Object.entries(this.gs.quests).map(([k, v]) => [k, v.status])),
        enemies: this.enemies.map((e) => ({ id: e.id, type: e.def.id, hp: e.c.hp, x: e.pos.x, y: e.pos.y, ai: e.ai.state, minion: e.minion })),
        boss: this.boss ? { hp: this.boss.c.hp, maxHp: this.boss.c.maxHp, x: this.boss.pos.x, y: this.boss.pos.y, engaged: this.boss.engaged, phase: this.boss.ai.phase, state: this.boss.ai.state, slams: this.boss.slams } : null,
        lair: this.world.lair, spawn: this.world.spawn, npc: this.npcPos(), items: this.gs.inventory.slots.filter((s) => s).map((s) => `${s!.id}:${s!.count}`),
      }),
      cast: (i: number, x: number, y: number) => this.castSkill(i, { x, y }),
      teleport: (x: number, y: number) => { this.pos = { x, y }; },
      spawn: (type: string, x: number, y: number) => this.spawnEnemy(type, { x, y }),
      clear: () => { this.enemies.forEach((e) => e.img.destroy()); this.enemies = []; },
      setRoll: (v: number | null) => { this.rngOverride = v; },
      setQi: (v: number) => { this.gs.cultivation.qi = v; },
      setBossHpRatio: (r: number) => { if (this.boss) this.boss.c.hp = Math.max(1, Math.round(this.boss.c.maxHp * r)); },
      giveXp: (n: number) => this.mutate(() => grantXp(this.gs, n)),
      give: (id: string, n: number) => this.mutate(() => addItem(this.gs.inventory, id, n)),
      setHp: (n: number) => { this.pc.hp = n; },
      killPlayer: () => { this.hurtPlayer(9999); },
      respawnNow: () => this.respawn(),
      useSlot: (i: number) => this.useSlot(i),
    };
  }
}
