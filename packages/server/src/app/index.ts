import { createError } from '../../../_shared/util';
import { getSocketFunctionsServer } from '../../../_shared/socket';

import { addUser, removeUser, findUserBySessionId } from './users';
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
          session: user.getSession(),
        };
      });

      listenAndEmit('CREATE_SESSION', ({ sessionId }) => {
        console.logDebug('CREATE_SESSION', sessionId);

        const user = findUserBySessionId(sessionId);
        if (!user) {
          return {
            error: createError('Create session failed!'),
          };
        }

        const session = user.resumeSession(socket);

        // Emit valid session
        return {
          session,
        };
      });

      listenAndEmit('DELETE_SESSION', ({ sessionId }) => {
        console.logDebug('DELETE_SESSION', sessionId);

        const user = findUserBySessionId(sessionId);
        if (!user) {
          return {
            error: createError('Delete session failed!'),
          };
        }

        removeUser(user.userId);

        return {};
      });
    });
  }
}
