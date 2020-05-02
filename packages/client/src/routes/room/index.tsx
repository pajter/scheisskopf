import _ from 'lodash';
import React from 'react';
import { Redirect } from 'react-router-dom';

import { useSelector } from '../../redux/hooks';

import { Table } from '../../components/table';
import { Player } from '../../components/player';

export function RoomRoute() {
  const stateRoom = useSelector((state) => state.room);
  const session = useSelector((state) => state.client.session);
  const playerUserIds = useSelector(
    (state) => state.room && state.room.players.map((p) => p.userId)
  );

  if (
    !(stateRoom && stateRoom.players.find((u) => u.userId === session?.userId))
  ) {
    return <Redirect to="/join" />;
  }

  return (
    <>
      <Table />
      <div className="pad">
        {playerUserIds.length === 1 && <h1>Waiting for players...</h1>}

        {playerUserIds.map((playerUserId) => (
          <Player key={playerUserId} userId={playerUserId} />
        ))}
      </div>
    </>
  );
}
