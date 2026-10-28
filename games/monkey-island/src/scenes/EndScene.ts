import Phaser from 'phaser';
import { GAME_W } from '../config';

const FONT = { fontFamily: 'monospace', color: '#ffffff' };

export class EndScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super('End');
  }

  create(): void {
    this.leaving = false;
    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#0b1020');

    const title = this.add
      .text(GAME_W / 2, 90, 'YOU ESCAPED!', { ...FONT, fontSize: '30px', fontStyle: 'bold', color: '#f2e6b8' })
      .setOrigin(0.5)
      .setStroke('#000000', 5);
    this.tweens.add({ targets: title, scale: 1.05, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add
      .text(GAME_W / 2, 140, 'The raft slips past the violent waves\nand the island fades behind you.', {
        ...FONT,
        fontSize: '10px',
        align: 'center',
      })
      .setOrigin(0.5);

    const again = this.add.text(GAME_W / 2, 200, 'Press E or Space to play again', { ...FONT, fontSize: '11px' }).setOrigin(0.5);
    this.tweens.add({ targets: again, alpha: 0.3, duration: 650, yoyo: true, repeat: -1 });

    const kb = this.input.keyboard!;
    this.time.delayedCall(900, () => {
      for (const code of [Phaser.Input.Keyboard.KeyCodes.E, Phaser.Input.Keyboard.KeyCodes.SPACE, Phaser.Input.Keyboard.KeyCodes.ENTER]) {
        kb.addKey(code).on('down', () => this.restart());
      }
    });
  }

  private restart(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
  }
}
