import { Store as _Store } from 'redux';
import { State as StateClient, Action as ActionClient } from './client/types';
import { State as StateRoom, Action as ActionRoom } from './room/types';

export type StateRoot = { client: StateClient; room: StateRoom };
export type ActionRoot = ActionClient | ActionRoom;

export type Store = _Store<StateRoot, ActionRoot>;
