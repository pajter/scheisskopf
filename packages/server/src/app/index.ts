import { generateRandomString } from '../../../_shared/util';
import {
  Player,
  PlayerOpponent,
  PlayerBase,
  MandatoryAction,
} from '../../../_shared/types';

import { State as StateRoomClient } from '../../../client/src/redux/room/types';

import {
  Store as StoreRoom,
  Player as PlayerServer,
  State,
} from '../redux/types';

import { createStore } from '../redux/store';
import { findPlayerById, mustPlayerPick } from '../redux/util';

import { ScheissUser } from './user';

export interface User {
  id: string;
  ip: string;
}

let storeRooms: StoreRoom[] = [];
let users: ScheissUser[] = [];

const createUniqueRoomId = (): string => {
  let newRoomId = generateRandomString(4);
  const roomIds = storeRooms.map((storeRoom) => storeRoom.getState().roomId);
  while (roomIds.includes(newRoomId)) {
    newRoomId = generateRandomString(4);
  }
  return newRoomId;
};

const getPlayerBase = (player: PlayerServer, state: State): PlayerBase => {
  let mandatoryAction: MandatoryAction | undefined = undefined;
  if (mustPlayerPick(player, state.tablePile)) {
    mandatoryAction = 'pick';
  }

  return {
    userId: player.userId,
    name: player.name,

    cardsClosedCount: player.cardsClosed.length,

    // Open cards are always public
    cardsOpen: player.cardsOpen,

    mandatoryAction,
  };
};

const getPlayer = (player: PlayerServer, state: State): Player => {
  return {
    ...getPlayerBase(player, state),

    cardsHand: player.cardsHand,
  };
};

const getPlayerOpponent = (
  player: PlayerServer,
  state: State
): PlayerOpponent => {
  return {
    ...getPlayerBase(player, state),

    cardsHandCount: player.cardsHand.length,
  };
};

/**
 * Sanitize server state to 'anonimize' state for client
 *
 */
const getStateForPlayer = (
  state: State,
  player: PlayerServer
): StateRoomClient => {
  const opponents = state.players.filter(
    ({ userId }) => userId !== player.userId
  );

  return {
    state: state.state,
    currentPlayerUserId: state.currentPlayerUserId,
    player: getPlayer(player, state),
    opponents: opponents.map((p) => getPlayerOpponent(p, state)),
    cardsDeckCount: state.tableDeck.length,
    cardsDiscardedCount: state.tableDiscarded.length,
    cardsPile: state.tablePile,
    error: state.error,
    roomId: state.roomId,
  };
};

export const findRoomForUserId = (userId: string) => {
  // Find room where user is located by searching all rooms
  return storeRooms.find((store) => {
    return !!store
      .getState()
      .players.find((player) => player.userId === userId);
  });
};

export const findRoomForId = (roomId: string) => {
  return storeRooms.find((store) => store.getState().roomId === roomId);
};

export const removeUser = (id: string) => {
  users = users.filter((user) => user.userId !== id);
};

export const addUser = (user: ScheissUser) => {
  users.push(user);
};

export const addRoom = (room: StoreRoom) => {
  storeRooms.push(room);
};

export const removeRoom = (roomId: string) => {
  storeRooms = storeRooms.filter(
    (storeRoom) => storeRoom.getState().roomId !== roomId
  );
};

export const createRoom = () => {
  const room = createStore({
    roomId: createUniqueRoomId(),
  });
  addRoom(room);
  return room;
};

export const syncRoom = (roomId: string, playerId: string) => {
  const room = findRoomForId(roomId);
  if (!room) {
    throw new Error('Room could not by synced. Room ID not found?');
  }

  const roomState = room.getState();

  const player = findPlayerById(playerId, roomState.players);
  if (!player) {
    throw new Error('Can not find player who is syncing the room...?');
  }

  // Sync new state to all users in room
  roomState.players.forEach((player) => {
    const user = users.find((u) => u.userId === player.userId);

    if (user) {
      console.logDebug('SYNC_ROOM', user.userId);
      user.socket.emit('syncRoom', getStateForPlayer(roomState, player));
    }
  });
};

export class ScheissApp {
  constructor(io: SocketIO.Server) {
    io.on('connection', (socket) => {
      addUser(new ScheissUser(socket));
    });
  }
}
