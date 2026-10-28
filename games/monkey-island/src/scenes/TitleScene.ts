import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import { GameState } from '../systems/GameState';

const FONT = { fontFamily: 'monospace', color: '#ffffff' };

export class TitleScene extends Phaser.Scene {
  private starting = false;

  constructor() {
    super('Title');
  }

  create(): void {
    this.starting = false;
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x2e6fb5).setOrigin(0);
    for (let i = 0; i < 6; i++) {
      const wave = this.add.rectangle(30 + i * 80, 40 + (i % 3) * 50, 40, 2, 0x4a8fd6).setOrigin(0);
      this.tweens.add({ targets: wave, x: wave.x + 18, duration: 1800 + i * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.add.ellipse(GAME_W / 2, GAME_H + 20, 360, 110, 0xe6d28f);

    const title = this.add
      .text(GAME_W / 2, 86, 'MONKEY ISLAND', { ...FONT, fontSize: '32px', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setStroke('#0b1020', 6);
    this.tweens.add({ targets: title, y: 92, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add
      .text(GAME_W / 2, 126, 'Feed the tiger. Help the village. Build a raft.', { ...FONT, fontSize: '10px' })
      .setOrigin(0.5)
      .setStroke('#0b1020', 3);

    const start = this.add
      .text(GAME_W / 2, 190, 'Press E or Space to start', { ...FONT, fontSize: '12px' })
      .setOrigin(0.5)
      .setStroke('#0b1020', 4);
    this.tweens.add({ targets: start, alpha: 0.3, duration: 650, yoyo: true, repeat: -1 });

    this.add
      .text(GAME_W / 2, 222, 'WASD / arrows: move     E / Space: interact', { ...FONT, fontSize: '9px', color: '#3b2c14' })
      .setOrigin(0.5);

    const kb = this.input.keyboard!;
    for (const code of [Phaser.Input.Keyboard.KeyCodes.E, Phaser.Input.Keyboard.KeyCodes.SPACE, Phaser.Input.Keyboard.KeyCodes.ENTER]) {
      kb.addKey(code).on('down', () => this.begin());
    }
    this.input.once('pointerdown', () => this.begin());
  }

  private begin(): void {
    if (this.starting) return;
    this.starting = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      GameState.reset();
      this.scene.launch('Hud');
      this.scene.start('Location', { id: 'beach' });
    });
  }
}
