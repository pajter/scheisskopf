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

export type CardSpecialAction =
  | { action: 'CLEAR_THE_DECK' } // 10
  | { action: 'RESET' } // 2
  | { action: 'INVISIBLE' } // 3
  | { action: 'BELOW_7' } // 7
  | { action: '8_WAIT' }; // 8
