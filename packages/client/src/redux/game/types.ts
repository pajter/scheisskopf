import { Card } from '../../types';
import { GameError } from './error';

export interface State {
  tablePile: Card[];
  tableDeck: Card[];
  tableDiscarded: Card[];
  dealerUserId: string | null;
  currentPlayerUserId: string | null;
  startCardHandCount: number | null;
  players: Player[];
  state: 'pre-deal' | 'pre-game' | 'playing' | 'paused' | 'ended';
  error: GameError | null;
  startingCard: Card | null;
  moves: number;
}

export type Action =
  | {
      type: 'DEAL';
      userId: string;
      gameUsers: { id: string; position: number }[];
    }
  | {
      type: 'SWITCH_CARD';
      userId: string;
      cardFromHand: Card;
      cardFromOpen: Card;
    }
  | { type: 'START'; userId: string }
  | { type: 'DRAW'; userId: string }
  | { type: 'PLAY'; userId: string; cards: Card[] }
  | { type: 'PICK'; userId: string };

export type Player = {
  id: string;
  position: number;
  cardsOpen: Card[];
  cardsClosed: Card[];
  cardsHand: Card[];
};
