import { Store as _Store } from 'redux';

import { Err, Session, CardId } from '../../../../_shared/types';

export interface State {
  session: Session | null;
  error: Err | null;
  loading: boolean;
  selectedCardIds: {
    hand: CardId[];
    open: CardId[];
  };
}

export type Action =
  | { type: 'RESET' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SESSION'; session: Session }
  | { type: 'DESTROY_SESSION' }
  | { type: 'SET_ERROR'; error: Err }
  | { type: 'CLEAR_ERROR' }
  | {
      type: 'SELECT_CARD';
      cardId?: CardId;
      blindIdx?: number;
      stack: 'open' | 'hand';
    }
  | {
      type: 'DESELECT_CARD';
      cardId?: CardId;
      blindIdx?: number;
      stack: 'open' | 'hand';
    }
  | {
      type: 'CLEAR_CARD_SELECTION';
    };

export type Store = _Store<State, Action>;
