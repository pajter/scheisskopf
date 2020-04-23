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

export interface Session {
  username: string;
  userId: string;
}

export type Err = {
  message: string;
};

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

export interface SocketClientEvent {
  LOGIN: { username: string };
  PING: Session;
  CREATE_SESSION: Session;
  CREATE_ROOM: {};
  JOIN_ROOM: { roomId: string };
  REJOIN_ROOM: { roomId: string };
  ACTION_ROOM: ActionClient;
}

export interface SocketServerEvent {
  LOGIN: { error?: Err } & Partial<Session>;
  PING: { timestamp: number };
  CREATE_SESSION: { error?: Err } & Partial<Session>;
  CREATE_ROOM: { error?: Err; roomId?: string };
  JOIN_ROOM: { error?: Err; roomId?: string };
  REJOIN_ROOM: { error?: Err; roomId?: string };
  ACTION_ROOM: { error?: Err; state?: StateClientRoom };
}

export type ActionClient =
  | {
      type: 'LEAVE';
    }
  | {
      type: 'RESET';
    }
  | {
      type: 'DEAL';
    }
  | {
      type: 'SWAP';
      cardsHand: CardId[];
      cardsOpen: CardId[];
    }
  | {
      type: 'START';
    }
  | {
      type: 'DRAW';
    }
  | {
      type: 'PLAY';
      cards: CardId[];
    }
  | {
      type: 'PICK';
      ownCards?: CardId[];
    }
  | {
      type: 'CLEAR_THE_PILE';
    }
  | {
      type: 'PAUSE';
    };
