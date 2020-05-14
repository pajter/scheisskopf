import _ from 'lodash';
import React from 'react';
import { Redirect } from 'react-router-dom';

import { useSelector } from '../../redux/hooks';

import { Table } from '../../components/table';
import { Player } from '../../components/player';
import { Bot } from '../../components/bot';
import { useSocket } from '../../socket';

export function RoomRoute() {
  const { emit } = useSocket();
  const stateRoom = useSelector((state) => state.room);
  const session = useSelector((state) => state.client.session);
  const players = useSelector((state) => state.room && state.room.players);

  if (
    !(stateRoom && stateRoom.players.find((u) => u.userId === session?.userId))
  ) {
    return <Redirect to="/join" />;
  }

  const addBot = () => {
    emit('ADD_BOT', { roomId: stateRoom.roomId });
  };

  const maxPlayersReached = stateRoom.players.length === 17;

  return (
    <>
      <Table />
      <div className="pad">
        {(stateRoom.state === 'pre-deal' || stateRoom.state === 'ended') && (
          <div
            style={{
              marginBottom: '32px',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button onClick={addBot} disabled={maxPlayersReached}>
              {maxPlayersReached ? 'Max players reached' : 'Add bot'}
            </button>
          </div>
        )}

        {players.map((player) => {
          if ('botSettings' in player) {
            return <Bot key={player.userId} userId={player.userId} />;
          } else {
            return <Player key={player.userId} userId={player.userId} />;
          }
        })}

        {players.length === 1 && <h1>Waiting for players...</h1>}
      </div>
    </>
  );
}
