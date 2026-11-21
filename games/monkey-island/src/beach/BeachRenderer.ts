import Phaser from 'phaser';
import { GAME_H, GAME_W, HUD_SLOTS } from '../config';
import type { Interactable, Obstacle } from '../data/locations';

const TERRAIN = [
  'sand-a', 'sand-b', 'sand-c',
  ...['water-deep', 'water-shallow', 'depth-edge', 'shore', 'shore-b'].flatMap(name => [0, 1, 2, 3].map(frame => `${name}-${frame}`)),
];
const SPRITES = ['rock-a', 'rock-b', 'palm', 'stump', 'bush', 'fern', 'flower', 'axe', 'cheesesteak',
  'shadow-rock-a', 'shadow-rock-b', 'shadow-palm', 'shadow-small',
  'palm-b', 'fan-palm', 'broadleaf', 'bush-b', 'grass-tuft', 'flowers', 'shore-rocks', 'shells'];

/** The original renderer remains available without replacing any shared texture keys. */
export function modularBeachEnabled(): boolean {
  return new URLSearchParams(window.location.search).get('beach') !== 'original';
}

export function preloadBeach(scene: Phaser.Scene): void {
  if (!modularBeachEnabled()) return;
  scene.load.spritesheet('adventure-player', 'beach/sprites/adventure-player.png', { frameWidth: 20, frameHeight: 28 });
  for (const [folder, names] of [['terrain', TERRAIN], ['sprites', SPRITES]] as const) {
    for (const name of names) scene.load.image(`beach-${name}`, `beach/${folder}/${name}.png`);
  }
}

/** Beach-only presentation. Gameplay definitions/state remain owned by LocationScene. */
export class BeachRenderer {
  constructor(private readonly scene: Phaser.Scene) {
    // World foliage must not show through the existing HUD's translucent slots.
    scene.add.rectangle(0, 0, GAME_W, 20, 0x0b1020).setOrigin(0).setDepth(9500).setScrollFactor(0).setName('beach-hud-backing');
    for (let i = 0; i < HUD_SLOTS; i++) {
      scene.add.rectangle(8 + i * 24, 20, 20, 20, 0x0b1020).setOrigin(0).setDepth(9500).setScrollFactor(0).setName(`beach-slot-backing-${i}`);
    }
    scene.add.tileSprite(0, 0, GAME_W, GAME_H, 'beach-sand-c')
      .setOrigin(0).setDepth(-1000).setName('beach-ground');
    let seed = 1908;
    for (let y = 48; y < GAME_H; y += 16) {
      for (let x = 0; x < GAME_W; x += 16) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        if (seed % 100 < 22) scene.add.image(x, y, `beach-sand-${seed & 1 ? 'a' : 'b'}`).setOrigin(0).setDepth(-990);
      }
    }
    const water = [
      { name: 'water-deep', y: 0 }, { name: 'depth-edge', y: 16 },
    ].map(({ name, y }) => ({ name, phase: 0, sprite: scene.add.tileSprite(0, y, GAME_W, 16, `beach-${name}-0`)
      .setOrigin(0).setDepth(-950).setName(`beach-${name}`) }));
    // Mix shoreline silhouettes/phases instead of repeating one identical foam strip.
    for (let x = 0; x < GAME_W; x += 16) {
      const index = x / 16;
      const name = index % 3 === 1 ? 'shore-b' : 'shore';
      const phase = index % 4;
      water.push({ name, phase, sprite: scene.add.tileSprite(x, 32, 16, 16, `beach-${name}-${phase}`)
        .setOrigin(0).setDepth(-950).setName(index === 0 ? 'beach-shore' : `beach-shore-tile-${index}`) });
    }
    let frame = 0;
    scene.time.addEvent({ delay: 250, loop: true, callback: () => {
      frame = (frame + 1) % 4;
      for (const band of water) band.sprite.setTexture(`beach-${band.name}-${(frame + band.phase) % 4}`);
    } });
  }

  addStump(x: number, y: number): void {
    this.scene.add.image(x + 2, y + 13, 'beach-shadow-small').setDepth(-700);
    this.scene.add.image(x, y + 13, 'beach-stump').setOrigin(0.5, 10 / 12).setDepth(y + 13).setName('beach-stump');
  }

  textureFor(def: Interactable): string | undefined {
    if (def.kind === 'tree') return 'beach-palm';
    if (def.kind === 'pickup' && (def.item === 'axe' || def.item === 'cheesesteak')) return `beach-${def.item}`;
    return undefined;
  }

  decorate(def: Interactable, sprite: Phaser.GameObjects.Sprite & { body: Phaser.Physics.Arcade.Body }): void {
    if (!this.textureFor(def)) return;
    const tree = def.kind === 'tree';
    if (tree) {
      // Keep the old world body (415,222,10,6) and interaction entity at (420,215).
      sprite.setDisplayOrigin(33, 76);
      sprite.body.setSize(10, 6).setOffset(28, 83);
    } else {
      sprite.clearTint();
      sprite.body.setSize(10, 10).setOffset((sprite.width - 10) / 2, (sprite.height - 10) / 2);
    }
    sprite.body.updateFromGameObject();
    if (tree) sprite.setDepth(sprite.body.bottom);
    const shadow = this.scene.add.image(def.x + (tree ? 13 : 2), def.y + (tree ? 15 : 7), tree ? 'beach-shadow-palm' : 'beach-shadow-small')
      .setDepth(-700).setName(`${def.id}-shadow`);
    sprite.once(Phaser.GameObjects.Events.DESTROY, () => shadow.destroy());
  }

  createObstacles(player: Phaser.Physics.Arcade.Sprite, obstacles: Obstacle[]): void {
    let rock = 0;
    for (const obstacle of obstacles) {
      const { x, y, w, h, kind } = obstacle;
      const id = kind === 'rock' ? `rock-${rock++ === 0 ? 'a' : 'b'}` : 'water';
      const zone = this.scene.add.zone(x + w / 2, y + h / 2, w, h).setName(`beach-${id}-collider`);
      this.scene.physics.add.existing(zone, true);
      this.scene.physics.add.collider(player, zone);
      if (kind === 'rock') {
        const height = id === 'rock-a' ? 40 : 48;
        this.scene.add.image(x + w / 2 + 4, y + h - 2, `beach-shadow-${id}`).setDepth(-700);
        this.scene.add.image(x + w / 2, y + h, `beach-${id}`)
          .setOrigin(0.5, (height - 3) / height).setDepth(y + h).setName(`beach-${id}`);
      }
    }
    this.decorateEdges(player);
  }

  private decorateEdges(player: Phaser.Physics.Arcade.Sprite): void {
    const scene = this.scene;
    // Keep the opening, but replace the flat yellow block with actual sand texture.
    scene.add.tileSprite(440, 106, 40, 58, 'beach-sand-b').setOrigin(0).setDepth(-980).setName('beach-exit-path');
    for (let x = -8, i = 0; x < GAME_W; x += 26, i++) this.foliage(i % 3 === 1 ? 'bush-b' : 'bush', x, 272 + i % 3);
    for (let y = 70, i = 0; y < 260; y += 25, i++) this.foliage(i % 2 ? 'bush-b' : 'bush', 3, y);
    for (const y of [66, 88, 208, 234, 262]) this.foliage('bush', 477, y);
    const clusters: readonly (readonly [string, number, number])[] = [
      ['broadleaf', 17, 145], ['broadleaf', 28, 232], ['bush-b', 35, 194],
      ['broadleaf', 100, 270], ['broadleaf', 205, 268], ['broadleaf', 327, 270], ['broadleaf', 451, 271],
      ['broadleaf', 477, 90], ['broadleaf', 477, 225], ['bush-b', 451, 215], ['broadleaf', 327, 62],
      ['grass-tuft', 94, 64], ['grass-tuft', 61, 221], ['grass-tuft', 268, 257], ['grass-tuft', 477, 183],
      ['flowers', 24, 131], ['flowers', 53, 247], ['flowers', 375, 262], ['flowers', 456, 89],
      ['flower', 28, 124], ['flower', 17, 235], ['flower', 458, 220], ['flower', 453, 92],
      ['fern', 33, 182], ['fern', 80, 258], ['fern', 278, 260], ['fern', 472, 190], ['fern', 448, 65],
    ];
    for (const [key, x, y] of clusters) this.foliage(key, x, y);
    // Small non-solid coast details; the open movement/pickup area stays quiet.
    for (const [x, y] of [[110, 53], [276, 51], [353, 57], [142, 63]]) {
      scene.add.image(x, y, 'beach-shells').setOrigin(0.5).setDepth(-800);
    }
    for (const [x, y] of [[92, 53], [303, 52], [375, 61]]) {
      scene.add.image(x, y, 'beach-shore-rocks').setDisplayOrigin(12, 14).setDepth(-800);
    }
    const palms: readonly (readonly [string, number, number, number, number])[] = [
      ['palm', 39, 97, 33, 89], ['palm-b', 443, 85, 47, 89], ['fan-palm', 17, 264, 32, 66],
    ];
    for (const [index, [key, x, y, pivotX, pivotY]] of palms.entries()) {
      scene.add.image(x + 13, y + 2, 'beach-shadow-palm').setDepth(-700);
      scene.add.image(x, y, `beach-${key}`).setDisplayOrigin(pivotX, pivotY).setDepth(y).setName(`beach-decor-palm-${index}`);
      // Exact same three decorative trunk bodies as PR #5, independent of canopy variation.
      const trunk = scene.add.zone(x, y - 3, 10, 6).setName(`beach-decor-palm-${index}-collider`);
      scene.physics.add.existing(trunk, true);
      scene.physics.add.collider(player, trunk);
    }
  }

  private foliage(key: string, x: number, y: number): void {
    const pivots: Record<string, readonly [number, number]> = {
      bush: [16, 23], 'bush-b': [20, 26], broadleaf: [24, 38], 'grass-tuft': [12, 14],
      flowers: [12, 22], fern: [12, 22], flower: [8, 14],
    };
    const [pivotX, pivotY] = pivots[key];
    this.scene.add.image(x, y, `beach-${key}`).setDisplayOrigin(pivotX, pivotY).setDepth(y);
  }
}
