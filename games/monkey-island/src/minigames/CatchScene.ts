import Phaser from 'phaser';
import { GAME_H, GAME_W, PLAY_TOP } from '../config';
import { MinigameScene } from './MinigameScene';

interface Falling {
  obj: Phaser.GameObjects.Shape;
  kind: 'banana' | 'coconut';
  vy: number;
}

const BASKET_W = 40;
const BASKET_Y = GAME_H - 18;
const BASKET_SPEED = 210;
const MAX_BONKS = 2;
const TIME_LIMIT = 28;

/** The monkeys toss bananas (and coconuts). Catch enough bananas before time runs out. */
export class CatchScene extends MinigameScene {
  protected readonly title = 'CATCH THE BANANAS';
  protected readonly hint = 'Move the basket: A / D or left / right arrows\nCatch the bananas. Dodge the coconuts!';

  private basket!: Phaser.GameObjects.Rectangle;
  private monkeys: Phaser.GameObjects.Image[] = [];
  private items: Falling[] = [];
  private info!: Phaser.GameObjects.Text;
  private caught = 0;
  private bonks = 0;
  private timeLeft = TIME_LIMIT;
  private spawnIn = 0.5;
  private elapsed = 0;

  constructor() {
    super('mg-catch');
  }

  private get target(): number {
    return 9 + this.difficulty;
  }

  protected build(): void {
    this.items = [];
    this.monkeys = [];
    this.caught = 0;
    this.bonks = 0;
    this.timeLeft = TIME_LIMIT;
    this.spawnIn = 0.5;
    this.elapsed = 0;

    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x1f5e2c).setOrigin(0);
    this.add.rectangle(0, GAME_H - 8, GAME_W, 8, 0x5a3b20).setOrigin(0);
    for (const x of [70, 240, 410]) {
      const m = this.add.image(x, PLAY_TOP + 26, 'critter').setTint(0x8b5a2b).setScale(2).setDepth(4);
      this.tweens.add({ targets: m, y: m.y + 3, duration: 350 + x, yoyo: true, repeat: -1 });
      this.monkeys.push(m);
    }
    this.basket = this.add.rectangle(GAME_W / 2, BASKET_Y, BASKET_W, 12, 0xc9a56a).setStrokeStyle(2, 0x7a4e2a).setDepth(6);
    this.info = this.add.text(GAME_W / 2, GAME_H - 28, '', { fontFamily: 'monospace', fontSize: '10px', color: '#ffffff' }).setOrigin(0.5).setStroke('#000000', 3).setDepth(10);
    this.refreshInfo();
  }

  protected begin(): void {
    this.spawnIn = 0.2;
  }

  private refreshInfo(): void {
    this.info.setText(`Bananas ${this.caught}/${this.target}   Bonks ${this.bonks}/${MAX_BONKS}   Time ${Math.ceil(this.timeLeft)}`);
  }

  private spawn(): void {
    const monkey = Phaser.Utils.Array.GetRandom(this.monkeys);
    const coconutChance = 0.28 + 0.06 * (this.difficulty - 1);
    const kind = Math.random() < coconutChance ? 'coconut' : 'banana';
    const obj =
      kind === 'banana'
        ? this.add.rectangle(monkey.x, monkey.y + 12, 12, 5, 0xf2e04a)
        : this.add.ellipse(monkey.x, monkey.y + 12, 11, 11, 0x4a2f18).setStrokeStyle(1, 0x2a1a0c);
    obj.setDepth(5);
    const speed = 85 + Math.min(70, this.elapsed * 3) + 15 * (this.difficulty - 1);
    this.items.push({ obj, kind, vy: speed });
  }

  protected tick(dt: number): void {
    this.elapsed += dt;
    this.timeLeft -= dt;

    const dx = this.dir().x;
    this.basket.x = Phaser.Math.Clamp(this.basket.x + dx * BASKET_SPEED * dt, BASKET_W / 2, GAME_W - BASKET_W / 2);

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawn();
      this.spawnIn = Math.max(0.5, 0.95 - this.elapsed * 0.012) + Math.random() * 0.25;
    }

    for (const it of [...this.items]) {
      it.obj.y += it.vy * dt;
      const inX = Math.abs(it.obj.x - this.basket.x) < BASKET_W / 2 + 3;
      const inY = it.obj.y > BASKET_Y - 10 && it.obj.y < BASKET_Y + 6;
      if (inX && inY) {
        this.items = this.items.filter((x) => x !== it);
        it.obj.destroy();
        if (it.kind === 'banana') {
          this.caught++;
          this.pop(this.basket.x, BASKET_Y - 14, '+1', '#f2e04a');
        } else {
          this.bonks++;
          this.cameras.main.shake(150, 0.008);
          this.pop(this.basket.x, BASKET_Y - 14, 'BONK!', '#ff5a5a');
        }
        this.refreshInfo();
      } else if (it.obj.y > GAME_H + 10) {
        this.items = this.items.filter((x) => x !== it);
        it.obj.destroy();
      }
    }

    this.refreshInfo();
    if (this.bonks >= MAX_BONKS) return this.lose('Knocked out by coconuts!');
    if (this.caught >= this.target) return this.win('The monkeys are impressed!');
    if (this.timeLeft <= 0) this.lose("Time's up!");
  }

  private pop(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, { fontFamily: 'monospace', fontSize: '10px', color }).setOrigin(0.5).setStroke('#000000', 3).setDepth(12);
    this.tweens.add({ targets: t, y: y - 16, alpha: 0, duration: 600, onComplete: () => t.destroy() });
  }
}
