import React from 'react';
import _ from 'lodash';

import { useSelector, useDispatch } from '../../redux/hooks';

import { CardIcon } from '../../components/card-icon';
import { CardButton } from '../../components/card-button';
import { Redirect } from 'react-router-dom';
import { useSocket } from '../../socket';
import { PlayerBase } from '../../../../_shared/types';

export function RoomRoute() {
  const { getEmitter } = useSocket();

  const stateRoom = useSelector((state) => state.room);
  const selectedCardIds = useSelector((state) => state.client.selectedCardIds);
  const session = useSelector((state) => state.client.session);
  const dispatch = useDispatch();

  if (!(stateRoom && stateRoom.player.userId === session?.userId)) {
    return <Redirect to="/join" />;
  }

  const player = stateRoom.player;
  const gameState = stateRoom.state;
  const allPlayers = [...stateRoom.opponents, player];

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

  const swap = () => {
    emitAction({
      type: 'SWAP',
      cardsHand: selectedCardIds.hand,
      cardsOpen: selectedCardIds.open,
    });
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

  const start = () => {
    emitAction({
      type: 'START',
    });
  };

  const isPlaying = stateRoom.currentPlayerUserId === player.userId;
  const illegalBlindMove = stateRoom.error?.code === 'E_ILLEGAL_MOVE_BLIND';

  const isDealer = player.isDealer || !allPlayers.find((p) => p.isDealer);

  const isScheisskopf = (player: PlayerBase): boolean => {
    if (allPlayers.length === 1) {
      return false;
    }
    if (player.isFinished) {
      return false;
    }
    const unfinished = allPlayers.filter((p) => !p.isFinished);
    return unfinished.length === 1 && !player.isFinished;
  };

  const scheisskopf = (
    <div>
      <h1>💩 SCHEISSKOPF! 💩</h1>
    </div>
  );

  return (
    <>
      <div className="stick pad">
        <div className="header">
          <h1 style={{ flex: 1 }}>
            Room code: <code>{stateRoom.roomId}</code>
          </h1>

          {(gameState === 'pre-deal' || gameState === 'ended') &&
            isDealer &&
            allPlayers.length > 1 && <button onClick={deal}>deal</button>}
          {gameState === 'pre-game' && <button onClick={start}>start</button>}
          <button onClick={leave}>leave</button>
        </div>

        <div style={{ display: 'flex' }}>
          <div className="deck" style={{ flex: 1 }}>
            {/* TODO: pick from deck manually */}
            <h6>Deck</h6>
            <div className="card-stack -overlap-large">
              {Array.from(Array(stateRoom.cardsDeckCount)).map((_, idx) => (
                <CardButton key={idx} />
              ))}
            </div>
          </div>

          <div className="discarded" style={{ flex: 1 }}>
            <h6>Discarded</h6>
            <div className="card-stack -overlap-large">
              {Array.from(Array(stateRoom.cardsDiscardedCount)).map(
                (_, idx) => (
                  <CardIcon key={idx} />
                )
              )}
            </div>
          </div>
        </div>

        {illegalBlindMove && <h2>SUKKELLLLLL</h2>}

        <div className="pile" style={{ marginTop: '16px' }}>
          <div className="card-stack -overlap">
            {stateRoom.cardsPile.map((cardId) => (
              <CardIcon cardId={cardId} key={cardId} />
            ))}
          </div>

          <div style={{ flex: 1 }}></div>

          {gameState === 'clear-the-pile' && (
            <button onClick={() => emitAction({ type: 'CLEAR_THE_PILE' })}>
              CLEAR THE DECK
            </button>
          )}

          {isPlaying &&
            gameState !== 'clear-the-pile' &&
            (player.mandatoryAction === 'pick' || illegalBlindMove) && (
              <button onClick={pick}>PICK</button>
            )}
        </div>
      </div>

      {/* SELF */}
      <div
        className={`player pad ${isPlaying ? '-highlight' : ''} ${
          player.isFinished ? '-highlight-finished' : ''
        }`}
      >
        <h2>
          {player.name} {player.isFinished ? '🥳' : ''}
        </h2>

        {isPlaying &&
          (player.cardsHand.length > 0 || player.cardsOpen.length > 0) &&
          player.mandatoryAction !== 'pick' &&
          gameState === 'playing' && (
            <button
              onClick={play}
              disabled={
                player.cardsHand.length
                  ? selectedCardIds.hand.length === 0
                  : player.cardsOpen.length
                  ? selectedCardIds.open.length === 0
                  : false
              }
            >
              Play
            </button>
          )}

        {gameState === 'pre-game' && <button onClick={swap}>Swap</button>}

        {isScheisskopf(player) ? scheisskopf : null}

        {!player.isFinished && (
          <>
            <div>
              <h5>Blind</h5>
              <div className="card-stack -spaced">
                {player.cardsBlind.map((idx, key) =>
                  idx === null ? (
                    <div style={{ width: '16px', height: '16px' }}>&nbsp;</div>
                  ) : (
                    <CardButton
                      key={key}
                      onClick={() => {
                        playBlind(idx);
                      }}
                      disabled={
                        !isPlaying ||
                        player.cardsOpen.length > 0 ||
                        player.cardsHand.length > 0 ||
                        illegalBlindMove ||
                        gameState === 'clear-the-pile'
                      }
                    />
                  )
                )}
              </div>
            </div>

            <div>
              <h5>Open</h5>
              <div className="card-stack -spaced">
                {player.cardsOpen
                  .sort()
                  .reverse()
                  .map((cardId) => (
                    <CardButton
                      key={cardId}
                      cardId={cardId}
                      disabled={
                        gameState == 'pre-game'
                          ? false
                          : !isPlaying ||
                            player.cardsHand.length > 0 ||
                            gameState === 'clear-the-pile'
                      }
                      stack="open"
                    />
                  ))}
              </div>
            </div>

            <div className="scroll">
              <h5>Hand</h5>
              <div className="card-stack -spaced">
                {player.cardsHand
                  .sort()
                  .reverse()
                  .map((cardId) => (
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
                  ))}
              </div>
            </div>
          </>
        )}
      </div>

      <hr />

      <div className="pad">
        {stateRoom.opponents.map((opponent, idx) => {
          return (
            <div
              key={idx}
              className={`player ${
                stateRoom.currentPlayerUserId === opponent.userId
                  ? '-highlight'
                  : ''
              } ${opponent.isFinished ? '-highlight-finished' : ''}`}
            >
              <h2>
                {opponent.name} {opponent.isFinished ? '😌' : ''}
              </h2>

              {isScheisskopf(opponent) ? scheisskopf : null}

              {!opponent.isFinished && (
                <>
                  <div>
                    <h5>Blind</h5>
                    <div className="card-stack -spaced">
                      {Array.from(Array(opponent.cardsBlindCount))
                        .sort()
                        .map((_, idx) => (
                          <CardIcon key={idx} />
                        ))}
                    </div>
                  </div>

                  <div>
                    <h5>Open</h5>
                    <div className="card-stack -spaced">
                      {opponent.cardsOpen
                        .sort()
                        .reverse()
                        .map((cardId) => (
                          <CardIcon key={cardId} cardId={cardId} />
                        ))}
                    </div>
                  </div>

                  <div className="scroll">
                    <h5>Hand</h5>
                    <div className="card-stack -spaced">
                      {Array.from(Array(opponent.cardsHandCount)).map(
                        (_, idx) => (
                          <CardIcon key={idx} />
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
