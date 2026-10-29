import Phaser from 'phaser';
import { CHOPS_PER_TREE, GAME_H, GAME_W, INTERACT_RANGE, PLAYER_SPEED, WOOD_NEEDED } from '../config';
import { ITEMS } from '../data/items';
import { LOCATIONS, type Exit, type Interactable, type LocationDef, type LocationId, type Side, type Trade } from '../data/locations';
import { MINIGAME_KEYS, MINIGAME_TITLES, type MinigameData } from '../minigames/types';
import { GameState } from '../systems/GameState';
import type { HudScene } from './HudScene';

interface SceneData {
  id: LocationId;
  /** Which edge of this scene the player walks in from. */
  arriveFrom?: Side;
  /** Set after dying: shows a wake-up line. */
  respawn?: boolean;
}

interface Spawned {
  def: Interactable;
  sprite: Phaser.GameObjects.Sprite & { body: Phaser.Physics.Arcade.Body };
}

interface Gate {
  flag: string;
  block: Phaser.GameObjects.TileSprite;
  collider: Phaser.Physics.Arcade.Collider;
}

const OPPOSITE: Record<Side, Side> = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
/** How wide the walk-through gap is around the midpoint of an edge. */
const EXIT_HALF_GAP_X = 36;
const EXIT_HALF_GAP_Y = 30;
const EDGE_INSET = 18;
/** After a dialogue closes, ignore interact presses this long so mashing E can't reopen it. */
const REOPEN_COOLDOWN_MS = 450;
const TEXT = { fontFamily: 'monospace', fontSize: '10px', color: '#ffffff' };

/** One class renders every location from data in data/locations.ts. */
export class LocationScene extends Phaser.Scene {
  private def!: LocationDef;
  private arriveFrom?: Side;
  private player!: Phaser.Physics.Arcade.Sprite;
  private shadow!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private interactKeys: Phaser.Input.Keyboard.Key[] = [];
  private spawned: Spawned[] = [];
  private gates: Gate[] = [];
  private prompt!: Phaser.GameObjects.Text;
  private nearby?: Spawned;
  private leaving = false;
  private frozen = false;
  private unlockAt = 0;
  private respawn = false;

  constructor() {
    super('Location');
  }

  init(data: SceneData): void {
    this.def = LOCATIONS[data.id];
    this.arriveFrom = data.arriveFrom;
    this.respawn = data.respawn ?? false;
    this.frozen = false;
    this.unlockAt = 0;
    this.spawned = [];
    this.gates = [];
    this.nearby = undefined;
    this.leaving = false;
  }

  private get hud(): HudScene {
    return this.scene.get('Hud') as HudScene;
  }

  create(): void {
    this.add.tileSprite(0, 0, GAME_W, GAME_H, `ground-${this.def.id}`).setOrigin(0).setDepth(-1000);

    this.createPlayer();
    this.createObstacles();
    this.createExitMarkers();
    this.createInteractables();

    this.prompt = this.add
      .text(0, 0, 'E', { ...TEXT, backgroundColor: '#000000a0', padding: { x: 3, y: 1 } })
      .setOrigin(0.5)
      .setDepth(10000)
      .setVisible(false);

    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = kb.addKeys('W,A,S,D') as typeof this.wasd;
    this.interactKeys = [kb.addKey(Phaser.Input.Keyboard.KeyCodes.E), kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)];

    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.hud.banner(this.def.name);
    if (this.respawn) {
      this.time.delayedCall(600, () =>
        this.hud.showDialogue(['You wake up on the beach, aching but alive.', 'Your items are still with you. Try again, more carefully.']),
      );
    }
  }

  // ---------- setup ----------

  private spawnPoint(): { x: number; y: number } {
    switch (this.arriveFrom) {
      case 'left': return { x: EDGE_INSET, y: GAME_H / 2 };
      case 'right': return { x: GAME_W - EDGE_INSET, y: GAME_H / 2 };
      case 'top': return { x: GAME_W / 2, y: EDGE_INSET };
      case 'bottom': return { x: GAME_W / 2, y: GAME_H - EDGE_INSET };
      default: return this.def.spawn;
    }
  }

  private createPlayer(): void {
    const { x, y } = this.spawnPoint();
    this.player = this.physics.add.sprite(x, y, 'player');
    this.player.setCollideWorldBounds(true);
    // Collide with the feet only so walking behind things looks right.
    this.player.body!.setSize(8, 6).setOffset(2, 10);
    this.shadow = this.add.image(0, 0, 'shadow');
  }

  private createObstacles(): void {
    for (const o of this.def.obstacles) {
      if (o.removedByFlag && GameState.hasFlag(o.removedByFlag)) continue;
      const block = this.add.tileSprite(o.x + o.w / 2, o.y + o.h / 2, o.w, o.h, o.kind).setDepth(o.y + o.h - 1);
      this.physics.add.existing(block, true);
      const collider = this.physics.add.collider(this.player, block);
      if (o.removedByFlag) this.gates.push({ flag: o.removedByFlag, block, collider });
    }
  }

  private createExitMarkers(): void {
    const rot: Record<Side, number> = { right: 0, bottom: 90, left: 180, top: 270 };
    for (const exit of this.def.exits) {
      const horizontal = exit.side === 'left' || exit.side === 'right';
      const x = horizontal ? (exit.side === 'left' ? 8 : GAME_W - 8) : GAME_W / 2;
      const y = horizontal ? GAME_H / 2 : exit.side === 'top' ? 24 : GAME_H - 8;
      const arrow = this.add.image(x, y, 'arrow').setAngle(rot[exit.side]).setDepth(9000).setAlpha(0.9);
      const dx = exit.side === 'right' ? -3 : exit.side === 'left' ? 3 : 0;
      const dy = exit.side === 'bottom' ? -3 : exit.side === 'top' ? 3 : 0;
      this.tweens.add({ targets: arrow, x: x + dx, y: y + dy, duration: 450, yoyo: true, repeat: -1 });
      const lx = horizontal ? (exit.side === 'left' ? 34 : GAME_W - 34) : x;
      const ly = horizontal ? y - 14 : exit.side === 'top' ? 38 : GAME_H - 22;
      this.add
        .text(lx, ly, exit.label, { ...TEXT, fontSize: '8px' })
        .setOrigin(0.5)
        .setStroke('#000000', 3)
        .setDepth(9000)
        .setAlpha(0.85);
    }
  }

  private createInteractables(): void {
    for (const def of this.def.interactables) {
      if (def.hideWhen && GameState.hasFlag(def.hideWhen)) continue;
      if (def.kind === 'pickup' && GameState.hasFlag(`taken:${def.id}`)) continue;
      if (def.kind === 'tree' && GameState.hasFlag(`chopped:${def.id}`)) {
        this.add.image(def.x, def.y + 8, 'stump').setDepth(def.y + 12);
        continue;
      }
      this.spawn(def);
    }
  }

  private spawn(def: Interactable): void {
    const key = def.kind === 'pickup' ? 'pickup' : def.kind === 'tree' ? 'tree-chop' : def.kind === 'raft' ? 'raft-site' : (def.sprite ?? 'npc');
    const sprite = this.physics.add.sprite(def.x, def.y, key) as Spawned['sprite'];

    if (def.kind === 'pickup') {
      sprite.setTint(def.item ? ITEMS[def.item].color : 0xffffff).setDepth(def.y - 1);
      this.tweens.add({ targets: sprite, y: def.y - 3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      sprite.body.setImmovable(true);
      if (def.kind === 'tree') sprite.body.setSize(10, 6).setOffset(4, 20);
      else if (def.kind === 'raft') sprite.body.setSize(30, 12).setOffset(1, 2);
      else {
        sprite.setTint(def.color ?? 0xffffff);
        sprite.body.setSize(10, 6).setOffset((sprite.width - 10) / 2, sprite.height - 6);
      }
      sprite.setDepth(sprite.body.bottom);
      this.physics.add.collider(this.player, sprite);
    }
    this.spawned.push({ def, sprite });
  }

  // ---------- loop ----------

  update(): void {
    if (this.leaving) return;
    const body = this.player.body!;

    // Read the interact keys every frame so a stale press never fires later.
    const pressed = this.interactKeys.map((k) => Phaser.Input.Keyboard.JustDown(k)).some(Boolean);

    if (this.frozen || this.time.now < this.unlockAt) {
      this.player.setVelocity(0, 0);
      this.prompt.setVisible(false);
      return;
    }

    if (this.hud.isDialogueOpen) {
      this.player.setVelocity(0, 0);
    } else {
      this.move();
      this.checkExits();
    }
    this.player.setDepth(body.bottom);
    this.shadow.setPosition(body.center.x, body.bottom + 1).setDepth(body.bottom - 1);
    this.updateNearby();

    if (!this.hud.isDialogueOpen && performance.now() - this.hud.lastClosedAt > REOPEN_COOLDOWN_MS && this.nearby && pressed) {
      this.interact(this.nearby);
    }
  }

  private move(): void {
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;
    const v = new Phaser.Math.Vector2((right ? 1 : 0) - (left ? 1 : 0), (down ? 1 : 0) - (up ? 1 : 0));
    if (v.lengthSq() > 0) v.normalize().scale(PLAYER_SPEED);
    this.player.setVelocity(v.x, v.y);
    if (v.x !== 0) this.player.setFlipX(v.x < 0);
  }

  private checkExits(): void {
    const b = this.player.body!;
    const cx = b.center.x;
    const cy = b.center.y;
    for (const exit of this.def.exits) {
      const inGapY = Math.abs(cy - GAME_H / 2) <= EXIT_HALF_GAP_Y;
      const inGapX = Math.abs(cx - GAME_W / 2) <= EXIT_HALF_GAP_X;
      const hit =
        (exit.side === 'left' && b.left <= 0.5 && inGapY) ||
        (exit.side === 'right' && b.right >= GAME_W - 0.5 && inGapY) ||
        (exit.side === 'top' && b.top <= 0.5 && inGapX) ||
        (exit.side === 'bottom' && b.bottom >= GAME_H - 0.5 && inGapX);
      if (hit) {
        this.leave(exit);
        return;
      }
    }
  }

  private leave(exit: Exit): void {
    this.leaving = true;
    this.player.setVelocity(0, 0);
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({ id: exit.to, arriveFrom: OPPOSITE[exit.side] } satisfies SceneData);
    });
  }

  private updateNearby(): void {
    let best: Spawned | undefined;
    let bestD = INTERACT_RANGE;
    const p = this.player.body!.center;
    for (const s of this.spawned) {
      // Measure to the base of the sprite so tall things (trees) feel right.
      const d = Phaser.Math.Distance.Between(p.x, p.y, s.sprite.body.center.x, s.sprite.body.center.y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    this.nearby = best;
    if (best && !this.hud.isDialogueOpen) {
      this.prompt.setVisible(true).setPosition(best.sprite.x, best.sprite.y - best.sprite.displayHeight / 2 - 8);
    } else {
      this.prompt.setVisible(false);
    }
  }

  // ---------- interactions ----------

  private interact(target: Spawned): void {
    switch (target.def.kind) {
      case 'pickup': return this.pickUp(target);
      case 'npc': return this.talk(target);
      case 'tree': return this.chop(target);
      case 'raft': return this.buildRaft();
    }
  }

  private remove(target: Spawned): void {
    this.tweens.killTweensOf(target.sprite);
    target.sprite.destroy();
    this.spawned = this.spawned.filter((s) => s !== target);
    if (this.nearby === target) this.nearby = undefined;
  }

  private pickUp(target: Spawned): void {
    const { def } = target;
    if (!def.item) return;
    GameState.add(def.item);
    GameState.setFlag(`taken:${def.id}`);
    this.remove(target);
    this.hud.showDialogue([...def.lines, `Got: ${ITEMS[def.item].name}.`]);
  }

  private talk(target: Spawned): void {
    const { def } = target;
    const trade = def.trade;
    if (!trade) return this.say(target, def.lines, 'idle');
    if (GameState.hasFlag(trade.flag)) return this.say(target, trade.afterLines, 'after');
    if (!GameState.has(trade.wants)) return this.say(target, def.lines, 'idle');

    const mg = trade.minigame;
    if (!mg) return this.completeTrade(def, trade);

    const first = GameState.bump(`attempts:${trade.flag}`) === 1;
    this.hud.showDialogue(first ? mg.intro : [mg.retry], def.label, () => this.runMinigame(def, trade));
  }

  /**
   * Small talk. The first time in a given state it opens the dialogue box; every
   * repeat is a non-blocking speech bubble so you can never get stuck re-reading it.
   */
  private say(target: Spawned, lines: string[], state: 'idle' | 'after'): void {
    if (lines.length === 0) return;
    const n = GameState.bump(`spoke:${target.def.id}:${state}`);
    if (n === 1) return this.hud.showDialogue(lines, target.def.label);
    this.bubble(target.sprite, lines[(n - 2) % lines.length]);
  }

  private bubbleText?: Phaser.GameObjects.Text;

  private bubble(anchor: Phaser.GameObjects.Sprite, line: string): void {
    this.bubbleText?.destroy();
    const t = this.add
      .text(0, 0, line, { ...TEXT, fontSize: '9px', backgroundColor: '#0b1020e6', padding: { x: 5, y: 3 }, wordWrap: { width: 150 }, align: 'center' })
      .setOrigin(0.5, 1)
      .setDepth(10002);
    t.setPosition(Phaser.Math.Clamp(anchor.x, 90, GAME_W - 90), Math.max(t.height + 22, anchor.y - anchor.displayHeight / 2 - 6));
    this.bubbleText = t;
    this.time.delayedCall(2600, () => {
      if (this.bubbleText !== t) return;
      this.tweens.add({ targets: t, alpha: 0, duration: 250, onComplete: () => t.destroy() });
    });
  }

  private completeTrade(def: Interactable, trade: Trade): void {
    GameState.bump(`spoke:${def.id}:after`); // the trade dialogue counts as the first 'after' chat
    GameState.remove(trade.wants);
    if (trade.gives) GameState.add(trade.gives);
    GameState.setFlag(trade.flag);
    const lines = trade.gives ? [...trade.lines, `Got: ${ITEMS[trade.gives].name}.`] : trade.lines;
    this.hud.showDialogue(lines, def.label);
    this.refreshWorld();
  }

  private runMinigame(def: Interactable, trade: Trade): void {
    const mg = trade.minigame!;
    this.frozen = true;
    this.hud.setMinigame(MINIGAME_TITLES[mg.id]);
    const data: MinigameData = {
      difficulty: mg.difficulty,
      onDone: (won) => {
        this.hud.setMinigame();
        this.frozen = false;
        this.unlockAt = this.time.now + 350;
        if (won) this.completeTrade(def, trade);
        else this.failEncounter(def, trade);
      },
    };
    this.scene.launch(MINIGAME_KEYS[mg.id], data);
  }

  private failEncounter(def: Interactable, trade: Trade): void {
    const lines = trade.minigame!.failLines;
    const hearts = GameState.hurt();
    if (hearts > 0) {
      this.hud.showDialogue([...lines, `Hearts left: ${hearts}.`], def.label);
    } else {
      this.hud.showDialogue([...lines, 'Everything goes dark...'], def.label, () => this.die());
    }
  }

  private die(): void {
    this.leaving = true;
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      GameState.die();
      this.scene.restart({ id: 'beach', respawn: true } satisfies SceneData);
    });
  }

  /** Apply flag changes to what is already on screen (gates open, NPCs leave). */
  private refreshWorld(): void {
    this.gates = this.gates.filter((g) => {
      if (!GameState.hasFlag(g.flag)) return true;
      this.physics.world.removeCollider(g.collider);
      g.block.destroy();
      return false;
    });
    for (const s of [...this.spawned]) {
      if (s.def.hideWhen && GameState.hasFlag(s.def.hideWhen)) {
        this.tweens.add({ targets: s.sprite, alpha: 0, duration: 400, onComplete: () => s.sprite.destroy() });
        this.spawned = this.spawned.filter((x) => x !== s);
        if (this.nearby === s) this.nearby = undefined;
      }
    }
  }

  private chop(target: Spawned): void {
    const { def, sprite } = target;
    if (!GameState.has('axe')) {
      return this.hud.showDialogue(['A solid tree. You would need an axe to chop it down.']);
    }
    const hits = GameState.bump(`hits:${def.id}`);
    this.tweens.killTweensOf(sprite);
    sprite.setX(def.x);
    this.tweens.add({ targets: sprite, x: def.x + 2, duration: 40, yoyo: true, repeat: 2, onComplete: () => sprite.setX(def.x) });
    this.leafBurst(sprite.x, sprite.y - 6);

    if (hits < CHOPS_PER_TREE) {
      this.floatText(sprite.x, sprite.y - 18, 'Chop!');
      return;
    }
    GameState.add('wood');
    GameState.setFlag(`chopped:${def.id}`);
    this.floatText(sprite.x, sprite.y - 18, `+1 Wood (${GameState.count('wood')}/${WOOD_NEEDED})`);
    const { x, y } = def;
    this.remove(target);
    this.add.image(x, y + 8, 'stump').setDepth(y + 12);
  }

  private buildRaft(): void {
    const wood = GameState.count('wood');
    const missing: string[] = [];
    if (wood < WOOD_NEEDED) missing.push(`wood (${wood}/${WOOD_NEEDED})`);
    if (!GameState.has('rope')) missing.push('rope');
    if (!GameState.has('sail')) missing.push('a sail');

    if (missing.length > 0) {
      return this.hud.showDialogue(['A good spot to build a raft, past the violent waves.', `You still need: ${missing.join(', ')}.`]);
    }
    GameState.remove('wood', WOOD_NEEDED);
    GameState.remove('rope');
    GameState.remove('sail');
    GameState.setFlag('raft_built');
    this.hud.showDialogue(
      ['You lash the wood together with the rope and raise the sail.', 'The raft is ready. Time to leave the island.'],
      '',
      () => this.escape(),
    );
  }

  private escape(): void {
    this.leaving = true;
    GameState.setFlag('escaped');
    this.player.setVelocity(0, 0);
    this.cameras.main.fadeOut(900, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('Hud');
      this.scene.start('End');
    });
  }

  // ---------- juice ----------

  private floatText(x: number, y: number, text: string): void {
    const t = this.add.text(x, y, text, TEXT).setOrigin(0.5).setStroke('#000000', 3).setDepth(10000);
    this.tweens.add({ targets: t, y: y - 14, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  private leafBurst(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      const leaf = this.add.rectangle(x + Phaser.Math.Between(-6, 6), y, 2, 2, 0x4caf50).setDepth(10000);
      this.tweens.add({
        targets: leaf,
        x: leaf.x + Phaser.Math.Between(-12, 12),
        y: leaf.y + Phaser.Math.Between(8, 20),
        alpha: 0,
        duration: 500,
        onComplete: () => leaf.destroy(),
      });
    }
  }
}
