import { createStore } from 'redux';
import devToolsEnhancer from 'remote-redux-devtools';
import { reducer, initialState as _initialState } from './reducer';
import { Store, State } from './types';

let devTools =
  process.env.NODE_ENV === 'development'
    ? devToolsEnhancer({
        realtime: true,
        hostname: 'localhost',
        port: 8000,
      })
    : undefined;

export const getStore = (initialState?: Partial<State>): Store => {
  return createStore(reducer, { ..._initialState, ...initialState }, devTools);
};
