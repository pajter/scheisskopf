export interface User {
  id: string;
  name: string;
  ip: string;
  priority: number;
}

export type CardSuit = 'diamond' | 'heart' | 'spade' | 'club';

export type CardRank =
  | 'ace'
  | 'king'
  | 'queen'
  | 'jack'
  | '10'
  | '9'
  | '8'
  | '7'
  | '6'
  | '5'
  | '4'
  | '3'
  | '2';

export interface Card {
  rank: CardRank;
  suit: CardSuit;
}
