import { Store as _Store } from 'redux';

export interface State {
  session: string | null;
  error: Error | null;
}

export type Action =
  | { type: 'RESET' }
  | { type: 'SET_ERROR'; error: Error }
  | { type: 'CLEAR_ERROR' };

export type Store = _Store<State, Action>;
