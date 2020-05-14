import {
  Player,
  Bot,
  ActionClient,
  StateClientRoom,
} from '../../../_shared/types';
import { generateRandomString, getIterator } from '../../../_shared/util';

import {
  Player as PlayerServer,
  State as StateServer,
  Bot as BotServer,
  Store,
} from '../redux/types';
import { createStore } from '../redux/store';
import { getUsers } from './users';

let rooms: Store[] = [];

export const addRoom = (room: Store) => {
  rooms.push(room);
};

export const removeRoom = (roomId: string) => {
  rooms = rooms.filter((storeRoom) => storeRoom.getState().roomId !== roomId);
};

export const getRooms = () => rooms;

export const createRoom = () => {
  const room = createStore({
    roomId: createUniqueRoomId(),
  });
  addRoom(room);
  return room;
};

const createUniqueRoomId = (): string => {
  let newRoomId = generateRandomString(4);
  const roomIds = rooms.map((storeRoom) => storeRoom.getState().roomId);
  while (roomIds.includes(newRoomId)) {
    newRoomId = generateRandomString(4);
  }
  return newRoomId;
};

export const findRoomForUserId = (userId: string) => {
  // Find room where user is located by searching all rooms
  return rooms.find((store) => {
    return !!store
      .getState()
      .players.find((player) => player.userId === userId);
  });
};

export const findRoomForId = (roomId: string) => {
  return rooms.find((store) => store.getState().roomId === roomId);
};

const createPlayer = (
  player: PlayerServer,
  state: StateServer,
  isOpponent: boolean = true
): Player => {
  const idx = state.players.findIndex((p) => p.userId === player.userId);

  return {
    userId: player.userId,
    name: player.name,

    position: idx,

    isFinished: player.isFinished,
    isDealer: player.isDealer,
    isScheisskopf: player.isScheisskopf,
    hasStartingCard: player.hasStartingCard,

    connected: true,
    lastPing: new Date(),

    // Open cards are always public
    cardsOpen: player.cardsOpen,

    // Hand cards are invisible (`undefined`) for opponents
    cardsHand: player.cardsHand.map((c) => (isOpponent ? undefined : c)),

    // Blind cards are invisible to everyone, so only a number is passed
    cardsBlind: player.cardsBlind.map((c, idx) => (c === null ? null : idx)),

    mustPick: player.mustPick,

    turns: player.turns,
  };
};

const createBot = (bot: BotServer, state: StateServer): Bot => {
  const idx = state.players.findIndex((p) => p.userId === bot.userId);

  return {
    userId: bot.userId,
    name: bot.name,

    position: idx,

    isFinished: bot.isFinished,
    isDealer: bot.isDealer,
    isScheisskopf: bot.isScheisskopf,
    hasStartingCard: bot.hasStartingCard,

    // Open cards are always public
    cardsOpen: bot.cardsOpen,

    // Hand cards are invisible (`undefined`)
    cardsHand: bot.cardsHand.map(() => undefined),

    // Blind cards are invisible to everyone, so only a number is passed
    cardsBlind: bot.cardsBlind.map((c, idx) => (c === null ? null : idx)),

    mustPick: bot.mustPick,

    turns: bot.turns,

    botSettings: bot.botSettings,
  };
};

/**
 * Sanitize server state to 'anonimize' state for client
 */
const getStateRoomForPlayer = (
  state: StateServer,
  player: PlayerServer | Bot
): StateClientRoom => {
  // Sort players to put current player at the start
  const playersIterator = getIterator(state.players);
  playersIterator.forward(({ userId }) => userId === player.userId);

  return {
    roomId: state.roomId,

    error: state.error,

    state: state.state,

    cardsDeckCount: state.tableDeck.length,
    cardsDiscardedCount: state.tableDiscarded.length,
    cardsPile: state.tablePile,

    players: playersIterator.getItems().map((p) => {
      const isOpponent = p.userId !== player.userId;

      return 'botSettings' in p
        ? createBot(p, state)
        : createPlayer(p, state, isOpponent);
    }),

    spectators: state.spectactors,

    currentPlayerUserId: state.currentPlayerUserId,
  };
};

export const syncRoom = (room: Store, action?: ActionClient) => {
  const roomState = room.getState();

  const users = getUsers();

  // Sync new state to all users in room
  roomState.players.forEach((player) => {
    if ('botSettings' in player) {
      // No need to sync to bots
      return;
    }

    const user = users.find((u) => u.userId === player.userId);

    if (user) {
      console.logDebug('SYNC_ROOM', user.userId);

      user.emit('ACTION_ROOM', {
        state: getStateRoomForPlayer(roomState, player),
        action,
      });
    }
  });

  // TODO: spectators
};
