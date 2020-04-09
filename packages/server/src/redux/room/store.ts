import { createStore } from 'redux';

import { reducer, initialState as _initialState } from './reducer';
import { Store, State } from './types';

export let store: Store;

export const getStore = (initialState?: Partial<State>) => {
  if (store) {
    return store;
  }

  // Create store
  store = createStore(reducer, { ..._initialState, ...initialState });

  return store;
};
