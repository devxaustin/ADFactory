import Phaser from 'phaser';
import { WOOD_NEEDED } from '../config';
import { ITEMS, type ItemId } from '../data/items';

export interface InventorySlot {
  id: ItemId;
  count: number;
}

/**
 * Single source of truth for progress. Scenes read it and listen to
 * 'change' instead of passing data around, so the HUD stays in sync.
 */
class GameStateStore extends Phaser.Events.EventEmitter {
  inventory: InventorySlot[] = [];
  flags = new Set<string>();
  private counters = new Map<string, number>();

  add(id: ItemId, count = 1): void {
    const slot = this.inventory.find((s) => s.id === id);
    if (slot && ITEMS[id].stackable) slot.count += count;
    else if (!slot) this.inventory.push({ id, count });
    this.emit('change');
  }

  count(id: ItemId): number {
    return this.inventory.find((s) => s.id === id)?.count ?? 0;
  }

  has(id: ItemId, count = 1): boolean {
    return this.count(id) >= count;
  }

  remove(id: ItemId, count = 1): boolean {
    const slot = this.inventory.find((s) => s.id === id);
    if (!slot || slot.count < count) return false;
    slot.count -= count;
    if (slot.count <= 0) this.inventory = this.inventory.filter((s) => s !== slot);
    this.emit('change');
    return true;
  }

  setFlag(flag: string): void {
    this.flags.add(flag);
    this.emit('change');
  }

  hasFlag(flag: string): boolean {
    return this.flags.has(flag);
  }

  /** Increment and return a named counter (e.g. axe swings on a tree). */
  bump(key: string): number {
    const n = (this.counters.get(key) ?? 0) + 1;
    this.counters.set(key, n);
    return n;
  }

  /** The next thing the player should be doing, derived from progress. */
  get objective(): string {
    if (this.hasFlag('raft_built')) return 'Sail away!';
    if (!this.hasFlag('tiger_fed')) {
      return this.has('cheesesteak') ? 'Something in the Jungle looks hungry.' : 'Explore the island. Find a way off.';
    }
    if (!this.hasFlag('villager_helped')) {
      return this.has('medkit') ? 'Bring the medkit to the Villager.' : 'The Villager needs a medkit.';
    }
    if (!this.hasFlag('monkeys_fed')) {
      return this.has('bananas') ? 'Take the bananas to the Monkeys in the Volcano.' : 'The Monkeys in the Volcano want bananas.';
    }
    if (!this.has('wood', WOOD_NEEDED)) {
      return this.has('axe') ? `Chop wood: ${this.count('wood')}/${WOOD_NEEDED}.` : 'Find an axe to chop wood.';
    }
    return 'Build the raft at the Dock.';
  }

  reset(): void {
    this.inventory = [];
    this.flags.clear();
    this.counters.clear();
    this.emit('change');
  }
}

export const GameState = new GameStateStore();
