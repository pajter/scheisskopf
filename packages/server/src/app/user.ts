import { Action as ActionRoom } from '../redux/types';

import {
  createRoom,
  findRoomForId,
  syncRoom,
  removeUser,
  findRoomForUserId,
} from './index';

export class ScheissUser {
  socket: SocketIO.Socket;
  userId: string;

  constructor(socket: SocketIO.Socket) {
    this.socket = socket;

    // TODO: user id from socket?
    this.userId = socket.id;

    console.info('Connection from', this.socket.id);

    // Listen for room actions
    socket.on('actionRoom', (action) => {
      try {
        this.handleActionRoom({ ...action, userId: this.userId });
      } catch (err) {
        console.logError(err);
      }
    });

    // Listen for disconnect
    socket.on('disconnect', () => {
      try {
        this.handleDisconnect;
      } catch (err) {
        console.logError(err);
      }
    });
  }

  private handleActionRoom = (action: ActionRoom & { userId: string }) => {
    console.logDebug('HANDLE_ACTION_ROOM', this.userId);

    // Find existing room for this user
    let room = findRoomForUserId(this.userId);

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
          throw new Error('Room ID to join can not be found!');
        }
      }
    }

    if (!room) {
      throw new Error("Room is undefined. This wasn't supposed to happen.");
    }

    room.dispatch(action);

    syncRoom(room.getState().roomId, this.userId);
  };

  private handleDisconnect = (reason: any) => {
    console.logDebug('SOCKET_DISCONNECT', this.socket.id, reason);

    // TODO: AFK/reconnect handling

    const room = findRoomForUserId(this.userId);
    if (!room) {
      return;
    }

    room.dispatch({ type: 'USER_DISCONNECT', userId: this.userId });

    removeUser(this.userId);
  };
}
