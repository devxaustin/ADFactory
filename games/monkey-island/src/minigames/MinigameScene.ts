import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import type { MinigameData } from './types';

const TEXT = { fontFamily: 'monospace', color: '#ffffff' };

/**
 * Base class for every minigame. A subclass supplies the arena (build), what
 * happens when play starts (begin) and the per-frame logic (tick). The base
 * handles input helpers, the title/countdown intro and reporting win or lose.
 *
 *   build()  -> draw the arena
 *   intro    -> title, hint, 3-2-1-GO (no input counts yet)
 *   begin()  -> start spawning things
 *   tick(dt) -> runs every frame while `running`
 *   win()/lose() -> show the result and hand control back to the world
 */
export abstract class MinigameScene extends Phaser.Scene {
  protected difficulty = 1;
  protected running = false;
  protected finished = false;
  private onDone?: (won: boolean) => void;
  private actionKeys: Phaser.Input.Keyboard.Key[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

  protected abstract readonly title: string;
  protected abstract readonly hint: string;
  protected abstract build(): void;
  protected abstract begin(): void;
  protected abstract tick(dt: number): void;

  init(data: MinigameData): void {
    this.difficulty = data.difficulty;
    this.onDone = data.onDone;
    this.running = false;
    this.finished = false;
  }

  create(): void {
    this.scene.bringToTop('Hud');
    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = kb.addKeys('W,A,S,D') as typeof this.wasd;
    this.actionKeys = [kb.addKey(Phaser.Input.Keyboard.KeyCodes.E), kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)];
    this.cameras.main.fadeIn(200, 0, 0, 0);
    this.build();
    this.playIntro();
  }

  update(_time: number, delta: number): void {
    // Read action keys every frame so a stale press never leaks into play.
    this.pressed = this.actionKeys.map((k) => Phaser.Input.Keyboard.JustDown(k)).some(Boolean);
    if (this.running && !this.finished) this.tick(delta / 1000);
  }

  private pressed = false;

  /** True on the frame E or Space went down. */
  protected actionPressed(): boolean {
    return this.pressed;
  }

  /** Movement input as a vector with length 0 or 1. */
  protected dir(): Phaser.Math.Vector2 {
    const v = new Phaser.Math.Vector2(
      (this.cursors.right.isDown || this.wasd.D.isDown ? 1 : 0) - (this.cursors.left.isDown || this.wasd.A.isDown ? 1 : 0),
      (this.cursors.down.isDown || this.wasd.S.isDown ? 1 : 0) - (this.cursors.up.isDown || this.wasd.W.isDown ? 1 : 0),
    );
    return v.lengthSq() > 0 ? v.normalize() : v;
  }

  private playIntro(): void {
    const dim = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.55).setOrigin(0).setDepth(1000);
    const title = this.add
      .text(GAME_W / 2, 100, this.title, { ...TEXT, fontSize: '20px', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setStroke('#000000', 5)
      .setDepth(1001);
    const hint = this.add
      .text(GAME_W / 2, 132, this.hint, { ...TEXT, fontSize: '10px', align: 'center', wordWrap: { width: 380 } })
      .setOrigin(0.5)
      .setStroke('#000000', 3)
      .setDepth(1001);
    const count = this.add.text(GAME_W / 2, 185, '', { ...TEXT, fontSize: '26px', fontStyle: 'bold' }).setOrigin(0.5).setStroke('#000000', 5).setDepth(1001);

    const steps = ['3', '2', '1', 'GO!'];
    steps.forEach((label, i) => {
      this.time.delayedCall(1800 + i * 600, () => {
        count.setText(label).setScale(1.4);
        this.tweens.add({ targets: count, scale: 1, duration: 300 });
      });
    });
    this.time.delayedCall(1800 + steps.length * 600, () => {
      dim.destroy();
      title.destroy();
      hint.destroy();
      count.destroy();
      this.running = true;
      this.begin();
    });
  }

  protected win(message: string): void {
    this.finish(true, message, '#7CFC8A');
  }

  protected lose(message: string): void {
    this.finish(false, message, '#ff5a5a');
  }

  private finish(won: boolean, message: string, color: string): void {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.45).setOrigin(0).setDepth(2000);
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 10, won ? 'SUCCESS!' : 'FAILED!', { ...TEXT, fontSize: '28px', fontStyle: 'bold', color })
      .setOrigin(0.5)
      .setStroke('#000000', 6)
      .setDepth(2001);
    this.add.text(GAME_W / 2, GAME_H / 2 + 22, message, { ...TEXT, fontSize: '10px' }).setOrigin(0.5).setStroke('#000000', 3).setDepth(2001);
    this.time.delayedCall(1400, () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const done = this.onDone;
        this.scene.stop();
        done?.(won);
      });
    });
  }
}
