import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import type { Interactable, Obstacle } from '../data/locations';

const TERRAIN = [
  'sand-a', 'sand-b', 'sand-c',
  ...['water-deep', 'water-shallow', 'depth-edge', 'shore'].flatMap(name => [0, 1, 2, 3].map(frame => `${name}-${frame}`)),
];
const SPRITES = ['rock-a', 'rock-b', 'palm', 'stump', 'bush', 'fern', 'flower', 'axe', 'cheesesteak',
  'shadow-rock-a', 'shadow-rock-b', 'shadow-palm', 'shadow-small'];

/** The original renderer remains available without replacing any shared texture keys. */
export function modularBeachEnabled(): boolean {
  return new URLSearchParams(window.location.search).get('beach') !== 'original';
}

export function preloadBeach(scene: Phaser.Scene): void {
  if (!modularBeachEnabled()) return;
  for (const [folder, names] of [['terrain', TERRAIN], ['sprites', SPRITES]] as const) {
    for (const name of names) scene.load.image(`beach-${name}`, `beach/${folder}/${name}.png`);
  }
}

/** Beach-only presentation. Gameplay definitions/state remain owned by LocationScene. */
export class BeachRenderer {
  constructor(private readonly scene: Phaser.Scene) {
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
      { name: 'water-deep', y: 0 }, { name: 'depth-edge', y: 16 }, { name: 'shore', y: 32 },
    ].map(({ name, y }) => ({ name, sprite: scene.add.tileSprite(0, y, GAME_W, 16, `beach-${name}-0`)
      .setOrigin(0).setDepth(-950).setName(`beach-${name}`) }));
    let frame = 0;
    scene.time.addEvent({ delay: 250, loop: true, callback: () => {
      frame = (frame + 1) % 4;
      for (const band of water) band.sprite.setTexture(`beach-${band.name}-${frame}`);
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
    scene.add.graphics().fillStyle(0xffe0a0).fillRect(448, 112, 32, 48).fillRect(440, 120, 8, 32)
      .setDepth(-980).setName('beach-exit-path');
    for (let x = -8; x < GAME_W; x += 26) scene.add.image(x, 270, 'beach-bush').setOrigin(0.5, 1).setDepth(270);
    for (let y = 70; y < 260; y += 25) scene.add.image(3, y, 'beach-bush').setOrigin(0.5, 1).setDepth(y);
    for (const y of [66, 88, 208, 234, 262]) scene.add.image(477, y, 'beach-bush').setOrigin(0.5, 1).setDepth(y);
    for (const [x, y] of [[28, 124], [17, 235], [458, 220], [453, 92]]) scene.add.image(x, y, 'beach-flower').setOrigin(0.5, 1).setDepth(y);
    for (const [x, y] of [[33, 182], [80, 258], [278, 260], [472, 190], [448, 65]]) scene.add.image(x, y, 'beach-fern').setOrigin(0.5, 1).setDepth(y);
    for (const [index, [x, y]] of [[39, 97], [443, 85], [17, 264]].entries()) {
      scene.add.image(x + 13, y + 2, 'beach-shadow-palm').setDepth(-700);
      scene.add.image(x, y, 'beach-palm').setDisplayOrigin(33, 89).setDepth(y).setName(`beach-decor-palm-${index}`);
      const trunk = scene.add.zone(x, y - 3, 10, 6).setName(`beach-decor-palm-${index}-collider`);
      scene.physics.add.existing(trunk, true);
      scene.physics.add.collider(player, trunk);
    }
  }
}
