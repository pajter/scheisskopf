import { generateRandomString } from '../../../_shared/util';
import {
  PlayerClient,
  PlayerClientOpponent,
  PlayerBase,
  MandatoryAction,
  Err,
} from '../../../_shared/types';

import { State as StateClientRoom } from '../../../client/src/redux/room/types';

import {
  Store as StoreRoom,
  Player as PlayerServer,
  State as StateServer,
} from '../redux/types';

import { createStore } from '../redux/store';
import { findPlayerById, mustPlayerPick } from '../redux/util';

import { ScheissUser } from './user';
import { getSocketFunctions } from './socket';

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

    connected: true,
    lastPing: new Date(),

    // Open cards are always public
    cardsOpen: player.cardsOpen,

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

    // Closed cards are invisible
    cardsClosedCount: player.cardsClosed.length,
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
    cardsClosedCount: player.cardsClosed.length,
  };
};

/**
 * Sanitize server state to 'anonimize' state for client
 */
const getStateClientRoomForPlayer = (
  state: StateServer,
  player: PlayerServer
): StateClientRoom => {
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

export const createUniqueUserId = (username: string, socketId: string) => {
  return Buffer.from(username + '_' + socketId).toString('base64');
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

export const findUserByName = (username: string) => {
  return users.find((u) => u.username === username);
};

export const findUserById = (userId: string) => {
  return users.find((u) => u.userId === userId);
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

export const syncRoom = (room: StoreRoom, userId: string) => {
  const roomState = room.getState();

  const player = findPlayerById(userId, roomState.players);
  if (!player) {
    throw new Error('SYNC_ROOM: Can not find player');
  }

  // Sync new state to all users in room
  roomState.players.forEach((player) => {
    const user = users.find((u) => u.userId === player.userId);

    if (user) {
      console.logDebug('SYNC_ROOM', user.userId);

      user.emit('syncRoom', getStateClientRoomForPlayer(roomState, player));
    }
  });
};

export const createError = (msg: string): Err => {
  const e = new Error(msg);

  return { message: e.message };
};

export const bootScheissApp = (io: SocketIO.Server) => {
  io.on('connection', (socket) => {
    const { listen, emit } = getSocketFunctions(socket);

    listen('login', ({ username }) => {
      if (findUserByName(username)) {
        return emit('login', { error: createError('User already exists!') });
      }

      // Add user to pool
      const user = new ScheissUser(username, socket);
      addUser(user);

      // Create unique user id and return to client
      emit('login', {
        userId: user.userId,
        username,
      });

      console.logDebug('LOGIN', username);
    });

    listen('createSession', ({ username, userId }) => {
      const user = findUserById(userId);
      if (!(user && user.username === username)) {
        return emit('createSession', {
          error: createError('Session expired!'),
        });
      }

      console.logDebug('CREATE_SESSION', username);

      user.resumeSession(socket);

      // Emit valid session
      emit('createSession', { username, userId });
    });
  });
};
