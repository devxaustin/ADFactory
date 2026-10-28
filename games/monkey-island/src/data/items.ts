export type ItemId = 'cheesesteak' | 'medkit' | 'bananas' | 'axe' | 'wood' | 'rope' | 'sail';

export interface ItemDef {
  id: ItemId;
  name: string;
  /** Placeholder icon colour until real art exists. */
  color: number;
  stackable?: boolean;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  cheesesteak: { id: 'cheesesteak', name: 'Cheesesteak', color: 0xd9a441 },
  medkit: { id: 'medkit', name: 'Medkit', color: 0xe04b4b },
  bananas: { id: 'bananas', name: 'Bananas', color: 0xf2e04a },
  axe: { id: 'axe', name: 'Axe', color: 0x9aa4b2 },
  wood: { id: 'wood', name: 'Wood', color: 0x8b5a2b, stackable: true },
  rope: { id: 'rope', name: 'Rope', color: 0xc9a56a },
  sail: { id: 'sail', name: 'Sail', color: 0xf4f4f4 },
};
