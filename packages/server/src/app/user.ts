import { Action as ActionRoom, Store as StoreRoom } from '../redux/room/types';

import { ScheissApp } from './index';

export interface User {
  id: string;
  ip: string;
}

export class ScheissUser {
  app: ScheissApp;
  socket: SocketIO.Socket;
  userId: string;

  private _roomCache?: StoreRoom;

  constructor(socket: SocketIO.Socket, app: ScheissApp) {
    this.socket = socket;
    this.app = app;

    // TODO: user id from socket?
    this.userId = socket.id;

    console.log('Connection from', this.socket.id);

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

        this._roomCache = this.app.createRoom();
      } else {
        // Find existing room
        this._roomCache = this.app.findRoomForId(action.roomId);
      }
    }

    if (!this._roomCache) {
      throw new Error(
        "Room cache is undefined. This wasn't supposed to happen."
      );
    }

    console.log('Dispatching', action);
    this._roomCache.dispatch(action);

    this.app.syncRoom(this._roomCache.getState().roomId);
  };

  handleDisconnect = (reason: any) => {
    console.log('Disconnection from', this.socket.id, reason);

    // TODO: AFK/reconnect handling

    const room = this.getRoom();
    if (!room) {
      return;
    }

    room.dispatch({ type: 'LEAVE', userId: this.userId });

    this.app.removeUser(this.userId);
  };

  private getRoom() {
    if (this._roomCache) {
      return this._roomCache;
    }

    this._roomCache = this.app.findRoomForUserId(this.userId);

    return this._roomCache;
  }
}
