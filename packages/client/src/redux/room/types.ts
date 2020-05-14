import { Store as _Store } from 'redux';
import { StateClientRoom as State } from '../../../../_shared/types';

export type Action =
  | { type: 'RESET' }
  | { type: 'SYNC'; state: State }
  | { type: 'CLEAR_ROOM' };

export type Store = _Store<State, Action>;

export { State };
