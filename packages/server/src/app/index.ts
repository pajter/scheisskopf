import { Err } from '../../../_shared/types';
import { getSocketFunctionsServer } from '../../../_shared/socket';

import { findUserByName, addUser, findUserById } from './users';
import { ScheissUser } from './user';

export const createError = (msg: string): Err => {
  const e = new Error(msg);

  return { message: e.message };
};

export class ScheissApp {
  constructor(io: SocketIO.Server) {
    io.on('connection', (socket) => {
      const { listenAndEmit } = getSocketFunctionsServer(socket);

      listenAndEmit('LOGIN', ({ username }) => {
        console.logDebug('LOGIN', username);

        if (findUserByName(username)) {
          return { error: createError('User already exists!') };
        }

        // Add user to pool
        const user = new ScheissUser(username, socket);
        addUser(user);

        // Create unique user id and return to client
        return {
          userId: user.userId,
          username,
        };
      });

      listenAndEmit('CREATE_SESSION', ({ username, userId }) => {
        console.logDebug('CREATE_SESSION', username);

        const user = findUserById(userId);
        if (!(user && user.username === username && user.userId === userId)) {
          return {
            error: createError('Session expired!'),
          };
        }

        user.resumeSession(socket);

        // Emit valid session
        return { username, userId };
      });
    });
  }
}
