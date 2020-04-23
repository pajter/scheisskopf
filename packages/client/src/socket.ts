import io from 'socket.io-client';

import { getSocketFunctionsClient } from '../../_shared/socket';

let socket: SocketIOClient.Socket | undefined;

export const initSocket = (): Promise<SocketIOClient.Socket> => {
  return new Promise((resolve) => {
    socket = io(process.env.SOCKET_HOST as string);
    socket.connect();
    socket.on('connect', () => {
      resolve(socket);
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
