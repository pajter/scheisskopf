import React from 'react';
import { emit } from '../../socket';
import { useSelector } from '../../redux/hooks';
import { Redirect } from 'react-router-dom';

export function JoinRoute() {
  const room = useSelector((state) => state.room);

  const [roomId, setRoomId] = React.useState('');

  if (room) {
    return <Redirect to="/" />;
  }

  const join = () => {
    emit('actionRoom', {
      type: 'JOIN',
      roomId,
    });
  };

  return (
    <div className="pad">
      <button onClick={join}>Create new room</button>
      <br />
      <br />
      <b>or</b>
      <br />
      <br />
      <input
        type="text"
        placeholder="Room code"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <br />
      <br />

      <button disabled={!(roomId && name)} onClick={join}>
        Join existing room
      </button>
    </div>
  );
}
