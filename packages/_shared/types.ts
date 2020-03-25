export interface User {
  id: string;
  name: string;
  ip: string;
  priority: number;
}

export type CardSuit = 'diamond' | 'heart' | 'spade' | 'club';

export type CardRank =
  | 14 // Ace
  | 13 // King
  | 12 // Queen
  | 11 // Jack
  | 10
  | 9
  | 8
  | 7
  | 6
  | 5
  | 4
  | 3
  | 2;

// Card has format `${suit},${rank}`
export type CardId = string;
