import type { ItemId } from './items';

export type LocationId = 'beach' | 'jungle' | 'village' | 'volcano' | 'dock';
export type Side = 'left' | 'right' | 'top' | 'bottom';
export type ObstacleKind = 'rock' | 'tree' | 'hut' | 'lava' | 'water';

export interface Exit {
  side: Side;
  to: LocationId;
  label: string;
}

export interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: ObstacleKind;
  /** Obstacle disappears once this flag is set (used for gates). */
  removedByFlag?: string;
}

/** Hand over `wants`, get `gives` (optional), and set `flag`. */
export interface Trade {
  wants: ItemId;
  gives?: ItemId;
  flag: string;
  /** Shown when the trade happens. */
  lines: string[];
  /** Shown on later visits. */
  afterLines: string[];
}

export interface Interactable {
  id: string;
  kind: 'pickup' | 'npc' | 'tree' | 'raft';
  x: number;
  y: number;
  label: string;
  /** pickup: the item granted. */
  item?: ItemId;
  /** pickup: the pickup text. npc: what they say before the trade. */
  lines: string[];
  /** npc: optional trade. */
  trade?: Trade;
  /** npc placeholder look. */
  sprite?: 'npc' | 'critter';
  color?: number;
  /** Not spawned once this flag is set. */
  hideWhen?: string;
}

export interface LocationDef {
  id: LocationId;
  name: string;
  ground: number;
  groundAlt: number;
  exits: Exit[];
  obstacles: Obstacle[];
  interactables: Interactable[];
  /** Used when the scene is entered without coming through an exit. */
  spawn: { x: number; y: number };
}

// Layout is 480x270. Exits sit on screen edges, so keep a ~24px lane clear
// around each exit's midpoint.
//
// Progression: Beach (axe, cheesesteak) -> feed the Tiger -> Jungle (bananas)
// -> Village (medkit; Villager gives rope) -> Volcano (Monkeys give sail)
// -> chop 5 wood -> build the raft at the Dock.
export const LOCATIONS: Record<LocationId, LocationDef> = {
  beach: {
    id: 'beach',
    name: 'The Beach',
    ground: 0xe6d28f,
    groundAlt: 0xdcc57e,
    spawn: { x: 80, y: 135 },
    exits: [{ side: 'right', to: 'jungle', label: 'Jungle' }],
    obstacles: [
      { x: 0, y: 0, w: 480, h: 40, kind: 'water' },
      { x: 150, y: 90, w: 32, h: 32, kind: 'rock' },
      { x: 300, y: 170, w: 48, h: 32, kind: 'rock' },
    ],
    interactables: [
      {
        id: 'beach-axe',
        kind: 'pickup',
        x: 190,
        y: 150,
        label: 'Axe',
        item: 'axe',
        lines: ['A rusty axe, half buried in the sand. Good enough to chop wood.'],
      },
      {
        id: 'beach-cheesesteak',
        kind: 'pickup',
        x: 235,
        y: 115,
        label: 'Cheesesteak',
        item: 'cheesesteak',
        lines: ['A cheesesteak, washed up on the sand. Somehow still warm.'],
      },
      { id: 'beach-tree', kind: 'tree', x: 420, y: 215, label: 'Palm tree', lines: [] },
    ],
  },
  jungle: {
    id: 'jungle',
    name: 'The Jungle',
    ground: 0x3f8f4a,
    groundAlt: 0x37813f,
    spawn: { x: 40, y: 135 },
    exits: [
      { side: 'left', to: 'beach', label: 'Beach' },
      { side: 'top', to: 'volcano', label: 'Volcano' },
      { side: 'right', to: 'village', label: 'Village' },
      { side: 'bottom', to: 'dock', label: 'Dock' },
    ],
    obstacles: [
      // Thicket the Tiger guards. Gone once it has been fed.
      { x: 112, y: 0, w: 16, h: 270, kind: 'tree', removedByFlag: 'tiger_fed' },
      { x: 350, y: 60, w: 32, h: 48, kind: 'tree' },
      { x: 350, y: 180, w: 32, h: 48, kind: 'tree' },
    ],
    interactables: [
      {
        id: 'jungle-tiger',
        kind: 'npc',
        sprite: 'critter',
        x: 82,
        y: 135,
        label: 'Tiger',
        color: 0xe08a2e,
        hideWhen: 'tiger_fed',
        lines: ['A hungry tiger blocks the thicket and will not let you pass.', 'Maybe it would settle for something to eat.'],
        trade: {
          wants: 'cheesesteak',
          flag: 'tiger_fed',
          lines: [
            'The tiger sniffs the cheesesteak, then swallows it in one bite.',
            'Purring, it slinks off into the trees. The path is clear.',
          ],
          afterLines: [],
        },
      },
      { id: 'jungle-tree-1', kind: 'tree', x: 175, y: 60, label: 'Tree', lines: [] },
      { id: 'jungle-tree-2', kind: 'tree', x: 175, y: 205, label: 'Tree', lines: [] },
      {
        id: 'jungle-bananas',
        kind: 'pickup',
        x: 300,
        y: 120,
        label: 'Bananas',
        item: 'bananas',
        lines: ['A fat pile of bananas. The monkeys would love these.'],
      },
    ],
  },
  village: {
    id: 'village',
    name: 'The Village',
    ground: 0xb08a5a,
    groundAlt: 0xa67f50,
    spawn: { x: 40, y: 135 },
    exits: [{ side: 'left', to: 'jungle', label: 'Jungle' }],
    obstacles: [
      { x: 150, y: 50, w: 64, h: 48, kind: 'hut' },
      { x: 300, y: 50, w: 64, h: 48, kind: 'hut' },
      { x: 220, y: 190, w: 64, h: 48, kind: 'hut' },
    ],
    interactables: [
      {
        id: 'village-villager',
        kind: 'npc',
        x: 260,
        y: 140,
        label: 'Villager',
        color: 0x6aa6d8,
        lines: ['Villager: Ooga booga... The Coconut King\'s queen is sick.', 'Villager: We need medical supplies. Please, find a medkit.'],
        trade: {
          wants: 'medkit',
          gives: 'rope',
          flag: 'villager_helped',
          lines: [
            'Villager: A medkit! The queen will live!',
            'Villager: The Coconut King thanks you. Take this rope, the strongest on the island.',
          ],
          afterLines: ['Villager: The queen is resting. You have our thanks.'],
        },
      },
      {
        id: 'village-medkit',
        kind: 'pickup',
        x: 430,
        y: 225,
        label: 'Medkit',
        item: 'medkit',
        lines: ['A medkit tucked behind the huts. Bandages and supplies.'],
      },
      { id: 'village-tree-1', kind: 'tree', x: 100, y: 55, label: 'Tree', lines: [] },
      { id: 'village-tree-2', kind: 'tree', x: 100, y: 215, label: 'Tree', lines: [] },
    ],
  },
  volcano: {
    id: 'volcano',
    name: 'The Volcano',
    ground: 0x4a3b3b,
    groundAlt: 0x413434,
    spawn: { x: 240, y: 235 },
    exits: [{ side: 'bottom', to: 'jungle', label: 'Jungle' }],
    obstacles: [
      { x: 0, y: 0, w: 480, h: 30, kind: 'rock' },
      { x: 150, y: 70, w: 180, h: 60, kind: 'lava' },
      { x: 60, y: 150, w: 32, h: 32, kind: 'rock' },
      { x: 390, y: 150, w: 32, h: 32, kind: 'rock' },
    ],
    interactables: [
      {
        id: 'volcano-monkeys',
        kind: 'npc',
        sprite: 'critter',
        x: 240,
        y: 170,
        label: 'Monkeys',
        color: 0x8b5a2b,
        lines: ['The democracy of monkeys eyes you from the lava rocks.', 'They keep miming something. Eating... bananas?'],
        trade: {
          wants: 'bananas',
          gives: 'sail',
          flag: 'monkeys_fed',
          lines: [
            'The monkeys erupt in cheers and pass the bananas around.',
            'The Monkey King bows and hands you a sail woven from palm fibre.',
          ],
          afterLines: ['The monkeys are far too busy feasting to notice you.'],
        },
      },
    ],
  },
  dock: {
    id: 'dock',
    name: 'The Dock',
    ground: 0x8a6a45,
    groundAlt: 0x7e5f3d,
    spawn: { x: 240, y: 40 },
    exits: [{ side: 'top', to: 'jungle', label: 'Jungle' }],
    obstacles: [
      { x: 0, y: 190, w: 480, h: 80, kind: 'water' },
      { x: 60, y: 80, w: 32, h: 32, kind: 'rock' },
    ],
    interactables: [
      { id: 'dock-raft', kind: 'raft', x: 240, y: 168, label: 'Raft site', lines: [] },
      { id: 'dock-tree', kind: 'tree', x: 400, y: 110, label: 'Tree', lines: [] },
    ],
  },
};
