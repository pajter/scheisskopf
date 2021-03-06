import React from 'react';
import { useSelector } from '../../redux/hooks';
import { Redirect } from 'react-router-dom';
import { useSocket } from '../../socket';
import { Err } from '../../../../_shared/types';

export function JoinRoute() {
  const { emit, emitAndListen } = useSocket();

  const room = useSelector((state) => state.room);

  const [roomId, setRoomId] = React.useState('');
  const [error, setError] = React.useState<Err>();

  if (room) {
    return <Redirect to="/" />;
  }

  const create = () => {
    // When room gets created, user gets redirected
    emit('CREATE_ROOM', {});
  };

  const join = () => {
    // When user joins, room get synced and user gets redirected
    emitAndListen('JOIN_ROOM', { roomId }, ({ error }) => {
      if (error) {
        setError(error);
      }
    });
  };

  return (
    <div className="pad">
      {error && <pre>{error.message}</pre>}

      <input
        type="text"
        placeholder="Room code"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
      />
      <br />
      <br />
      <button disabled={!roomId} onClick={join}>
        Join existing room
      </button>
      <br />
      <br />
      <b>or</b>
      <br />
      <br />
      <button onClick={create}>Create new room</button>
    </div>
  );
}
