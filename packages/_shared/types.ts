import { GameError } from './error';

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

export interface PlayerBase {
  userId: string;
  name: string;

  position: number;

  mustPick: boolean;

  isFinished: boolean;
  isDealer: boolean;
  isScheisskopf: boolean;
  hasStartingCard?: CardId;

  turns: number;
}

export interface Player extends PlayerBase {
  connected: boolean;
  lastPing: Date;

  // Always public. `null` means already played
  cardsOpen: (CardId | null)[];
  // Always hidden. `null` means already played
  cardsBlind: (number | null)[];
  // Visible only for player. `undefined` if invisible
  cardsHand: (CardId | undefined)[];
}

export interface Bot extends PlayerBase {
  // Always hidden. `null` means already played
  cardsOpen: (CardId | null)[];
  // Always hidden. `null` means already played
  cardsBlind: (number | null)[];
  // Always hidden. `undefined` if invisible
  cardsHand: undefined[];

  botSettings: BotSettings;
}

export interface Spectator {
  userId: string;
  name: string;

  connected: boolean;
  lastPing: Date;
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
  ADD_BOT: { roomId: string };
  REMOVE_BOT: { roomId: string; botId: string };
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
  ADD_BOT: { error?: Err; bot?: { name: string; botId: string } };
  REMOVE_BOT: { botId: string };
}

export interface StateClientRoom {
  roomId: string;

  error: GameError | null;

  state:
    | 'pre-deal'
    | 'pre-game'
    | 'playing'
    | 'paused'
    | 'clear-the-pile'
    | 'ended';

  cardsDeckCount: number;
  cardsDiscardedCount: number;
  cardsPile: CardId[];

  players: (Player | Bot)[];
  spectators: Spectator[];

  currentPlayerUserId: string | null;
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

export interface BotSettings {
  difficulty: 'easy' | 'normal' | 'hard';
}
