import Phaser from 'phaser';
import { GAME_H, GAME_W, HUD_SLOTS, MAX_HEARTS } from '../config';
import { ITEMS } from '../data/items';
import { GameState } from '../systems/GameState';

const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
const FONT = { fontFamily: 'monospace', fontSize: '10px', color: '#ffffff' };

/** Always-on overlay: objective, inventory, dialogue box, location banner. */
export class HudScene extends Phaser.Scene {
  private ready = false;
  private pendingBanner?: string;
  private objectiveText!: Phaser.GameObjects.Text;
  private slotLayer!: Phaser.GameObjects.Container;
  private heartGfx!: Phaser.GameObjects.Graphics;
  private minigameTitle?: string;
  private bannerText!: Phaser.GameObjects.Text;

  private box!: Phaser.GameObjects.Container;
  private bodyText!: Phaser.GameObjects.Text;
  private speakerText!: Phaser.GameObjects.Text;
  private moreMark!: Phaser.GameObjects.Text;
  private lines: string[] = [];
  private lineIndex = 0;
  private typing?: Phaser.Time.TimerEvent;
  private onDone?: () => void;
  private ignoreUntil = 0;
  private keys: Phaser.Input.Keyboard.Key[] = [];

  /** True while the dialogue box is on screen. Gameplay should pause. */
  isDialogueOpen = false;

  constructor() {
    super('Hud');
  }

  init(): void {
    this.ready = false;
    this.pendingBanner = undefined;
    this.isDialogueOpen = false;
    this.typing = undefined;
    this.onDone = undefined;
    this.lines = [];
    this.minigameTitle = undefined;
  }

  create(): void {
    this.scene.bringToTop();
    const kb = this.input.keyboard!;
    this.keys = [
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
    ];

    this.add.rectangle(0, 0, GAME_W, 16, 0x000000, 0.55).setOrigin(0);
    this.objectiveText = this.add.text(6, 2, '', FONT);
    this.slotLayer = this.add.container(0, 0);
    this.heartGfx = this.add.graphics();

    this.bannerText = this.add
      .text(GAME_W / 2, 70, '', { ...FONT, fontSize: '20px' })
      .setOrigin(0.5)
      .setAlpha(0)
      .setStroke('#000000', 4);

    this.buildDialogueBox();
    this.redraw();

    GameState.on('change', this.redraw, this);
    this.events.once('shutdown', () => GameState.off('change', this.redraw, this));

    this.ready = true;
    if (this.pendingBanner) this.banner(this.pendingBanner);
  }

  private buildDialogueBox(): void {
    const w = GAME_W - 40;
    const h = 58;
    const x = 20;
    const y = GAME_H - h - 10;
    const bg = this.add.rectangle(x, y, w, h, 0x0b1020, 0.92).setOrigin(0).setStrokeStyle(2, 0xf2e6b8);
    this.speakerText = this.add.text(x + 8, y + 4, '', { ...FONT, color: '#f2e6b8' });
    this.bodyText = this.add.text(x + 8, y + 18, '', { ...FONT, wordWrap: { width: w - 20 } });
    this.moreMark = this.add.text(x + w - 14, y + h - 14, '▼', { ...FONT, color: '#f2e6b8' });
    this.tweens.add({ targets: this.moreMark, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });
    this.box = this.add.container(0, 0, [bg, this.speakerText, this.bodyText, this.moreMark]).setVisible(false);
  }

  private redraw(): void {
    this.objectiveText.setText(this.minigameTitle ?? `> ${GameState.objective}`);
    this.slotLayer.setVisible(!this.minigameTitle);
    this.drawHearts();
    this.slotLayer.removeAll(true);
    const y = 20;
    for (let i = 0; i < HUD_SLOTS; i++) {
      const x = 8 + i * 24;
      this.slotLayer.add(this.add.rectangle(x, y, 20, 20, 0x000000, 0.55).setOrigin(0).setStrokeStyle(1, 0xffffff, 0.6));
      const slot = GameState.inventory[i];
      if (!slot) continue;
      this.slotLayer.add(this.add.rectangle(x + 4, y + 4, 12, 12, ITEMS[slot.id].color).setOrigin(0));
      if (slot.count > 1) {
        this.slotLayer.add(
          this.add.text(x + 20, y + 20, String(slot.count), { ...FONT, fontSize: '9px' }).setOrigin(1).setStroke('#000', 3),
        );
      }
    }
  }

  private drawHearts(): void {
    const g = this.heartGfx;
    g.clear();
    for (let i = 0; i < MAX_HEARTS; i++) {
      const x = GAME_W - 8 - (MAX_HEARTS - i) * 18;
      g.fillStyle(i < GameState.hearts ? 0xe0334c : 0x4a3a40);
      HEART.forEach((row, ry) =>
        [...row].forEach((c, rx) => {
          if (c === 'X') g.fillRect(x + rx * 2, 2 + ry * 2, 2, 2);
        }),
      );
    }
  }

  /** Minigames call this so the bar shows their title and the inventory hides. */
  setMinigame(title?: string): void {
    this.minigameTitle = title;
    this.redraw();
  }

  banner(name: string): void {
    if (!this.ready) {
      this.pendingBanner = name;
      return;
    }
    this.pendingBanner = undefined;
    this.tweens.killTweensOf(this.bannerText);
    this.bannerText.setText(name).setAlpha(0);
    this.tweens.add({ targets: this.bannerText, alpha: 1, duration: 300, yoyo: true, hold: 1100 });
  }

  showDialogue(lines: string[], speaker = '', onDone?: () => void): void {
    this.lines = lines;
    this.lineIndex = 0;
    this.onDone = onDone;
    this.speakerText.setText(speaker);
    this.isDialogueOpen = true;
    this.ignoreUntil = this.time.now + 150; // swallow the key press that opened it
    this.box.setVisible(true);
    this.typeLine();
  }

  private typeLine(): void {
    const line = this.lines[this.lineIndex];
    this.bodyText.setText('');
    this.moreMark.setVisible(false);
    let i = 0;
    this.typing?.remove();
    this.typing = this.time.addEvent({
      delay: 18,
      repeat: line.length - 1,
      callback: () => {
        this.bodyText.setText(line.slice(0, ++i));
        if (i >= line.length) this.moreMark.setVisible(true);
      },
    });
  }

  update(): void {
    if (!this.isDialogueOpen || this.time.now < this.ignoreUntil) return;
    if (!this.keys.some((k) => Phaser.Input.Keyboard.JustDown(k))) return;

    const line = this.lines[this.lineIndex];
    if (this.typing && this.typing.getRepeatCount() > 0) {
      // Still typing: finish the line instantly.
      this.typing.remove();
      this.bodyText.setText(line);
      this.moreMark.setVisible(true);
      return;
    }
    if (++this.lineIndex < this.lines.length) {
      this.typeLine();
    } else {
      this.box.setVisible(false);
      this.isDialogueOpen = false;
      const cb = this.onDone;
      this.onDone = undefined;
      cb?.();
    }
  }
}
