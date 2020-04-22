import { Store as _Store } from 'redux';
import { CardId, Player, PlayerOpponent } from '../../../../_shared/types';

export interface State {
  currentPlayerUserId: string | null;
  player: Player;
  opponents: PlayerOpponent[];
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
