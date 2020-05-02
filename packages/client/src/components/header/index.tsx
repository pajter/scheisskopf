import React from 'react';

import { useSelector, useDispatch } from '../../redux/hooks';
import { useSocket } from '../../socket';

export const Header = () => {
  const { getEmitter, emitAndListen } = useSocket();

  const session = useSelector((state) => state.client.session);
  const error = useSelector((state) => state.client.error);
  const stateRoom = useSelector((state) => state.room);

  const dispatch = useDispatch();

  const emitAction = getEmitter('ACTION_ROOM');

  const leave = () => {
    emitAction({
      type: 'LEAVE',
    });

    dispatch({ type: 'CLEAR_ROOM' });
  };

  const signOut = () => {
    // Leave room first
    emitAction({
      type: 'LEAVE',
    });

    // Delete session
    session &&
      emitAndListen('DELETE_SESSION', { sessionId: session.sessionId }, () => {
        dispatch({ type: 'CLEAR_ROOM' });
        dispatch({ type: 'DESTROY_SESSION' });
      });
  };

  return (
    <div className="stick header">
      {error && <pre className="error">{error.message}</pre>}
      <div>
        {!stateRoom && <h2>{session && session.username}</h2>}

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {stateRoom && (
            <h3>
              <code>{stateRoom.roomId}</code>
            </h3>
          )}
        </div>

        {stateRoom && <button onClick={leave}>Leave</button>}
        {session && <button onClick={signOut}>Sign out</button>}
      </div>
    </div>
  );
};
