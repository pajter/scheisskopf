import { createStore, combineReducers } from 'redux';

import {
  reducer as clientReducer,
  initialState as clientInitialState,
} from './client/reducer';
import { reducer as serverReducer } from './room/reducer';

import { Store } from './types';

export let store: Store;

const DEVTOOLS_EXTENSION =
  typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__
    ? (window as any).__REDUX_DEVTOOLS_EXTENSION__({ trace: true })
    : undefined;

export const getStore = () => {
  if (store) {
    return store;
  }

  // Create store
  store = createStore(
    combineReducers({ client: clientReducer, room: serverReducer }),
    { client: clientInitialState, room: null },
    DEVTOOLS_EXTENSION
  );

  return store;
};
