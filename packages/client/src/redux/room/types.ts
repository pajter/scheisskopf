import { Store as _Store } from 'redux';
import { CardId } from '../../../../_shared/types';

export interface State {
  currentPlayerUserId: string | null;
  player: Player;
  otherPlayers: PlayerOther[];
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

export type MandatoryAction = 'pick';

export interface PlayerBase {
  userId: string;
  name: string;
  cardsOpen: CardId[];
  cardsClosedCount: number;
  mandatoryAction?: MandatoryAction;
}

export interface PlayerOther extends PlayerBase {
  cardsHandCount: number;
}

export interface Player extends PlayerBase {
  cardsHand: CardId[];
}
