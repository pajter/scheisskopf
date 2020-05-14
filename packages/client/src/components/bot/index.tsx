import React from 'react';
import _ from 'lodash';

import { Bot, CardId } from '../../../../_shared/types';

import { useSelector } from '../../redux/hooks';

import { CardIcon } from '../../components/card-icon';
import { useSocket } from '../../socket';

export function Bot(props: { userId: string }) {
  const { getEmitter, emit } = useSocket();

  const stateRoom = useSelector((state) => state.room);
  const playersCount = useSelector((state) => state.room.players.length);
  const player = useSelector((state) =>
    state.room.players.find((u) => u.userId === props.userId)
  )!;

  const emitAction = getEmitter('ACTION_ROOM');

  const gameState = stateRoom.state;

  const mayStart =
    gameState === 'pre-game' && player.hasStartingCard && player.turns === 0;

  const isPlaying =
    (stateRoom.currentPlayerUserId === player.userId &&
      gameState === 'playing') ||
    mayStart;

  const playableCardsOpen = player.cardsOpen.filter(
    (c) => c !== null
  ) as CardId[];

  const deal = () =>
    emitAction({
      type: 'DEAL',
    });

  const removeBot = () => {
    emit('REMOVE_BOT', { botId: props.userId, roomId: stateRoom.roomId });
  };

  return (
    <div
      className={`player ${isPlaying ? '-highlight' : ''} ${
        player.isFinished ? '-highlight-finished' : ''
      }`}
    >
      <div
        style={{ display: 'flex', marginBottom: '16px', alignItems: 'center' }}
      >
        <h2>
          {player.name} {player.isDealer ? '🎲' : ''}
          {player.isFinished ? '🥳' : player.isScheisskopf ? '💩' : ''}
        </h2>

        <div style={{ flex: 1 }}></div>

        {player.isDealer &&
          playersCount > 1 &&
          (gameState === 'pre-deal' || gameState === 'ended') && (
            <button onClick={deal}>Deal</button>
          )}

        {(gameState === 'pre-deal' || gameState === 'ended') && (
          <button onClick={removeBot}>Remove</button>
        )}
      </div>

      {player.isScheisskopf && gameState === 'ended' ? (
        <div>
          <h1>💩 SCHEISSKOPF! 💩</h1>
        </div>
      ) : null}

      {!player.isFinished && (
        <div className="user-stacks scroll">
          {/* Hand */}
          <div
            className={`card-stack -overlap-small -reverse ${
              player.cardsHand.length === 0 ? '-empty' : ''
            }`}
          >
            {[...player.cardsHand].sort().map((cardId, idx) => {
              if (cardId === null) {
                return <CardIcon key={idx} />;
              }

              return <CardIcon key={cardId} cardId={cardId} />;
            })}
          </div>

          {/* Open */}
          <div
            className={`card-stack -spaced ${
              playableCardsOpen.length === 0 ? '-empty' : ''
            }`}
          >
            {_.reverse([...player.cardsOpen]).map((cardId, idx) => {
              if (cardId === null) {
                return <CardIcon key={idx} cardId={cardId} />;
              }

              return <CardIcon key={cardId} cardId={cardId} />;
            })}
          </div>

          {/* Blind */}
          <div
            className={`card-stack -spaced ${
              player.cardsBlind.length === 0 ? '-empty' : ''
            }`}
          >
            {player.cardsBlind.map((idx, key) => {
              if (idx === null) {
                return (
                  <CardIcon
                    key={key}
                    cardId={idx === null ? null : undefined}
                  />
                );
              }

              return <CardIcon key={key} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
