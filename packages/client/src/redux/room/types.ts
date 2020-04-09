import { Store as _Store } from 'redux';
import { CardId } from '../../../../_shared/types';

export interface State {
  currentPlayerUserId: string | null;
  players: Player[];
  cardsDeckCount: number;
  cardsDiscardedCount: number;
  cardsPile: CardId[];
  state:
    | 'pre-deal'
    | 'pre-game'
    | 'playing'
    | 'paused'
    | 'clear-the-pile'
    | 'ended';
  error: Error | null;
  roomId: string;
}

export type Action = { type: 'RESET' } | { type: 'SYNC'; state: State };

export type Store = _Store<State, Action>;

export interface Player {
  name: string;
  cardsOpen: CardId[];
  cardsClosedCount: number;
  cardsHandCount: number;
}
