import { Store as _Store } from 'redux';

import { Err, Session } from '../../../../_shared/types';

export interface State {
  session: Session | null;
  error: Err | null;
}

export type Action =
  | { type: 'RESET' }
  | { type: 'SET_SESSION'; session: Session }
  | { type: 'SET_ERROR'; error: Err }
  | { type: 'CLEAR_ERROR' };

export type Store = _Store<State, Action>;
