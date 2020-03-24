import { CardId } from '../../types';
import { GameError } from './error';

export interface State {
  /**
   * Cards in playing pile
   */
  tablePile: CardId[];

  /**
   * Card left on table (deck)
   */
  tableDeck: CardId[];

  /**
   * Cards discarded from the game
   */
  tableDiscarded: CardId[];

  /**
   * userId of current player
   */
  currentPlayerUserId: string | null;

  /**
   * How many cards should be in each player's hand until the deck runs out.
   */
  startCardHandCount: number | null;

  /**
   * Card that starts game (eg. club:4)
   */
  startingCard: CardId | null;

  players: Player[];
  state: 'pre-deal' | 'pre-game' | 'playing' | 'paused' | 'ended';
  error: GameError | null;
}

export type Player = {
  id: string;
  cardsOpen: CardId[];
  cardsClosed: CardId[];
  cardsHand: CardId[];
  isFinished: boolean;
  isDealer: boolean;
  turns: number;
};

export type Action =
  | { type: 'RESET' }
  | {
      type: 'JOIN';
      userId: string;
    }
  | {
      type: 'LEAVE';
      userId: string;
    }
  | {
      type: 'DEAL';
      userId: string;
    }
  | {
      type: 'SWAP';
      userId: string;
      cardsHand: CardId[];
      cardsOpen: CardId[];
    }
  | { type: 'START'; userId: string }
  | { type: 'DRAW'; userId: string }
  | { type: 'PLAY'; userId: string; cards: CardId[] }
  | { type: 'PICK'; userId: string; ownCards?: CardId[] };
