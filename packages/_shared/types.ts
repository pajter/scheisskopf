import { State as StateClientRoom } from '../client/src/redux/room/types';

export type CardSuit = 'D' | 'H' | 'S' | 'C';

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

// Card has format `rank:suit`
export type CardId = string;

export type Stack = 'hand' | 'open' | 'blind';

export interface Session {
  username: string;
  userId: string;
  sessionId: string;
}

export type Err = {
  message: string;
};

export type MandatoryAction = 'pick';

export interface Player {
  userId: string;
  name: string;

  position: number;

  connected: boolean;
  lastPing: Date;

  mandatoryAction?: MandatoryAction;

  // Always public. `null` means already played
  cardsOpen: (CardId | null)[];
  // Always hidden. `null` means already played
  cardsBlind: (number | null)[];
  // Visible only for player. `null` if invisible
  cardsHand: (CardId | null)[];

  isFinished: boolean;
  isDealer: boolean;
  isScheisskopf: boolean;
  hasStartingCard?: CardId;

  turns: number;
}

export interface SocketClientEvent {
  LOGIN: { username: string };
  PING: { sessionId: string };
  CREATE_SESSION: { sessionId: string };
  DELETE_SESSION: { sessionId: string };
  CREATE_ROOM: {};
  JOIN_ROOM: { roomId: string };
  REJOIN_ROOM: { roomId: string };
  ACTION_ROOM: ActionClient;
}

export interface SocketServerEvent {
  LOGIN: { error?: Err; session?: Session };
  PING: { timestamp: number };
  CREATE_SESSION: { error?: Err; session?: Session };
  DELETE_SESSION: {};
  CREATE_ROOM: { error?: Err; roomId?: string };
  JOIN_ROOM: { error?: Err; roomId?: string };
  REJOIN_ROOM: { error?: Err; roomId?: string };
  ACTION_ROOM: { error?: Err; state?: StateClientRoom; action?: ActionClient };
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
      type: 'PLAY_BLIND';
      idx: number;
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

export type Animation =
  | {
      name: 'deal';
    }
  | {
      name: 'swap';
      userId: string;
      cardIdsHand: CardId[];
      cardIdsOpen: CardId[];
    }
  | {
      name: 'clear-the-pile';
    }
  | { name: 'play-cards'; userId: string; cardIds: CardId[] }
  | { name: 'play-blind-card'; userId: string; cardIdx: number }
  | { name: 'pick-from-deck'; userId: string; amount: number }
  | { name: 'pick-pile'; userId: string };
