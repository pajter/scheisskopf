import _ from 'lodash';
import React from 'react';

import { useSelector, useDispatch } from '../../redux/hooks';
import { useSocket } from '../../socket';

import { CardIcon } from '../../components/card-icon';

export function Table() {
  const { getEmitter } = useSocket();

  const stateRoom = useSelector((state) => state.room);
  const session = useSelector((state) => state.client.session);
  const player = useSelector((state) =>
    state.room.players.find((p) => p.userId === session?.userId)
  )!;
  const selectedCardIds = useSelector((state) => state.client.selectedCardIds);

  const dispatch = useDispatch();

  const emitAction = getEmitter('ACTION_ROOM');

  const gameState = stateRoom.state;
  const isPlaying = stateRoom.currentPlayerUserId === player.userId;
  const illegalBlindMove = stateRoom.error?.code === 'E_ILLEGAL_MOVE_BLIND';

  const pick = () => {
    emitAction({ type: 'PICK', ownCards: selectedCardIds.open });
    dispatch({ type: 'CLEAR_CARD_SELECTION' });
  };

  const clearThePile = () => {
    emitAction({ type: 'CLEAR_THE_PILE' });
  };

  return (
    <div className="stick table">
      <div
        className="pad"
        style={{ display: 'flex', justifyContent: 'space-between' }}
      >
        <span>Cards in deck: {stateRoom.cardsDeckCount}</span>

        <span>Cards discarded: {stateRoom.cardsDiscardedCount}</span>
      </div>

      {illegalBlindMove && <h2>WHAAA 😛</h2>}

      <div className="scroll">
        <div className="pile">
          <div className="card-stack -overlap">
            {stateRoom.cardsPile.map((cardId) => (
              <CardIcon cardId={cardId} key={cardId} />
            ))}
          </div>

          <div style={{ flex: 1 }}></div>

          {gameState === 'clear-the-pile' && (
            <button onClick={clearThePile}>CLEAR THE DECK</button>
          )}

          {isPlaying &&
            gameState !== 'clear-the-pile' &&
            (player.mandatoryAction === 'pick' || illegalBlindMove) && (
              <button onClick={pick}>PICK</button>
            )}
        </div>
      </div>

      {stateRoom.error && <div className="error">{stateRoom.error.code}</div>}
    </div>
  );
}
