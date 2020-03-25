import { createStore, combineReducers } from 'redux';
import {
  reducer as mainReducer,
  initialState as mainInitialState,
} from './main/reducer';
import {
  reducer as gameReducer,
  initialState as gameInitialState,
} from './game/reducer';
import { RootState } from './types';

export let store: ReturnType<typeof createStore>;

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
