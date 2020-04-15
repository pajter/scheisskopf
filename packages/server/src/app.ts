import { generateRandomString } from '../../_shared/util';

import { State as StateRoomClient } from '../../client/src/redux/room/types';
import { Store as StoreRoom } from './redux/room/types';
import { getStore as getStoreRoom } from './redux/room/store';

import { ScheissUser } from './user';

export interface User {
  id: string;
  ip: string;
}

export class ScheissApp {
  users: ScheissUser[] = [];

  storeRooms: StoreRoom[] = [];

  constructor(io: SocketIO.Server) {
    io.on('connection', (socket) => {
      this.addUser(new ScheissUser(socket, this));
    });
  }

  createRoom = () => {
    const room = getStoreRoom({
      roomId: this.createUniqueRoomId(),
    });
    this.addRoom(room);
    return room;
  };

  findRoomForUserId = (userId: string) => {
    // Find room where user is located by searching all rooms
    return this.storeRooms.find((store) =>
      store.getState().players.find((player) => player.userId === userId)
    );
  };

  findRoomForId = (roomId: string) => {
    return this.storeRooms.find((store) => store.getState().roomId === roomId);
  };

  removeUser = (id: string) => {
    this.users = this.users.filter((user) => user.userId !== id);
  };

  syncRoom = (roomId: string) => {
    const room = this.findRoomForId(roomId);
    if (!room) {
      throw new Error('Room could not by synced. Room ID not found?');
    }

    const roomState = room.getState();

    // Sanitize server state to 'anonimize' state for client
    const state: StateRoomClient = {
      state: roomState.state,
      currentPlayerUserId: roomState.currentPlayerUserId,
      players: roomState.players.map((player) => {
        return {
          name: player.name,
          cardsClosedCount: player.cardsClosed.length,
          cardsHandCount: player.cardsHand.length,
          cardsOpen: player.cardsOpen,
        };
      }),
      cardsDeckCount: roomState.tableDeck.length,
      cardsDiscardedCount: roomState.tableDiscarded.length,
      cardsPile: roomState.tablePile,
      error: null,
      roomId: roomState.roomId,
    };

    // Get all users in room
    const roomUserIds = roomState.players.map((p) => p.userId);
    const users = this.users.filter((user) =>
      roomUserIds.includes(user.userId)
    );

    // Sync new state to all users in room
    users.forEach((user) => {
      user.socket.emit('syncRoom', state);
    });
  };

  private addUser = (user: ScheissUser) => {
    this.users.push(user);
  };

  private addRoom = (room: StoreRoom) => {
    this.storeRooms.push(room);
  };

  // private removeRoom = (roomId: string) => {
  //   this.storeRooms = this.storeRooms.filter(
  //     (storeRoom) => storeRoom.getState().roomId !== roomId
  //   );
  // };

  private createUniqueRoomId = (): string => {
    let newRoomId = generateRandomString(4);
    const roomIds = this.storeRooms.map(
      (storeRoom) => storeRoom.getState().roomId
    );
    while (roomIds.includes(newRoomId)) {
      newRoomId = generateRandomString(4);
    }
    return newRoomId;
  };
}
