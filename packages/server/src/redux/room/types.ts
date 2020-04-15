import { Store as ReduxStore } from 'redux';
import { CardId } from '../../../../_shared/types';

import { GameError } from './error';

export interface State {
  roomId: string;

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

  state:
    | 'pre-deal'
    | 'pre-game'
    | 'playing'
    | 'paused'
    | 'clear-the-pile'
    | 'ended';

  error: GameError | null;
}

export type Action =
  | {
      type: 'RESET';
    }
  | {
      type: 'CREATE';
    }
  | {
      type: 'JOIN';
      name: string;
      roomId?: string;
    }
  | {
      type: 'LEAVE';
    }
  | {
      type: 'DEAL';
    }
  | {
      type: 'SWAP';
      cardsHand: CardId[];
      cardsOpen: CardId[];
    }
  | {
      type: 'START';
    }
  | {
      type: 'DRAW';
    }
  | {
      type: 'PLAY';
      cards: CardId[];
    }
  | {
      type: 'PICK';
      ownCards?: CardId[];
    }
  | {
      type: 'CLEAR_THE_PILE';
    }
  | {
      type: 'PAUSE';
    };

export type Store = ReduxStore<State, Action>;

export interface Player {
  userId: string;
  name: string;
  cardsOpen: CardId[];
  cardsClosed: CardId[];
  cardsHand: CardId[];
  isFinished: boolean;
  isDealer: boolean;
  turns: number;
}

export interface BotPlayer extends Player {
  botSettings: BotSettings;
}

export interface BotSettings {
  difficulty: 'easy' | 'normal' | 'hard';
}
