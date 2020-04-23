import {
  createStore as createStoreRedux,
  applyMiddleware,
  MiddlewareAPI,
} from 'redux';

import { reducer, initialState as _initialState } from './reducer';
import { Store, State, Action } from './types';

const logger = (store: MiddlewareAPI) => (next: (action: Action) => any) => (
  action: Action
) => {
  const { user, ...actionClean } = action as any;
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
    applyMiddleware(logger, crashReporter)
  );
};
