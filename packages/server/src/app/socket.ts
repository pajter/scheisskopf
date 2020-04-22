import {
  SocketServerEvent,
  SocketClientEvent,
  SocketClientEventArgs,
  SocketServerEventArgs,
} from '../../../_shared/types';

export function getSocketFunctions(socket: SocketIO.Socket) {
  function emit<E extends SocketServerEvent>(
    event: E,
    args: SocketServerEventArgs[E]
  ) {
    socket.connected && socket.emit(event, args);
  }

  function listen<E extends SocketClientEvent>(
    event: E,
    handler: (args: SocketClientEventArgs[E]) => void
  ) {
    socket.connected && socket.on(event, handler);
  }

  return {
    emit,
    listen,
  };
}
