import { Store as ReduxStore } from 'redux';

import {
  CardId,
  ActionClient,
  Spectator,
  BotSettings,
} from '../../../_shared/types';
import { GameError } from '../../../_shared/error';

import { ScheissUser } from '../app/user';
import { ScheissBot } from '../app/bot';

export type GameState =
  | 'pre-deal'
  | 'pre-game'
  | 'playing'
  | 'paused'
  | 'clear-the-pile'
  | 'ended';

export interface State {
  roomId: string;

  state: GameState;

  error: GameError | null;

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
   * How many cards should be in each player's hand until the deck runs out.
   */
  startCardHandCount: number;

  players: (Player | Bot)[];

  spectactors: Spectator[];

  /**
   * Current player userId
   */
  currentPlayerUserId: string;
}

export type ActionPrivate =
  | {
      type: '$JOIN';
      roomId?: string;
      user: ScheissUser & { userId: string };
    }
  | {
      type: '$REJOIN';
    }
  | {
      type: '$USER_DISCONNECT';
    }
  | { type: '$ADD_BOT'; bot: ScheissBot }
  | { type: '$REMOVE_BOT'; botId: string };

export type Action = (ActionClient | ActionPrivate) & {
  userId: string;
};

export type Store = ReduxStore<State, Action>;

interface UserBase {
  userId: string;
  name: string;
  connected: boolean;
  lastPing: Date;
}

export interface Player extends UserBase {
  cardsHand: CardId[];
  cardsOpen: (CardId | null)[];
  cardsBlind: (CardId | null)[];

  turns: number;

  isFinished: boolean;
  isDealer: boolean;
  isScheisskopf: boolean;

  hasStartingCard?: CardId;

  mustPick: boolean;
}

export interface Bot extends Omit<Player, 'connected' | 'lastPing'> {
  botSettings: BotSettings;
}
