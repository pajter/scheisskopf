import { createStore, combineReducers, Store } from 'redux';
import {
  reducer as mainReducer,
  initialState as mainInitialState,
} from './main/reducer';
import {
  reducer as gameReducer,
  initialState as gameInitialState,
} from './game/reducer';
import { RootState, RootAction } from './types';

export let store: Store<RootState, RootAction>;

export const getStore = (initialState: Partial<RootState> = {}) => {
  if (store) {
    return store;
  }

  // Create store
  store = createStore(
    combineReducers({ main: mainReducer, game: gameReducer }),
    {
      main: {
        ...mainInitialState,
        ...('main' in initialState ? initialState.main : {}),
      },
      game: {
        ...gameInitialState,
        ...('game' in initialState ? initialState.game : {}),
      },
      ...initialState,
    },
    (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
      (window as any).__REDUX_DEVTOOLS_EXTENSION__({ trace: true })
  );

  return store;
};
