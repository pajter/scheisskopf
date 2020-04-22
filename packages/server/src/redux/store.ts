import {
  createStore as createStoreRedux,
  applyMiddleware,
  MiddlewareAPI,
} from 'redux';
import { composeWithDevTools } from 'remote-redux-devtools';

import { ScheissUser } from '../app/user';

import { reducer, initialState as _initialState } from './reducer';
import { Store, State, Action } from './types';

let composeEnhancers =
  process.env.NODE_ENV === 'development'
    ? composeWithDevTools({
        realtime: true,
        hostname: 'localhost',
        port: 8000,
      })
    : (cb: Function) => cb();

const logger = (store: MiddlewareAPI) => (
  next: (action: Action & { user: ScheissUser }) => any
) => (action: Action & { user: ScheissUser }) => {
  const { user, ...actionClean } = action;
  console.logAction({ userId: user.userId, ...actionClean });
  const result = next(action);
  console.logState(store.getState());
  return result;
};

const crashReporter = (_store: MiddlewareAPI) => (
  next: (action: Action) => any
) => (action: Action) => {
  try {
    return next(action);
  } catch (err) {
    console.logError(err);
  }
};

export const createStore = (initialState?: Partial<State>): Store => {
  return createStoreRedux(
    reducer,
    { ..._initialState, ...initialState },
    composeEnhancers(applyMiddleware(logger, crashReporter))
  );
};
