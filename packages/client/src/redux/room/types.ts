import { Store as _Store } from 'redux';
import { Player, CardId } from '../../../../_shared/types';

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

  cardsDeckCount: number;
  cardsDiscardedCount: number;
  cardsPile: CardId[];

  players: Player[];

  currentPlayerUserId: string | null;
}

export type Action =
  | { type: 'RESET' }
  | { type: 'SYNC'; state: State }
  | { type: 'LEAVE_ROOM' };

export type Store = _Store<State, Action>;
