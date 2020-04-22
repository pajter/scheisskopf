import io from 'socket.io-client';

import {
  SocketClientEvent,
  SocketClientEventArgs,
  SocketServerEvent,
  SocketServerEventArgs,
} from '../../_shared/types';

import { Store } from './redux/types';

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

export function emit<E extends SocketClientEvent>(
  event: E,
  args: SocketClientEventArgs[E]
) {
  if (!socket) {
    throw new Error('SOCKET: Not connected');
  }

  socket.emit(event, args);
}

export function listen<E extends SocketServerEvent>(
  event: E,
  handler: (args: SocketServerEventArgs[E]) => void
) {
  if (!socket) {
    throw new Error('SOCKET: Not connected');
  }

  socket.on(event, handler);
}

export const subscribeStore = (store: Store) => {
  if (!socket) {
    throw new Error('SOCKET: Not connected');
  }

  listen('syncRoom', (state) => {
    console.debug('SYNC_ROOM', state);

    localStorage.setItem('roomId', state.roomId);

    // Sync store from server
    store.dispatch({
      type: 'SYNC',
      state,
    });
  });

  listen('login', ({ error, username, userId }) => {
    if (error) {
      store.dispatch({
        type: 'SET_ERROR',
        error,
      });
    }

    if (userId && username) {
      localStorage.setItem('username', username);
      localStorage.setItem('userId', userId);

      store.dispatch({
        type: 'SET_SESSION',
        session: {
          username,
          userId,
        },
      });
    }
  });

  listen('createSession', ({ error, username, userId }) => {
    if (error) {
      // Session expired
      localStorage.removeItem('username');
      localStorage.removeItem('userId');

      store.dispatch({
        type: 'SET_ERROR',
        error,
      });
    }

    if (username && userId) {
      console.debug('Session resumed');
      store.dispatch({
        type: 'SET_SESSION',
        session: {
          username,
          userId,
        },
      });

      // Try to rejoin room
      const roomId = localStorage.getItem('roomId');
      if (username && userId && roomId) {
        console.debug('Trying to rejoin room', roomId);

        emit('actionRoom', {
          type: 'REJOIN',
          roomId,
        });
      }
    }
  });

  // Try to resume session asap
  const username = localStorage.getItem('username');
  const userId = localStorage.getItem('userId');
  if (username && userId) {
    console.debug('Trying to resume session');
    emit('createSession', { username, userId });
  }
};
