import React from 'react';
import _ from 'lodash';

import { Player, CardId } from '../../../../_shared/types';

import { useSelector, useDispatch } from '../../redux/hooks';

import { CardIcon } from '../../components/card-icon';
import { CardButton } from '../../components/card-button';
import { useSocket } from '../../socket';

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
  const illegalBlindMove = stateRoom.error?.code === 'E_ILLEGAL_MOVE_BLIND';
  const isOpponent = player.userId !== userId;

  const mayStart =
    gameState === 'pre-game' && player.hasStartingCard && player.turns === 0;

  const isPlaying =
    (stateRoom.currentPlayerUserId === player.userId &&
      gameState === 'playing') ||
    mayStart;

  const canSwap =
    !isOpponent &&
    (gameState === 'pre-game' ||
      (gameState === 'playing' && player.turns === 0));

  const playerMustPick = player.mandatoryAction === 'pick' || illegalBlindMove;

  const playableCardsOpen = player.cardsOpen.filter(
    (c) => c !== null
  ) as CardId[];

  const canPlay = (): boolean => {
    if (!isPlaying) {
      return false;
    }
    if (playerMustPick) {
      return false;
    }
    if (isOpponent) {
      return false;
    }
    if (mayStart) {
      return true;
    }
    if (gameState !== 'playing') {
      return false;
    }
    return player.cardsHand.length > 0 || playableCardsOpen.length > 0;
  };

  const deal = () =>
    emitAction({
      type: 'DEAL',
    });

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

  const playBlind = (idx: number) =>
    emitAction({
      type: 'PLAY_BLIND',
      idx,
    });

  const pick = () => {
    emitAction({ type: 'PICK', ownCards: selectedCardIds.open });
    dispatch({ type: 'CLEAR_CARD_SELECTION' });
  };

  const clearThePile = () => emitAction({ type: 'CLEAR_THE_PILE' });

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
          {player.name} {player.isDealer ? '🎲' : ''}{' '}
          {player.isFinished ? '🥳' : player.isScheisskopf ? '💩' : ''}
        </h2>

        <div style={{ flex: 1 }}></div>

        {!isOpponent && (
          <>
            {canPlay() && (
              <button
                onClick={play}
                disabled={
                  player.cardsHand.length
                    ? selectedCardIds.hand.length === 0
                    : playableCardsOpen.length
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

            {isPlaying && gameState !== 'clear-the-pile' && playerMustPick && (
              <button onClick={pick}>PICK</button>
            )}

            {canSwap && <button onClick={swap}>Swap</button>}

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
          <div
            className={`card-stack -overlap-small ${
              player.cardsHand.length === 0 ? '-empty' : ''
            }`}
          >
            {[...player.cardsHand]
              .sort()

              .map((cardId, idx) => {
                if (cardId === null || isOpponent) {
                  return <CardIcon key={idx} />;
                }

                return (
                  <CardButton
                    key={cardId}
                    cardId={cardId}
                    verifySelection={!canSwap}
                    disabled={
                      canSwap
                        ? false
                        : !isPlaying ||
                          playerMustPick ||
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
              playableCardsOpen.length === 0 ? '-empty' : ''
            }`}
          >
            {_.reverse([...player.cardsOpen]).map((cardId, idx) => {
              if (cardId === null || isOpponent) {
                return <CardIcon key={idx} cardId={cardId} />;
              }

              return (
                <CardButton
                  key={cardId}
                  cardId={cardId}
                  verifySelection={!canSwap}
                  disabled={
                    canSwap
                      ? false
                      : isOpponent ||
                        !isPlaying ||
                        playerMustPick ||
                        player.cardsHand.length > 0 ||
                        gameState === 'clear-the-pile'
                  }
                  stack="open"
                />
              );
            })}
          </div>

          {/* Blind */}
          <div
            className={`card-stack -spaced ${
              player.cardsBlind.length === 0 ? '-empty' : ''
            }`}
          >
            {player.cardsBlind.map((idx, key) => {
              if (idx === null || isOpponent) {
                return (
                  <CardIcon
                    key={key}
                    cardId={idx === null ? null : undefined}
                  />
                );
              }

              return (
                <CardButton
                  key={key}
                  onClick={() => playBlind(idx)}
                  disabled={
                    isOpponent ||
                    !isPlaying ||
                    playerMustPick ||
                    playableCardsOpen.length > 0 ||
                    player.cardsHand.length > 0 ||
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
