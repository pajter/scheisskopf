import { getStore as getStoreServer } from './redux/server/store';

import {
  Action as ActionRoom,
  Store as StoreRoomServer,
} from './redux/room/types';
import { getStore as getStoreRoom } from './redux/room/store';
import { generateRandomString } from '../../_shared/util';
import { State as StateRoomClient } from '../../client/src/redux/room/types';

const storeServer = getStoreServer();

export class ScheissApp {
  socket: SocketIO.Socket;
  userId: string;

  room?: StoreRoomServer;

  constructor(socket: SocketIO.Socket) {
    this.socket = socket;

    console.log('Connection from', this.socket.id);

    this.userId = socket.id;

    // Add user to store
    storeServer.dispatch({
      type: 'USER_CONNECT',
      userId: this.userId,
      ip: socket.handshake.address,
    });

    // Listen for room actions
    socket.on('actionRoom', (action) =>
      this.handleActionRoom({ ...action, userId: this.userId })
    );

    // Listen for disconnect
    socket.on('disconnect', this.handleDisconnect);
  }

  handleActionRoom = (action: ActionRoom & { userId: string }) => {
    console.log('actionRoom');
    console.logObject(action);

    // Create room in server store first
    if (action.type === 'JOIN') {
      if (!action.roomId) {
        console.log('CREATE_ROOM');

        this.room = getStoreRoom({
          roomId: createUniqueRoomId(
            storeServer.getState().rooms.map((store) => store.getState().roomId)
          ),
        });

        // Create new room
        storeServer.dispatch({
          type: 'CREATE_ROOM',
          newRoom: this.room,
        });

        console.logObject(storeServer.getState());
      } else {
        // Find existing room
        this.room = findRoomForId(action.roomId);
      }

      // Add socket to user action
      action.socket = this.socket;
    }

    this.getRoom().dispatch(action);

    this.syncRoom();
  };

  handleDisconnect = (reason: any) => {
    console.log('Disconnection from', this.socket.id, reason);

    // Remove user from room
    this.room && this.room.dispatch({ type: 'LEAVE', userId: this.userId });

    // Remove user from store
    storeServer.dispatch({
      type: 'USER_DISCONNECT',
      userId: this.userId,
    });
  };

  syncRoom = () => {
    if (!this.room) {
      throw new Error('Room not initialized!');
    }

    const serverState = this.room.getState();

    // Sanitize server state to 'anonimize' state for client
    const state: StateRoomClient = {
      state: serverState.state,
      currentPlayerUserId: serverState.currentPlayerUserId,
      players: serverState.players.map((player) => {
        return {
          name: player.name,
          cardsClosedCount: player.cardsClosed.length,
          cardsHandCount: player.cardsHand.length,
          cardsOpen: player.cardsOpen,
        };
      }),
      cardsDeckCount: serverState.tableDeck.length,
      cardsDiscardedCount: serverState.tableDiscarded.length,
      cardsPile: serverState.tablePile,
      error: null,
      roomId: serverState.roomId,
    };

    // Sync new state to all players
    serverState.players.forEach((player) => {
      player.socket.emit('syncRoom', state);
    });
  };

  private getRoom() {
    if (!this.room) {
      this.room = findRoomForUserId(this.userId);
    }

    if (!this.room) {
      throw new Error('Missing room!');
    }

    return this.room;
  }
}

const findRoomForUserId = (userId: string) => {
  // Find room where user is located by searching all rooms
  return storeServer
    .getState()
    .rooms.find((store) =>
      store.getState().players.find((player) => player.id === userId)
    );
};

const findRoomForId = (roomId: string) => {
  return storeServer
    .getState()
    .rooms.find((store) => store.getState().roomId === roomId);
};

const createUniqueRoomId = (roomIds: string[]) => {
  let newRoomId = generateRandomString(4);
  while (roomIds.includes(newRoomId)) {
    newRoomId = generateRandomString(4);
  }
  return newRoomId;
};
