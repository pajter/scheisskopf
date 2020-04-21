import io from 'socket.io-client';

import { Store } from './redux/types';
import { State as StateRoom } from './redux/room/types';
import { Action as ActionRoomServer } from '../../server/src/redux/room/types';

let socket: SocketIOClient.Socket | undefined;

export const getConnectedSocket = () => {
  if (!socket) {
    socket = io(process.env.SOCKET_HOST as string);
    socket.connect();

    window.addEventListener('unload', () => {
      socket?.disconnect();
    });
  }
  return socket;
};

export const emitActionRoom = (action: ActionRoomServer) => {
  if (!socket) {
    throw new Error('Socket not connected!');
  }

  // Send action to server
  socket.emit('actionRoom', action);
};

export const subscribeStore = (store: Store) => {
  if (!socket) {
    throw new Error('Socket not connected!');
  }

  socket.on('syncRoom', (state: StateRoom) => {
    console.info('SYNC_ROOM', state);

    // Sync store from server
    store.dispatch({
      type: 'SYNC',
      state,
    });
  });
};
