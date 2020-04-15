import { createStore } from 'redux';
import devToolsEnhancer from 'remote-redux-devtools';
import { reducer, initialState as _initialState } from './reducer';
import { Store, State } from './types';

export let store: Store;

let devTools =
  process.env.NODE_ENV === 'development'
    ? devToolsEnhancer({
        realtime: true,
        shouldCatchErrors: false,
        shouldHotReload: true,
        hostname: 'localhost',
        port: 8000,
      })
    : undefined;

export const getStore = (initialState?: Partial<State>) => {
  if (store) {
    return store;
  }

  // Create store
  store = createStore(reducer, { ..._initialState, ...initialState }, devTools);

  return store;
};
