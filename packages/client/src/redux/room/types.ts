import { Store as _Store } from 'redux';
import {
  PlayerClient,
  PlayerClientOpponent,
  CardId,
} from '../../../../_shared/types';

import { GameError } from '../../../../_shared/error';

export interface State {
  roomId: string;

  error: GameError | null;

  state:
    | 'pre-deal'
    | 'pre-game'
    | 'playing'
    | 'paused'
    | 'clear-the-pile'
    | 'ended';

  currentPlayerUserId: string | null;

  player: PlayerClient;
  opponents: PlayerClientOpponent[];

  cardsDeckCount: number;
  cardsDiscardedCount: number;
  cardsPile: CardId[];
}

export type Action =
  | { type: 'RESET' }
  | { type: 'SYNC'; state: State }
  | { type: 'LEAVE_ROOM' };

export type Store = _Store<State, Action>;
