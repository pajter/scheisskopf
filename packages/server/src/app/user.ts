import { getSocketFunctionsServer } from '../../../_shared/socket';
import { ActionClient, Session } from '../../../_shared/types';
import { createError, generateRandomString } from '../../../_shared/util';
import { pbkdf2Sync } from 'crypto';

import { Store, ActionPrivate } from '../redux/types';

import {
  createRoom,
  findRoomForId,
  findRoomForUserId,
  syncRoom,
} from './rooms';

const createUniqueUserId = (
  username: string,
  socketId: string,
  salt: string
) => {
  const str = pbkdf2Sync(username + '(*)' + socketId, salt, 100, 32, 'sha512');
  return Buffer.from(str).toString('base64');
};

const createUniqueSessionId = (userId: string, salt: string) => {
  const str = pbkdf2Sync(userId, salt, 100, 32, 'sha512');
  return Buffer.from(str).toString('base64');
};

export class ScheissUser {
  socket!: SocketIO.Socket;

  emit!: ReturnType<typeof getSocketFunctionsServer>['emit'];
  listen!: ReturnType<typeof getSocketFunctionsServer>['listen'];
  listenAndEmit!: ReturnType<typeof getSocketFunctionsServer>['listenAndEmit'];

  username: string;
  salt: string;
  userId: string;
  sessionId!: string;

  lastPing: Date;

  constructor(username: string, socket: SocketIO.Socket) {
    this.initSocket(socket);

    this.username = username;
    this.salt = generateRandomString(6);
    this.userId = createUniqueUserId(username, socket.id, this.salt);

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
    this.sessionId = createUniqueSessionId(this.userId, this.salt);

    // Listen for socket disconnect
    this.socket.on('disconnect', (reason) => {
      try {
        this.handleDisconnect(reason);
      } catch (err) {
        console.logError(err);
      }
    });

    this.listen('PING', ({ sessionId }) => {
      if (this.sessionId !== sessionId) {
        return;
      }

      const date = new Date();

      this.lastPing = date;

      this.emit('PING', { timestamp: +date });
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

      if (!(roomState.state === 'pre-deal' || roomState.state === 'ended')) {
        return {
          error: createError('Game in progress'),
        };
      }

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

      if (
        roomState.spectactors.find((player) => player.userId === this.userId)
      ) {
        return {
          error: createError('Already spectating!'),
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

  resumeSession(socket: SocketIO.Socket): Session | undefined {
    console.log('resuming user session');
    this.initSocket(socket);

    this.init();

    return this.getSession();
  }

  getSession(): Session | undefined {
    if (!this.sessionId) {
      return;
    }
    return {
      username: this.username,
      userId: this.userId,
      sessionId: this.sessionId,
    };
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

    const actionClient = action.type.startsWith('$')
      ? undefined
      : (action as ActionClient);

    syncRoom(room, actionClient);
  }

  private handleActionRoom = (action: ActionClient) => {
    // Private actions
    if (action.type.startsWith('$')) {
      return;
    }

    // User must have session before handling room actions
    if (!this.sessionId) {
      return;
    }

    console.logDebug('HANDLE_ACTION_ROOM', this.sessionId);

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
