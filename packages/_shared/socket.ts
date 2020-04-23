import { SocketClientEvent, SocketServerEvent } from './types';

function getSocketFunctions<
  I extends SocketClientEvent | SocketServerEvent,
  O extends SocketServerEvent | SocketClientEvent
>(socket: SocketIO.Socket | SocketIOClient.Socket) {
  function emit<E extends keyof I>(event: E, arg: I[E]) {
    socket && socket.connected && socket.emit(event as string, arg);
  }

  function listen<E extends keyof O>(event: E, handler: (arg: O[E]) => void) {
    socket && socket.connected && socket.on(event as string, handler);
  }

  function emitAndListen<E extends Extract<keyof I, keyof O>>(
    event: E,
    arg: I[E],
    returnHandler: (returnArg: O[E]) => void
  ) {
    console.log('emitAndListen', event, arg);
    // Set listener before emitting
    listen(event, returnHandler);

    emit(event, arg);
  }

  function listenAndEmit<E extends Extract<keyof I, keyof O>>(
    event: E,
    emitHandler: (arg: O[E]) => I[E]
  ) {
    console.log('listenAndEmit', event);
    listen(event, (arg) => {
      console.log('received', arg);
      const returnArgs = emitHandler(arg);
      if (returnArgs) {
        console.log('emitting', event, returnArgs);
        emit(event, returnArgs);
      }
    });
  }

  function getEmitter<E extends keyof I>(event: E) {
    return (args: I[E]) => emit(event, args);
  }

  function getEmitAndListener<E extends Extract<keyof I, keyof O>>(event: E) {
    return (arg: I[E], returnHandler: (returnArg: O[E]) => void) => {
      emitAndListen(event, arg, returnHandler);
    };
  }

  return {
    listen,
    emit,
    emitAndListen,
    listenAndEmit,
    getEmitter,
    getEmitAndListener,
  };
}

export const getSocketFunctionsServer = (socket: SocketIO.Socket) =>
  getSocketFunctions<SocketServerEvent, SocketClientEvent>(socket);

export const getSocketFunctionsClient = (socket: SocketIOClient.Socket) =>
  getSocketFunctions<SocketClientEvent, SocketServerEvent>(socket);
