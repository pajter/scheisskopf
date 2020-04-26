import { getSocketFunctionsServer } from '../../../_shared/socket';
import { ActionClient } from '../../../_shared/types';
import { createError } from '../../../_shared/util';

import { Store, ActionPrivate } from '../redux/types';

import {
  createRoom,
  findRoomForId,
  findRoomForUserId,
  syncRoom,
} from './rooms';

const createUniqueUserId = (username: string, socketId: string) => {
  return Buffer.from(username + '(*)' + socketId).toString('base64');
};

export class ScheissUser {
  socket!: SocketIO.Socket;

  emit!: ReturnType<typeof getSocketFunctionsServer>['emit'];
  listen!: ReturnType<typeof getSocketFunctionsServer>['listen'];
  listenAndEmit!: ReturnType<typeof getSocketFunctionsServer>['listenAndEmit'];

  username: string;

  userId: string;

  lastPing: Date;

  constructor(username: string, socket: SocketIO.Socket) {
    this.initSocket(socket);

    this.username = username;
    this.userId = createUniqueUserId(username, socket.id);

    this.lastPing = new Date();

    this.init();
  }

  private initSocket(socket: SocketIO.Socket) {
    const socketFunctions = getSocketFunctionsServer(socket);

    this.socket = socket;

    this.emit = socketFunctions.emit;
    this.listen = socketFunctions.listen;
    this.listenAndEmit = socketFunctions.listenAndEmit;
  }

  private init() {
    // Listen for socket disconnect
    this.socket.on('disconnect', (reason) => {
      try {
        this.handleDisconnect(reason);
      } catch (err) {
        console.logError(err);
      }
    });

    this.listen('PING', ({ username, userId }) => {
      if (createUniqueUserId(username, userId) === this.userId) {
        const date = new Date();

        this.lastPing = date;

        this.emit('PING', { timestamp: +date });
      }
    });

    this.listenAndEmit('CREATE_ROOM', () => {
      const room = createRoom();

      // Immediately join room, upon which the client gets room the room state
      this.dispatch({ type: '$JOIN' }, room);

      return { roomId: room.getState().roomId };
    });

    this.listenAndEmit('JOIN_ROOM', ({ roomId }) => {
      const room = findRoomForId(roomId);
      if (!room) {
        return { error: createError('Unknown room!') };
      }

      const roomState = room.getState();
      if (roomState.players.find((player) => player.userId === this.userId)) {
        return { error: createError('User already in room!') };
      }

      if (roomState.players.find((player) => player.name === this.username)) {
        return {
          error: createError(
            'There is already a user with this name in the room'
          ),
        };
      }

      // Join room
      this.dispatch({ type: '$JOIN' }, room);

      return { roomId: room.getState().roomId };
    });

    this.listenAndEmit('REJOIN_ROOM', ({ roomId }) => {
      const room = findRoomForId(roomId);
      if (!room) {
        return { error: createError('Unknown room!') };
      }

      const roomState = room.getState();
      if (!roomState.players.find((player) => player.userId === this.userId)) {
        return { error: createError('User not in room!') };
      }

      this.dispatch({ type: '$REJOIN' }, room);

      return { roomId };
    });

    // Start listening for room actions
    this.listenAndEmit('ACTION_ROOM', (action) => {
      try {
        this.handleActionRoom(action);
      } catch (err) {
        console.logError(err);
        return { error: createError(err.message) };
      }
      return {};
    });

    console.log('user initialized');
  }

  resumeSession(socket: SocketIO.Socket) {
    console.log('resuming user session');
    this.initSocket(socket);

    this.init();
  }

  private dispatch(action: ActionClient | ActionPrivate, room?: Store) {
    room =
      typeof room === 'undefined'
        ? this.userId
          ? findRoomForUserId(this.userId)
          : undefined
        : room;

    if (!room) {
      return;
    }

    room.dispatch({ ...action, user: this });

    syncRoom(room, this.userId);
  }

  private handleActionRoom = (action: ActionClient) => {
    // Private actions
    if (action.type.startsWith('$')) {
      return;
    }

    // User must have session before handling room actions
    if (!this.userId) {
      return;
    }

    console.logDebug('HANDLE_ACTION_ROOM', this.userId);

    // Find existing room for this user
    let room = findRoomForUserId(this.userId);
    if (!room) {
      return;
    }

    this.dispatch(action, room);
  };

  private handleDisconnect = (_reason: any) => {
    console.logDebug('SOCKET_DISCONNECT', this.socket.id);

    if (!this.userId) {
      return;
    }

    this.dispatch({ type: '$USER_DISCONNECT' });
  };
}
