import { Action as ActionRoom } from '../redux/room/types';

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
    socket.on('actionRoom', (action) =>
      this.handleActionRoom({ ...action, userId: this.userId })
    );

    // Listen for disconnect
    socket.on('disconnect', this.handleDisconnect);
  }

  private handleActionRoom = (action: ActionRoom & { userId: string }) => {
    console.debug('actionRoom', this.userId);

    // Find existing room for this user
    let room = findRoomForUserId(this.userId);
    if (action.type === 'JOIN') {
      if (!action.roomId) {
        console.debug('CREATE_ROOM');

        // Create room in server store first
        room = createRoom();

        // Set new roomId on action
        action.roomId = room.getState().roomId;
      } else {
        // Find room by ID
        // TODO: error handling to signal to a user if a room doesn't exist
        room = findRoomForId(action.roomId);
      }
    }

    if (!room) {
      throw new Error("Room is undefined. This wasn't supposed to happen.");
    }

    console.debug('Dispatching', action);
    room.dispatch(action);

    syncRoom(room.getState().roomId, this.userId);
  };

  private handleDisconnect = (reason: any) => {
    console.debug('Disconnection from', this.socket.id, reason);

    // TODO: AFK/reconnect handling

    const room = findRoomForUserId(this.userId);
    if (!room) {
      return;
    }

    room.dispatch({ type: 'LEAVE', userId: this.userId });

    removeUser(this.userId);
  };
}
