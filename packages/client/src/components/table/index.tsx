import _ from 'lodash';
import React from 'react';

import { useSelector } from '../../redux/hooks';

import { CardIcon } from '../../components/card-icon';

export function Table() {
  const stateRoom = useSelector((state) => state.room);

  const illegalBlindMove = stateRoom.error?.code === 'E_ILLEGAL_MOVE_BLIND';

  return (
    <div className="stick table">
      <div className="pad">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Cards in deck: {stateRoom.cardsDeckCount}</span>

          <span>Cards discarded: {stateRoom.cardsDiscardedCount}</span>
        </div>

        {illegalBlindMove && <h2>WHAAA 😛</h2>}
      </div>

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
