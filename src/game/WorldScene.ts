import Phaser from 'phaser';
import townUrl from '../../assets/third_party/kenney-tiny-town/Tilemap/tilemap_packed.png';
import dungeonUrl from '../../assets/third_party/kenney-tiny-dungeon/Tilemap/tilemap_packed.png';
import { step } from '../core/movement';
import { generateWorld, moveWithCollision, TILE_SIZE, type WorldMap } from '../core/world';
import { DECO_FRAMES, DUNGEON_FRAME, GROUND_FRAME } from '../data/tiles';

const PLAYER_SPEED = 70; // px/s (world px)
const PLAYER_RADIUS = 5;
const WORLD_SEED = 20261016;

/** M1: walkable overworld using CC0 Kenney art (see docs/ASSET_LICENSE_AUDIT.md). */
export class WorldScene extends Phaser.Scene {
  private world!: WorldMap;
  private pos = { x: 0, y: 0 };
  private player!: Phaser.GameObjects.Image;
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', Phaser.Input.Keyboard.Key>;

  constructor() { super('World'); }

  preload(): void {
    this.load.spritesheet('town', townUrl, { frameWidth: TILE_SIZE, frameHeight: TILE_SIZE });
    this.load.spritesheet('dungeon', dungeonUrl, { frameWidth: TILE_SIZE, frameHeight: TILE_SIZE });
  }

  create(): void {
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
            const row = ty - (frames.length - 1) + n; // last frame sits on the blocking tile
            this.add.image(tx * TILE_SIZE, row * TILE_SIZE, 'town', frame).setOrigin(0).setDepth((ty + 1) * TILE_SIZE);
          });
        }
      }
    }

    this.pos = { ...this.world.spawn };
    this.player = this.add.image(this.pos.x, this.pos.y, 'dungeon', DUNGEON_FRAME.hero).setOrigin(0.5, 0.8);
    this.add.image(this.pos.x + 48, this.pos.y - 8, 'dungeon', DUNGEON_FRAME.wizard).setOrigin(0.5, 0.8).setDepth(this.pos.y); // PLACEHOLDER NPC position

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as typeof this.keys;

    const cam = this.cameras.main;
    cam.setBounds(0, 0, width * TILE_SIZE, height * TILE_SIZE);
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.setRoundPixels(true);
    this.applyZoom();
    this.scale.on('resize', () => this.applyZoom());

    (window as unknown as { __world?: () => unknown }).__world = () => ({ x: this.pos.x, y: this.pos.y });
  }

  /** Integer zoom keeps pixel art crisp; target ~15 tiles of height visible. */
  private applyZoom(): void {
    this.cameras.main.setZoom(Math.max(2, Math.round(this.scale.height / (TILE_SIZE * 15))));
  }

  update(_t: number, deltaMs: number): void {
    const k = this.keys;
    const dir = {
      x: Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown),
      y: Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown),
    };
    const dt = Math.min(deltaMs, 50) / 1000;
    this.pos = moveWithCollision(this.world, this.pos, step(this.pos, dir, PLAYER_SPEED, dt), PLAYER_RADIUS);
    this.player.setPosition(this.pos.x, this.pos.y).setDepth(this.pos.y);
    if (dir.x !== 0) this.player.setFlipX(dir.x < 0);
  }
}
