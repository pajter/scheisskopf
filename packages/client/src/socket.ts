import io from 'socket.io-client';

import { getSocketFunctionsClient } from '../../_shared/socket';

let socket: SocketIOClient.Socket | undefined;

export const initSocket = (): Promise<SocketIOClient.Socket> => {
  return new Promise((resolve, reject) => {
    socket = io(process.env.SOCKET_HOST as string);
    socket.connect();

    socket.on('connect', () => {
      resolve(socket);
    });
    socket.on('connect_error', () => {
      reject();
    });
    socket.on('connect_timeout', () => {
      reject();
    });
    socket.on('reconnect_failed', () => {
      reject();
    });

    window.addEventListener('unload', () => {
      socket?.disconnect();
    });
  });
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized!');
  }

  return socket;
};

export const useSocket = () => {
  const socket = getSocket();

  return {
    socket,
    ...getSocketFunctionsClient(socket),
  };
};
