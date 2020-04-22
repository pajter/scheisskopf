import { Action as ActionRoom, Store } from '../redux/types';

import { getSocketFunctions } from './socket';
import {
  createRoom,
  findRoomForId,
  syncRoom,
  findRoomForUserId,
  createUniqueUserId,
} from './index';

export class ScheissUser {
  socket: SocketIO.Socket;

  emit: ReturnType<typeof getSocketFunctions>['emit'];
  listen: ReturnType<typeof getSocketFunctions>['listen'];

  username: string;

  userId: string;

  lastPing: Date;

  constructor(username: string, socket: SocketIO.Socket) {
    this.socket = socket;

    const socketFunctions = getSocketFunctions(socket);

    this.emit = socketFunctions.emit;
    this.listen = socketFunctions.listen;

    this.username = username;

    this.userId = createUniqueUserId(username, socket.id);

    this.lastPing = new Date();

    this.init();
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

    this.listen('ping', ({ username, userId }) => {
      if (createUniqueUserId(username, userId) === this.userId) {
        this.lastPing = new Date();

        this.emit('ping', {});
      }
    });

    // Start listening for room actions
    this.listen('actionRoom', (action) => {
      try {
        this.handleActionRoom(action);
      } catch (err) {
        console.logError(err);
      }
    });
  }

  resumeSession(socket: SocketIO.Socket) {
    this.socket = socket;

    const socketFunctions = getSocketFunctions(socket);

    this.emit = socketFunctions.emit;
    this.listen = socketFunctions.listen;

    this.init();
  }

  private dispatch(action: ActionRoom, room?: Store) {
    room = typeof room === 'undefined' ? findRoomForUserId(this.userId!) : room;

    if (!room) {
      return;
    }

    room.dispatch({ ...action, user: this });
  }

  private handleActionRoom = (action: ActionRoom) => {
    if (!this.userId) {
      return;
    }

    console.logDebug('HANDLE_ACTION_ROOM', this.userId);

    // Find existing room for this user
    let room = findRoomForUserId(this.userId);

    // Note: JOIN can also create first before joining
    if (action.type === 'JOIN') {
      if (!action.roomId) {
        console.logDebug('CREATE_ROOM');

        // Create room in server store first
        room = createRoom();

        // Set new roomId on action
        action.roomId = room.getState().roomId;
      } else {
        // Find room by ID
        room = findRoomForId(action.roomId);

        // TODO: error handling to signal to a user if a room doesn't exist
        if (!room) {
          throw new Error('HANDLE_ACTION_ROOM: No room to join');
        }
      }
    }

    if (action.type === 'REJOIN') {
      room = findRoomForId(action.roomId);

      if (!room) {
        throw new Error('HANDLE_ACTION_ROOM: No room to rejoin');
      }

      // Check if user was actually in room
      if (!room.getState().players.find((u) => u.userId === this.userId)) {
        throw new Error('HANDLE_ACTION_ROOM: User was not in requested room');
      }
    }

    if (!room) {
      throw new Error('HANDLE_ACTION_ROOM: Room is undefined');
    }

    this.dispatch(action, room);

    syncRoom(room, this.userId);
  };

  private handleDisconnect = (_reason: any) => {
    console.logDebug('SOCKET_DISCONNECT', this.socket.id);

    if (!this.userId) {
      return;
    }

    this.dispatch({ type: 'USER_DISCONNECT' });
  };
}
