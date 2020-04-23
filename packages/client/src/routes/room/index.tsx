import React from 'react';
import _ from 'lodash';

import { CardId } from '../../../../_shared/types';

import { useSelector, useDispatch } from '../../redux/hooks';

import { CardIcon } from '../../components/card-icon';
import { CardButton } from '../../components/card-button';
import { Redirect } from 'react-router-dom';
import { useSocket } from '../../socket';

export function RoomRoute() {
  const { getEmitter } = useSocket();

  const stateRoom = useSelector((state) => state.room);
  const session = useSelector((state) => state.client.session);
  const dispatch = useDispatch();

  if (!(stateRoom && stateRoom.player.userId === session?.userId)) {
    return <Redirect to="/join" />;
  }

  const emitAction = getEmitter('ACTION_ROOM');

  const deal = () => {
    emitAction({
      type: 'DEAL',
    });
  };

  const leave = () => {
    emitAction({
      type: 'LEAVE',
    });
    dispatch({ type: 'LEAVE_ROOM' });
  };

  // const swap = (cardsHand: CardId[], cardsOpen: CardId[]) => {
  //   emitAction({
  //     type: 'SWAP',
  //     cardsHand,
  //     cardsOpen,
  //   });
  // };

  const play = (cardId: CardId) => {
    emitAction({
      type: 'PLAY',
      cards: [cardId],
    });
  };

  const start = () => {
    emitAction({
      type: 'START',
    });
  };

  const isPlaying = stateRoom.currentPlayerUserId === stateRoom.player.userId;

  return (
    <>
      <div className="stick pad">
        <div className="header">
          <h1 style={{ flex: 1 }}>
            Room code: <code>{stateRoom.roomId}</code>
          </h1>

          {stateRoom.state === 'pre-deal' && (
            <button onClick={deal}>deal</button>
          )}
          {stateRoom.state === 'pre-game' && (
            <button onClick={start}>start</button>
          )}
          <button onClick={leave}>leave</button>
        </div>

        <div style={{ display: 'flex' }}>
          <div className="deck" style={{ flex: 1 }}>
            {/* TODO: pick from deck manually */}
            <div className="card-stack -overlap-large">
              {Array.from(Array(stateRoom.cardsDeckCount)).map((_, idx) => (
                <CardButton key={idx} />
              ))}
            </div>
          </div>

          <div className="discarded" style={{ flex: 1 }}>
            <div className="card-stack -overlap-large">
              {Array.from(Array(stateRoom.cardsDiscardedCount)).map(
                (_, idx) => (
                  <CardIcon key={idx} />
                )
              )}
            </div>
          </div>
        </div>

        <div className="pile" style={{ marginTop: '16px' }}>
          <div className="card-stack -overlap">
            {stateRoom.cardsPile.map((cardId) => (
              <CardIcon cardId={cardId} key={cardId} />
            ))}
          </div>

          <div style={{ flex: 1 }}></div>

          {stateRoom.state === 'clear-the-pile' && (
            <button onClick={() => emitAction({ type: 'CLEAR_THE_PILE' })}>
              CLEAR THE DECK
            </button>
          )}

          {isPlaying &&
            stateRoom.state !== 'clear-the-pile' &&
            stateRoom.player.mandatoryAction === 'pick' && (
              <button onClick={() => emitAction({ type: 'PICK' })}>PICK</button>
            )}
        </div>
      </div>

      {/* SELF */}
      <div className={`player pad ${isPlaying ? '-highlight' : ''}`}>
        <h2>
          You: {stateRoom.player.name} <code>{stateRoom.player.userId}</code>
        </h2>

        <div>
          <h5>Closed</h5>
          <div className="card-stack -spaced">
            {Array.from(Array(stateRoom.player.cardsClosedCount)).map(
              (_, idx) => (
                <CardButton
                  key={idx}
                  disabled={
                    !isPlaying ||
                    stateRoom.player.cardsOpen.length > 0 ||
                    stateRoom.player.cardsHand.length > 0
                  }
                />
              )
            )}
          </div>
        </div>

        <div>
          <h5>Open</h5>
          <div className="card-stack -spaced">
            {stateRoom.player.cardsOpen.map((cardId) => (
              <CardButton
                key={cardId}
                cardId={cardId}
                disabled={!isPlaying || stateRoom.player.cardsHand.length > 0}
                onClick={() => play(cardId)}
              />
            ))}
          </div>
        </div>

        <div>
          <h5>Hand</h5>
          <div className="card-stack -spaced">
            {stateRoom.player.cardsHand.map((cardId) => (
              <CardButton
                key={cardId}
                cardId={cardId}
                disabled={!isPlaying}
                onClick={() => play(cardId)}
              />
            ))}
          </div>
        </div>
      </div>

      <hr />

      <div className="pad">
        <h2>Players</h2>

        {stateRoom.opponents.map((opponent, idx) => {
          return (
            <div
              className={`player ${
                stateRoom.currentPlayerUserId === opponent.userId
                  ? '-highlight'
                  : ''
              }`}
              key={idx}
            >
              <h3>
                {opponent.name} <code>{opponent.userId}</code>
              </h3>

              <div>
                <h5>Closed</h5>
                {Array.from(Array(opponent.cardsClosedCount)).map((_, idx) => (
                  <CardIcon key={idx} />
                ))}
              </div>

              <div>
                <h5>Open</h5>
                {opponent.cardsOpen.map((cardId) => (
                  <CardIcon cardId={cardId} />
                ))}
              </div>

              <div>
                <h5>Hand</h5>
                {Array.from(Array(opponent.cardsHandCount)).map((_, idx) => (
                  <CardIcon key={idx} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
