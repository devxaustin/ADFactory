export type MinigameId = 'dodge' | 'catch';

export interface MinigameData {
  /** 1 = easy, 2 = medium, 3 = hard. */
  difficulty: number;
  onDone: (won: boolean) => void;
}

export const MINIGAME_KEYS: Record<MinigameId, string> = {
  dodge: 'mg-dodge',
  catch: 'mg-catch',
};

export const MINIGAME_TITLES: Record<MinigameId, string> = {
  dodge: 'DODGE THE TIGER',
  catch: 'CATCH THE BANANAS',
};
