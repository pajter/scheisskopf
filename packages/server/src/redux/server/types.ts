import { Store as StoreRoom } from '../room/types';

export interface State {
  error: Error | null;
  connectedUsers: User[];
  rooms: StoreRoom[];
}

export type Action =
  | { type: 'INIT' }
  | { type: 'SET_GLOBAL_ERROR'; error: Error }
  | { type: 'CLEAR_GLOBAL_ERROR' }
  | { type: 'USER_CONNECT'; userId: string; ip: string }
  | { type: 'USER_DISCONNECT'; userId: string }
  | { type: 'CREATE_ROOM'; newRoom: StoreRoom };

export interface User {
  id: string;
  ip: string;
}
