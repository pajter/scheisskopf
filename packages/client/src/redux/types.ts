import { State as MainState } from './main/types';
import { State as GameState, Action as GameAction } from './game/types';

export interface RootState {
  main: MainState;
  game: GameState;
}

export type RootAction = GameAction;
