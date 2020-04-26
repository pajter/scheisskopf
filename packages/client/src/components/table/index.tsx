import _ from 'lodash';
import React from 'react';

import { useSelector, useDispatch } from '../../redux/hooks';
import { useSocket } from '../../socket';

import { CardIcon } from '../../components/card-icon';

export function Table() {
  const stateRoom = useSelector((state) => state.room);
  const session = useSelector((state) => state.client.session);
  const player = useSelector((state) =>
    state.room.players.find((p) => p.userId === session?.userId)
  )!;

  const gameState = stateRoom.state;
  const isPlaying = stateRoom.currentPlayerUserId === player.userId;
  const illegalBlindMove = stateRoom.error?.code === 'E_ILLEGAL_MOVE_BLIND';

  return (
    <div className="stick table">
      <div
        className="pad"
        style={{ display: 'flex', justifyContent: 'space-between' }}
      >
        <span>Cards in deck: {stateRoom.cardsDeckCount}</span>

        <span>Cards discarded: {stateRoom.cardsDiscardedCount}</span>
      </div>

      {illegalBlindMove && (
        <div className="pad">
          <h2>WHAAA 😛</h2>
        </div>
      )}

      <div className="scroll">
        <div className="pile">
          <div className="card-stack -overlap">
            {stateRoom.cardsPile.map((cardId) => (
              <CardIcon cardId={cardId} key={cardId} />
            ))}
          </div>
        </div>
      </div>

      {stateRoom.error && <div className="error">{stateRoom.error.code}</div>}
    </div>
  );
}
