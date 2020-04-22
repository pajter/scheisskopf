import { Action as ActionServer } from '../server/src/redux/types';
import { State as StateClientRoom } from '../client/src/redux/room/types';

export type CardSuit = 'diamond' | 'heart' | 'spade' | 'club';

export type CardRank =
  | 14 // Ace
  | 13 // King
  | 12 // Queen
  | 11 // Jack
  | 10
  | 9
  | 8
  | 7
  | 6
  | 5
  | 4
  | 3
  | 2;

// Card has format `${suit},${rank}`
export type CardId = string;

export type MandatoryAction = 'pick';

export interface PlayerBase {
  userId: string;
  name: string;

  connected: boolean;
  lastPing: Date;

  mandatoryAction?: MandatoryAction;

  // Open cards are always public
  cardsOpen: CardId[];
}

export interface Session {
  username: string;
  userId: string;
}

export type Err = {
  message: string;
};

export interface PlayerServer extends PlayerBase {
  cardsHand?: CardId[];
  cardsClosed?: CardId[];
}

export interface PlayerClient extends PlayerBase {
  cardsHand: CardId[];
  cardsClosedCount: number;
}

export interface PlayerClientOpponent extends PlayerBase {
  cardsHandCount: number;
  cardsClosedCount: number;
}

export interface SocketClientEventArgs {
  login: { username: string };
  ping: Session;
  createSession: Session;
  actionRoom: ActionServer;
  createRoom: { userId: string };
}

export type SocketClientEvent = keyof SocketClientEventArgs;

export interface SocketServerEventArgs {
  login: { error?: Err } & Partial<Session>;
  ping: {};
  createSession: { error?: Err } & Partial<Session>;
  syncRoom: StateClientRoom;
}

export type SocketServerEvent = keyof SocketServerEventArgs;
