import { generateRandomString } from '../../../_shared/util';

import {
  State as StateRoomClient,
  Player,
  PlayerOther,
  PlayerBase,
} from '../../../client/src/redux/room/types';
import {
  Store as StoreRoom,
  Player as RoomPlayer,
  State as RoomState,
} from '../redux/room/types';
import { getStore as getStoreRoom } from '../redux/room/store';

import { ScheissUser } from './user';
import { findPlayerById } from '../redux/room/util';

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

const getPlayerBase = (player: RoomPlayer): PlayerBase => ({
  userId: player.userId,
  name: player.name,
  cardsClosedCount: player.cardsClosed.length,

  cardsOpen: player.cardsOpen,
});

const getPlayer = (player: RoomPlayer): Player => ({
  ...getPlayerBase(player),
  cardsHand: player.cardsHand,
});

const getOtherPlayer = (player: RoomPlayer): PlayerOther => ({
  ...getPlayerBase(player),
  cardsHandCount: player.cardsHand.length,
});

/**
 * Sanitize server state to 'anonimize' state for client
 *
 */
const getRoomStateForPlayer = (
  roomState: RoomState,
  player: RoomPlayer
): StateRoomClient => {
  const otherPlayers = roomState.players.filter(
    ({ userId }) => userId !== player.userId
  );

  return {
    state: roomState.state,
    currentPlayerUserId: roomState.currentPlayerUserId,
    player: getPlayer(player),
    otherPlayers: otherPlayers.map(getOtherPlayer),
    cardsDeckCount: roomState.tableDeck.length,
    cardsDiscardedCount: roomState.tableDiscarded.length,
    cardsPile: roomState.tablePile,
    error: null,
    roomId: roomState.roomId,
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
  const room = getStoreRoom({
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
      user.socket.emit('syncRoom', getRoomStateForPlayer(roomState, player));
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
