import { createError } from '../../../_shared/util';
import { getSocketFunctionsServer } from '../../../_shared/socket';

import { addUser, findUserById, removeUser } from './users';
import { ScheissUser } from './user';

export class ScheissApp {
  constructor(io: SocketIO.Server) {
    io.on('connection', (socket) => {
      const { listenAndEmit } = getSocketFunctionsServer(socket);

      listenAndEmit('LOGIN', ({ username }) => {
        console.logDebug('LOGIN', username);

        // Add user to pool
        const user = new ScheissUser(username, socket);
        addUser(user);

        // Return to client
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

      listenAndEmit('DELETE_SESSION', ({ username, userId }) => {
        console.logDebug('DELETE_SESSION', username);

        removeUser(userId);

        return {};
      });
    });
  }
}
