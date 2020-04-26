import React from 'react';
import _ from 'lodash';

import { useSelector, useDispatch } from '../../redux/hooks';

import { CardIcon } from '../../components/card-icon';
import { CardButton } from '../../components/card-button';
import { useSocket } from '../../socket';
import { Player } from '../../../../_shared/types';

export function Player(props: { userId: string }) {
  const { getEmitter } = useSocket();

  const dispatch = useDispatch();

  const userId = useSelector((state) => state.client.session?.userId);
  const roomError = useSelector((state) => state.client.roomError);
  const stateRoom = useSelector((state) => state.room);
  const playersCount = useSelector((state) => state.room.players.length);
  const player = useSelector((state) =>
    state.room.players.find((u) => u.userId === props.userId)
  )!;
  const selectedCardIds = useSelector((state) => state.client.selectedCardIds);

  const emitAction = getEmitter('ACTION_ROOM');

  const gameState = stateRoom.state;
  const isOpponent = player.userId !== userId;
  const isPlaying = stateRoom.currentPlayerUserId === player.userId;

  const illegalBlindMove = stateRoom.error?.code === 'E_ILLEGAL_MOVE_BLIND';

  const canPlay =
    stateRoom.error?.code === 'E_ILLEGAL_MOVE_BLIND'
      ? false
      : gameState === 'pre-game' && player.hasStartingCard
      ? true
      : isPlaying &&
        player.mandatoryAction !== 'pick' &&
        gameState === 'playing' &&
        (player.cardsHand.length > 0 || player.cardsOpen.length > 0);

  const deal = () => {
    emitAction({
      type: 'DEAL',
    });
  };

  const swap = () => {
    emitAction({
      type: 'SWAP',
      cardsHand: selectedCardIds.hand,
      cardsOpen: selectedCardIds.open,
    });
    dispatch({ type: 'CLEAR_CARD_SELECTION' });
  };

  const play = () => {
    const cards = player.cardsHand.length
      ? selectedCardIds.hand
      : player.cardsOpen.length
      ? selectedCardIds.open
      : null;
    if (cards === null) {
      return;
    }

    emitAction({
      type: 'PLAY',
      cards,
    });
    dispatch({ type: 'CLEAR_CARD_SELECTION' });
  };

  const playBlind = (idx: number) => {
    emitAction({
      type: 'PLAY_BLIND',
      idx,
    });
  };

  const pick = () => {
    emitAction({ type: 'PICK', ownCards: selectedCardIds.open });
    dispatch({ type: 'CLEAR_CARD_SELECTION' });
  };

  const clearThePile = () => {
    emitAction({ type: 'CLEAR_THE_PILE' });
  };

  return (
    <div
      className={`player pad ${isPlaying ? '-highlight' : ''} ${
        player.isFinished ? '-highlight-finished' : ''
      }`}
    >
      <div
        style={{ display: 'flex', marginBottom: '16px', alignItems: 'center' }}
      >
        <h2>
          {player.name} {player.isDealer ? '🎲' : ''}{' '}
          {player.isFinished ? '🥳' : player.isScheisskopf ? '💩' : ''}
        </h2>

        <div style={{ flex: 1 }}></div>

        {!isOpponent && (
          <>
            {canPlay && (
              <button
                onClick={play}
                disabled={
                  player.cardsHand.length
                    ? selectedCardIds.hand.length === 0
                    : player.cardsOpen.filter((c) => c !== null).length
                    ? selectedCardIds.open.length === 0
                    : false
                }
              >
                Play
              </button>
            )}

            {gameState === 'clear-the-pile' && (
              <button onClick={clearThePile}>CLEAR THE DECK</button>
            )}

            {isPlaying &&
              gameState !== 'clear-the-pile' &&
              (player.mandatoryAction === 'pick' || illegalBlindMove) && (
                <button onClick={pick}>PICK</button>
              )}

            {gameState === 'pre-game' ||
              (player.turns === 0 && <button onClick={swap}>Swap</button>)}

            {player.isDealer &&
              playersCount > 1 &&
              (gameState === 'pre-deal' || gameState === 'ended') && (
                <button onClick={deal}>Deal</button>
              )}
          </>
        )}
      </div>

      {!isOpponent && roomError && (
        <div className="error" style={{ marginBottom: '16px' }}>
          {roomError.message}
        </div>
      )}

      {player.isScheisskopf && gameState === 'ended' ? (
        <div>
          <h1>💩 SCHEISSKOPF! 💩</h1>
        </div>
      ) : null}

      {!player.isFinished && (
        <div className="user-stacks scroll">
          {/* Hand */}
          <div className="card-stack -spaced">
            {[...player.cardsHand]
              .sort()
              .reverse()
              .map((cardId, idx) => {
                if (cardId === null) {
                  return <CardIcon key={idx} />;
                }

                return (
                  <CardButton
                    key={cardId}
                    cardId={cardId}
                    disabled={
                      gameState === 'pre-game'
                        ? false
                        : !isPlaying ||
                          gameState === 'clear-the-pile' ||
                          gameState !== 'playing'
                    }
                    stack="hand"
                  />
                );
              })}
          </div>

          {/* Open */}
          <div
            className={`card-stack -spaced ${
              player.cardsOpen.filter((c) => c !== null).length === 0
                ? '-empty'
                : ''
            }`}
          >
            {_.reverse([...player.cardsOpen]).map((cardId, idx) =>
              cardId === null ? (
                <CardIcon key={idx} cardId={null} />
              ) : (
                <CardButton
                  key={cardId}
                  cardId={cardId}
                  disabled={
                    isOpponent ||
                    (gameState == 'pre-game'
                      ? false
                      : !isPlaying ||
                        player.cardsHand.length > 0 ||
                        gameState === 'clear-the-pile')
                  }
                  stack="open"
                />
              )
            )}
          </div>

          {/* Blind */}
          <div className="card-stack -spaced">
            {player.cardsBlind.map((idx, key) => {
              if (idx === null) {
                return <CardIcon key={key} cardId={null} />;
              }

              return (
                <CardButton
                  key={key}
                  onClick={() => playBlind(idx)}
                  disabled={
                    isOpponent ||
                    !isPlaying ||
                    player.cardsOpen.filter((c) => c !== null).length > 0 ||
                    player.cardsHand.length > 0 ||
                    illegalBlindMove ||
                    gameState === 'clear-the-pile'
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
