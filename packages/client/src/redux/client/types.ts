import { Store as _Store } from 'redux';

import { Err, Session } from '../../../../_shared/types';

export interface State {
  session: Session | null;
  error: Err | null;
  loading: boolean;
}

export type Action =
  | { type: 'RESET' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SESSION'; session: Session }
  | { type: 'DESTROY_SESSION' }
  | { type: 'SET_ERROR'; error: Err }
  | { type: 'CLEAR_ERROR' };

export type Store = _Store<State, Action>;
