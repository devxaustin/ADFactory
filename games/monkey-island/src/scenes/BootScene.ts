import Phaser from 'phaser';
import { LOCATIONS } from '../data/locations';

type Draw = (g: Phaser.GameObjects.Graphics) => void;

/**
 * Generates every placeholder texture in code. When real art exists, replace
 * a generator with `this.load.image(key, path)` under the same key and
 * nothing else in the game needs to change.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.makeTextures();
    this.scene.start('Title');
  }

  private tex(key: string, w: number, h: number, draw: Draw): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeTextures(): void {
    // Ground tiles: base colour with a few deterministic speckles.
    for (const loc of Object.values(LOCATIONS)) {
      this.tex(`ground-${loc.id}`, 16, 16, (g) => {
        g.fillStyle(loc.ground).fillRect(0, 0, 16, 16);
        g.fillStyle(loc.groundAlt);
        let n = loc.name.length * 7919;
        for (let i = 0; i < 7; i++) {
          n = (n * 1103515245 + 12345) & 0x7fffffff;
          g.fillRect(n % 15, (n >> 8) % 15, 2, 1);
        }
      });
    }

    this.tex('rock', 16, 16, (g) => {
      g.fillStyle(0x7d8590).fillRect(0, 0, 16, 16);
      g.fillStyle(0x969ea8).fillRect(1, 1, 14, 5);
      g.fillStyle(0x626a74).fillRect(0, 12, 16, 4);
    });
    this.tex('tree', 16, 16, (g) => {
      g.fillStyle(0x1f5e2c).fillRect(0, 0, 16, 16);
      g.fillStyle(0x2e7d3c).fillRect(2, 2, 12, 8);
      g.fillStyle(0x5a3b20).fillRect(6, 12, 4, 4);
    });
    this.tex('hut', 16, 16, (g) => {
      g.fillStyle(0x7a4e2a).fillRect(0, 0, 16, 16);
      g.fillStyle(0xc9a35a).fillRect(0, 0, 16, 6);
      g.fillStyle(0x5c3a1e).fillRect(0, 7, 16, 1);
    });
    this.tex('lava', 16, 16, (g) => {
      g.fillStyle(0xd9441a).fillRect(0, 0, 16, 16);
      g.fillStyle(0xf59a2c).fillRect(2, 3, 5, 2).fillRect(9, 10, 5, 2);
    });
    this.tex('water', 16, 16, (g) => {
      g.fillStyle(0x2e6fb5).fillRect(0, 0, 16, 16);
      g.fillStyle(0x4a8fd6).fillRect(1, 4, 6, 1).fillRect(9, 11, 6, 1);
    });

    this.tex('player', 12, 16, (g) => {
      g.fillStyle(0x5a3b20).fillRect(3, 0, 6, 2);
      g.fillStyle(0xf0c9a0).fillRect(3, 2, 6, 5);
      g.fillStyle(0x222222).fillRect(4, 4, 1, 1).fillRect(7, 4, 1, 1);
      g.fillStyle(0x3a7bd5).fillRect(2, 7, 8, 6);
      g.fillStyle(0x2b2b3a).fillRect(3, 13, 2, 3).fillRect(7, 13, 2, 3);
    });
    // Light-grey so it can be tinted per NPC.
    this.tex('npc', 14, 16, (g) => {
      g.fillStyle(0xdddddd).fillRect(2, 2, 10, 11);
      g.fillStyle(0x222222).fillRect(4, 5, 2, 2).fillRect(8, 5, 2, 2);
      g.fillStyle(0xbbbbbb).fillRect(3, 13, 3, 3).fillRect(8, 13, 3, 3);
    });
    // Four-legged placeholder for the Tiger and Monkeys (tinted per NPC).
    this.tex('critter', 18, 14, (g) => {
      g.fillStyle(0xdddddd).fillRect(1, 3, 12, 8).fillRect(11, 1, 6, 7);
      g.fillStyle(0xaaaaaa).fillRect(11, 0, 2, 2).fillRect(15, 0, 2, 2);
      g.fillStyle(0x222222).fillRect(13, 3, 1, 1).fillRect(15, 3, 1, 1);
      g.fillStyle(0xbbbbbb).fillRect(2, 11, 3, 3).fillRect(9, 11, 3, 3);
      g.fillStyle(0x999999).fillRect(0, 2, 2, 5);
    });
    this.tex('tree-chop', 18, 26, (g) => {
      g.fillStyle(0x5a3b20).fillRect(7, 14, 4, 12);
      g.fillStyle(0x1f5e2c).fillRect(1, 0, 16, 16);
      g.fillStyle(0x2e7d3c).fillRect(3, 2, 12, 9);
    });
    this.tex('stump', 12, 8, (g) => {
      g.fillStyle(0x5a3b20).fillRect(1, 2, 10, 6);
      g.fillStyle(0xa97c50).fillRect(2, 1, 8, 3);
    });
    this.tex('raft-site', 32, 16, (g) => {
      g.fillStyle(0x000000, 0.25).fillRect(0, 2, 32, 14);
      g.fillStyle(0x7a4e2a).fillRect(2, 0, 28, 3).fillRect(2, 5, 28, 3).fillRect(2, 10, 28, 3);
      g.fillStyle(0xa97c50).fillRect(2, 0, 28, 1).fillRect(2, 5, 28, 1).fillRect(2, 10, 28, 1);
      g.lineStyle(1, 0xffffff, 0.5).strokeRect(0.5, 0.5, 31, 15);
    });
    this.tex('pickup', 10, 10, (g) => {
      g.fillStyle(0x000000, 0.35).fillRect(0, 0, 10, 10);
      g.fillStyle(0xffffff).fillRect(1, 1, 8, 8);
    });
    this.tex('arrow', 10, 10, (g) => {
      g.fillStyle(0xffffff).fillTriangle(1, 1, 1, 9, 9, 5);
    });
    this.tex('shadow', 12, 5, (g) => {
      g.fillStyle(0x000000, 0.28).fillEllipse(6, 2.5, 12, 5);
    });
  }
}
