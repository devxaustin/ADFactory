import Phaser from 'phaser';
import { GAME_H, GAME_W, PLAY_TOP } from '../config';
import { MinigameScene } from './MinigameScene';

type Kind = 'h' | 'v';

interface Band {
  kind: Kind;
  pos: number;
  rect: Phaser.GameObjects.Rectangle;
  streak?: Phaser.GameObjects.Image;
  t: number;
  warn: number;
  active: boolean;
}

const THICK = 30;
const ACTIVE = 0.28;
const PLAYER_SPEED = 115;
const THROW_WINDOW = 4.5;
const THROW_RANGE = 70;
const WAVES: Kind[][] = [['h'], ['v'], ['h', 'v'], ['v', 'h'], ['h', 'v', 'h']];
const TIGER_HOME = { x: 410, y: 72 };
const TIGER_CENTER = { x: 240, y: 150 };

/**
 * The tiger telegraphs lunges along the row/column you are standing in.
 * Move out of the red lane before it strikes. Survive every wave, then get
 * close while it catches its breath and toss the cheesesteak.
 */
export class DodgeScene extends MinigameScene {
  protected readonly title = 'DODGE THE TIGER';
  protected readonly hint = 'Move: WASD / arrows\nLeave the red lanes before the tiger lunges.\nWhen it tires, get close and press E to toss the cheesesteak.';

  private px = 80;
  private py = 150;
  private playerImg!: Phaser.GameObjects.Image;
  private tiger!: Phaser.GameObjects.Image;
  private info!: Phaser.GameObjects.Text;
  private bands: Band[] = [];
  private waveNo = 0;
  private extra = false;
  private throwOpen = false;
  private throwLeft = 0;
  private bar!: Phaser.GameObjects.Rectangle;
  private waiting = false;

  constructor() {
    super('mg-dodge');
  }

  protected build(): void {
    this.px = 80;
    this.py = 150;
    this.bands = [];
    this.waveNo = 0;
    this.extra = false;
    this.throwOpen = false;
    this.waiting = false;

    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x2a4a2a).setOrigin(0);
    for (let x = 0; x < GAME_W; x += 40) this.add.rectangle(x, PLAY_TOP, 1, GAME_H, 0x000000, 0.1).setOrigin(0);
    for (let y = PLAY_TOP; y < GAME_H; y += 40) this.add.rectangle(0, y, GAME_W, 1, 0x000000, 0.1).setOrigin(0);

    this.playerImg = this.add.image(this.px, this.py, 'player').setDepth(5);
    this.tiger = this.add.image(TIGER_HOME.x, TIGER_HOME.y, 'critter').setTint(0xe08a2e).setScale(3).setDepth(4).setFlipX(true);
    this.tweens.add({ targets: this.tiger, y: TIGER_HOME.y + 4, duration: 500, yoyo: true, repeat: -1 });

    this.info = this.add.text(GAME_W / 2, PLAY_TOP + 8, '', { fontFamily: 'monospace', fontSize: '10px', color: '#ffffff' }).setOrigin(0.5).setStroke('#000000', 3).setDepth(10);
    this.bar = this.add.rectangle(GAME_W / 2, GAME_H - 12, 200, 6, 0xf2e6b8).setVisible(false).setDepth(10);
  }

  protected begin(): void {
    this.startWave();
  }

  private get totalWaves(): number {
    return WAVES.length;
  }

  private warnTime(): number {
    return Math.max(0.55, 1.0 - 0.06 * this.waveNo - 0.07 * (this.difficulty - 1));
  }

  private startWave(): void {
    this.waveNo++;
    this.info.setText(`Wave ${this.waveNo}/${this.totalWaves}`);
    this.spawnBands(WAVES[this.waveNo - 1]);
  }

  private spawnBands(kinds: Kind[]): void {
    const used: Record<Kind, number> = { h: 0, v: 0 };
    for (const kind of kinds) {
      let pos = kind === 'h' ? this.py : this.px;
      if (used[kind]++ > 0) pos += (Math.random() < 0.5 ? -1 : 1) * 75;
      const lo = kind === 'h' ? PLAY_TOP + THICK / 2 : THICK / 2;
      const hi = kind === 'h' ? GAME_H - THICK / 2 : GAME_W - THICK / 2;
      pos = Phaser.Math.Clamp(pos, lo, hi);

      const rect =
        kind === 'h'
          ? this.add.rectangle(0, pos - THICK / 2, GAME_W, THICK, 0xff3b30, 0.2).setOrigin(0)
          : this.add.rectangle(pos - THICK / 2, PLAY_TOP, THICK, GAME_H - PLAY_TOP, 0xff3b30, 0.2).setOrigin(0);
      rect.setStrokeStyle(2, 0xff3b30, 0.7).setDepth(3);
      this.tweens.add({ targets: rect, fillAlpha: 0.38, duration: 160, yoyo: true, repeat: -1 });
      this.bands.push({ kind, pos, rect, t: 0, warn: this.warnTime(), active: false });
    }
    this.waiting = false;
  }

  private activate(b: Band): void {
    b.active = true;
    b.t = 0;
    this.tweens.killTweensOf(b.rect);
    b.rect.setFillStyle(0xff3b30, 0.8);
    const streak = this.add.image(0, 0, 'critter').setTint(0xe08a2e).setScale(2.5).setDepth(6);
    if (b.kind === 'h') {
      const fromLeft = Math.random() < 0.5;
      streak.setPosition(fromLeft ? -20 : GAME_W + 20, b.pos).setFlipX(!fromLeft);
      this.tweens.add({ targets: streak, x: fromLeft ? GAME_W + 20 : -20, duration: ACTIVE * 1000 });
    } else {
      streak.setPosition(b.pos, PLAY_TOP - 20).setAngle(90);
      this.tweens.add({ targets: streak, y: GAME_H + 20, duration: ACTIVE * 1000 });
    }
    b.streak = streak;
  }

  private playerHit(b: Band): boolean {
    const half = THICK / 2;
    return b.kind === 'h' ? Math.abs(this.py - b.pos) < half + 5 : Math.abs(this.px - b.pos) < half + 4;
  }

  protected tick(dt: number): void {
    const d = this.dir();
    this.px = Phaser.Math.Clamp(this.px + d.x * PLAYER_SPEED * dt, 8, GAME_W - 8);
    this.py = Phaser.Math.Clamp(this.py + d.y * PLAYER_SPEED * dt, PLAY_TOP + 10, GAME_H - 10);
    this.playerImg.setPosition(this.px, this.py);
    if (d.x !== 0) this.playerImg.setFlipX(d.x < 0);

    for (const b of [...this.bands]) {
      b.t += dt;
      if (!b.active && b.t >= b.warn) this.activate(b);
      if (b.active) {
        if (this.playerHit(b)) {
          this.lose('The tiger caught you!');
          return;
        }
        if (b.t >= ACTIVE) {
          b.rect.destroy();
          b.streak?.destroy();
          this.bands = this.bands.filter((x) => x !== b);
        }
      }
    }

    if (this.bands.length === 0 && !this.waiting && !this.throwOpen) {
      this.waiting = true;
      this.time.delayedCall(650, () => this.afterWave());
    }

    if (this.throwOpen) this.tickThrow(dt);
  }

  private afterWave(): void {
    if (this.finished) return;
    if (this.extra || this.waveNo >= this.totalWaves) this.openThrow();
    else this.startWave();
  }

  private openThrow(): void {
    this.extra = false;
    this.tweens.killTweensOf(this.tiger);
    this.tweens.add({ targets: this.tiger, x: TIGER_CENTER.x, y: TIGER_CENTER.y, duration: 500, ease: 'Sine.easeInOut' });
    this.info.setText('The tiger is winded! Get close and press E!');
    this.throwOpen = true;
    this.throwLeft = THROW_WINDOW;
    this.bar.setVisible(true).setSize(200, 6);
  }

  private tickThrow(dt: number): void {
    this.throwLeft -= dt;
    this.bar.setSize(200 * Math.max(0, this.throwLeft / THROW_WINDOW), 6);

    if (this.actionPressed()) {
      const dist = Phaser.Math.Distance.Between(this.px, this.py, this.tiger.x, this.tiger.y);
      if (dist <= THROW_RANGE) return this.toss();
      this.info.setText('Too far! Get closer!');
    }
    if (this.throwLeft <= 0) {
      this.throwOpen = false;
      this.bar.setVisible(false);
      this.info.setText('It caught its breath. Here it comes!');
      this.tweens.add({ targets: this.tiger, x: TIGER_HOME.x, y: TIGER_HOME.y, duration: 400 });
      this.extra = true;
      this.spawnBands(['h', 'v']);
    }
  }

  private toss(): void {
    this.throwOpen = false;
    this.running = false;
    this.bar.setVisible(false);
    const steak = this.add.image(this.px, this.py - 6, 'pickup').setTint(0xd9a441).setDepth(8);
    this.tweens.add({
      targets: steak,
      x: this.tiger.x,
      y: this.tiger.y,
      duration: 260,
      onComplete: () => {
        steak.destroy();
        this.win('The tiger gobbles it up!');
      },
    });
  }
}
