import {
  PlayerClient,
  PlayerClientOpponent,
  PlayerBase,
  MandatoryAction,
} from '../../../_shared/types';
import { generateRandomString } from '../../../_shared/util';

import { State as StateRoom } from '../../../client/src/redux/room/types';

import {
  Player as PlayerServer,
  State as StateServer,
  Store,
} from '../redux/types';
import { createStore } from '../redux/store';
import { findPlayerById, mustPlayerPick } from '../redux/util';
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

const createPlayerBase = (
  player: PlayerServer,
  state: StateServer
): PlayerBase => {
  let mandatoryAction: MandatoryAction | undefined = undefined;
  if (mustPlayerPick(player, state.tablePile)) {
    mandatoryAction = 'pick';
  }

  return {
    userId: player.userId,
    name: player.name,

    isFinished: player.isFinished,
    isDealer: player.isDealer,

    connected: true,
    lastPing: new Date(),

    // Open cards are always public
    cardsOpen: player.cardsOpen,

    // Blind cards are invisible
    cardsBlind: player.cardsBlind.map((c, idx) => (c === null ? null : idx)),

    mandatoryAction,
  };
};

const createPlayerClient = (
  player: PlayerServer,
  state: StateServer
): PlayerClient => {
  return {
    ...createPlayerBase(player, state),

    cardsHand: player.cardsHand,
  };
};

const createPlayerClientOpponent = (
  player: PlayerServer,
  state: StateServer
): PlayerClientOpponent => {
  return {
    ...createPlayerBase(player, state),

    // All cards are invisible
    cardsHandCount: player.cardsHand.length,
  };
};

/**
 * Sanitize server state to 'anonimize' state for client
 */
const getStateRoomForPlayer = (
  state: StateServer,
  player: PlayerServer
): StateRoom => {
  const opponents = state.players.filter(
    ({ userId }) => userId !== player.userId
  );

  return {
    state: state.state,
    currentPlayerUserId: state.currentPlayerUserId,
    player: createPlayerClient(player, state),
    opponents: opponents.map((p) => createPlayerClientOpponent(p, state)),
    cardsDeckCount: state.tableDeck.length,
    cardsDiscardedCount: state.tableDiscarded.length,
    cardsPile: state.tablePile,
    error: state.error,
    roomId: state.roomId,
  };
};

export const syncRoom = (room: Store, userId: string) => {
  const roomState = room.getState();

  const player = findPlayerById(userId, roomState.players);
  if (!player) {
    throw new Error('SYNC_ROOM: Can not find player');
  }

  const users = getUsers();

  // Sync new state to all users in room
  roomState.players.forEach((player) => {
    const user = users.find((u) => u.userId === player.userId);

    if (user) {
      console.logDebug('SYNC_ROOM', user.userId);

      user.emit('ACTION_ROOM', {
        state: getStateRoomForPlayer(roomState, player),
      });
    }
  });
};
