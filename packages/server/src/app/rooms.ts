import { Player, MandatoryAction, ActionClient } from '../../../_shared/types';
import { generateRandomString, getIterator } from '../../../_shared/util';

import { State as StateRoom } from '../../../client/src/redux/room/types';

import {
  Player as PlayerServer,
  State as StateServer,
  Store,
} from '../redux/types';
import { createStore } from '../redux/store';
import { mustPlayerPick } from '../redux/util';
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
  let mandatoryAction: MandatoryAction | undefined = undefined;
  if (mustPlayerPick(player, state.tablePile)) {
    mandatoryAction = 'pick';
  }
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

    // Hand cards are invisible (`null`) for opponents
    cardsHand: player.cardsHand.map((c) => (isOpponent ? null : c)),

    // Blind cards are invisible to everyone, so only a number is passed
    cardsBlind: player.cardsBlind.map((c, idx) => (c === null ? null : idx)),

    mandatoryAction,

    turns: player.turns,
  };
};

/**
 * Sanitize server state to 'anonimize' state for client
 */
const getStateRoomForPlayer = (
  state: StateServer,
  player: PlayerServer
): StateRoom => {
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

      return createPlayer(p, state, isOpponent);
    }),

    currentPlayerUserId: state.currentPlayerUserId,
  };
};

export const syncRoom = (room: Store, action?: ActionClient) => {
  const roomState = room.getState();

  const users = getUsers();

  // Sync new state to all users in room
  roomState.players.forEach((player) => {
    const user = users.find((u) => u.userId === player.userId);

    if (user) {
      console.logDebug('SYNC_ROOM', user.userId);

      user.emit('ACTION_ROOM', {
        state: getStateRoomForPlayer(roomState, player),
        action,
      });
    }
  });
};
