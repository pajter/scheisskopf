import { useDispatch } from '../../redux/hooks';
import { useSocket } from '../../socket';

const clearSessionStorage = () => {
  localStorage.removeItem('sessionId');
  localStorage.removeItem('roomId');
};

export function Init() {
  const { emitAndListen, listen } = useSocket();

  const dispatch = useDispatch();

  const resumeSession = (sessionId: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      console.debug('Trying to resume session');

      emitAndListen('CREATE_SESSION', { sessionId }, ({ error, session }) => {
        if (error) {
          // Session expired
          clearSessionStorage();

          reject(error);
        }

        if (session) {
          console.debug('Session resumed');

          dispatch({
            type: 'SET_SESSION',
            session,
          });

          dispatch({
            type: 'CLEAR_ERROR',
          });

          // Try to rejoin room
          const roomId = localStorage.getItem('roomId');
          if (roomId) {
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
      });
    });
  };

  // Start listening to room actions asap because the server will fire them asap
  listen('ACTION_ROOM', ({ error, state }) => {
    console.debug('ACTION_ROOM', { error, state });

    if (error) {
      dispatch({
        type: 'SET_ROOM_ERROR',
        error,
      });
    } else {
      dispatch({
        type: 'CLEAR_ROOM_ERROR',
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

  const sessionId = localStorage.getItem('sessionId');

  if (sessionId) {
    // Try to resume session asap
    resumeSession(sessionId)
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
