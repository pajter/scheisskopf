import { Store as ReduxStore } from 'redux';

import { CardId, ActionClient } from '../../../_shared/types';

import { GameError } from './error';
import { ScheissUser } from '../app/user';

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

  spectactors: Spectator[];

  state:
    | 'pre-deal'
    | 'pre-game'
    | 'playing'
    | 'paused'
    | 'clear-the-pile'
    | 'ended';

  error: GameError | null;
}

export type ActionPrivate =
  | {
      type: '$JOIN';
      roomId?: string;
    }
  | {
      type: '$REJOIN';
    }
  | {
      type: '$USER_DISCONNECT';
    };

export type Action = (ActionClient | ActionPrivate) & {
  user: ScheissUser & { userId: string };
};

export type Store = ReduxStore<State, Action>;

interface UserBase {
  userId: string;
  name: string;
  connected: boolean;
  lastPing: Date;
}

export interface Player extends UserBase {
  cardsOpen: CardId[];
  cardsClosed: CardId[];
  cardsHand: CardId[];
  isFinished: boolean;
  isDealer: boolean;
  turns: number;
}

export interface Spectator extends UserBase {}

export interface Bot extends Player {
  botSettings: BotSettings;
}

export interface BotSettings {
  difficulty: 'easy' | 'normal' | 'hard';
}
