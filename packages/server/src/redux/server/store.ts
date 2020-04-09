import { createStore, Store } from 'redux';

import { reducer, initialState } from './reducer';
import { State, Action } from './types';

export let store: Store<State, Action>;

export const getStore = () => {
  if (store) {
    return store;
  }

  // Create store
  store = createStore(reducer, initialState);

  return store;
};
