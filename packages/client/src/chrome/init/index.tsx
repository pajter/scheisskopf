import { useDispatch } from '../../redux/hooks';
import { useSocket } from '../../socket';

const clearSessionStorage = () => {
  localStorage.removeItem('username');
  localStorage.removeItem('userId');
  localStorage.removeItem('roomId');
};

export function Init() {
  const { emitAndListen, listen } = useSocket();

  const dispatch = useDispatch();

  const resumeSession = (
    username: string,
    userId: string
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      console.debug('Trying to resume session');

      emitAndListen(
        'CREATE_SESSION',
        { username, userId },
        ({ error, username, userId }) => {
          if (error) {
            // Session expired
            clearSessionStorage();

            reject(error);
          }

          if (username && userId) {
            console.debug('Session resumed');

            dispatch({
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

              emitAndListen('REJOIN_ROOM', { roomId }, ({ error, roomId }) => {
                console.log({ error, roomId });
                if (error) {
                  localStorage.removeItem('roomId');

                  reject(error);
                }

                if (roomId) {
                  resolve();
                }
              });
            } else {
              // Session resumed, no room to re-join
              resolve();
            }
          }
        }
      );
    });
  };

  // Start listening to room actions asap because the server will fire them asap
  listen('ACTION_ROOM', ({ error, state }) => {
    if (error) {
      dispatch({
        type: 'SET_ERROR',
        error,
      });
    }

    if (state) {
      // Sync store from server
      dispatch({
        type: 'SYNC',
        state,
      });
    }
  });

  const username = localStorage.getItem('username');
  const userId = localStorage.getItem('userId');

  if (username && userId) {
    // Try to resume session asap
    resumeSession(username, userId)
      .then(() => {
        // Done loading
        dispatch({ type: 'SET_LOADING', loading: false });
      })
      .catch((error) => {
        dispatch({ type: 'SET_LOADING', loading: false });
        dispatch({ type: 'SET_ERROR', error });
      });
  } else {
    // Done loading
    dispatch({ type: 'SET_LOADING', loading: false });
  }

  return null;
}
