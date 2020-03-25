import React from 'react';
import reverse from 'lodash-es/reverse';

import { useSelector, useDispatch } from '../../../../_shared/redux/hooks';
import { GAME_ERROR_ILLEGAL_MOVE_BLIND } from '../../../../_shared/redux/game/error';
import { CardId } from '../../../../_shared/types';
import { getCardObj, getRankName } from '../../../../_shared/util';

const getSelectedCards = (
  userId: string,
  type?: 'hand' | 'open' | 'closed'
): CardId[] => {
  const cardButtons = Array.from(
    document.getElementsByClassName('card-button') as HTMLCollectionOf<
      HTMLButtonElement
    >
  );

  const selectedCards: CardId[] = [];
  cardButtons.forEach(cardButton => {
    if (
      cardButton.classList.contains('-toggled') &&
      cardButton.getAttribute('data-user-id') === userId &&
      (typeof type === 'undefined'
        ? true
        : cardButton.getAttribute('data-card-type') === type)
    ) {
      selectedCards.push(cardButton.getAttribute('data-card')! as CardId);
    }
  });

  return selectedCards;
};

const EMOJI = {
  club: '♣️',
  diamond: '♦️',
  heart: '♥️',
  spade: '♠️',
};

function CardIcon({ card, hidden }: { card: CardId; hidden?: boolean }) {
  const _hidden = hidden && !(window as any).debug;

  const cardObj = getCardObj(card);

  return (
    <div className={`card-icon ${_hidden ? '-hidden' : ''}`}>
      {!_hidden && (
        <>
          <div>{EMOJI[cardObj.suit]}</div>
          <div>{getRankName(cardObj.rank)}</div>
        </>
      )}
    </div>
  );
}

function CardButton({
  card,
  isDisabled,
  userId,
  type,
  hidden,
}: {
  card: CardId;
  isDisabled?: boolean;
  userId: string;
  type?: 'hand' | 'open' | 'closed';
  hidden?: boolean;
}) {
  return (
    <button
      className={`card-button`}
      id={`card:${card}`}
      onClick={e => {
        if (type === 'closed') {
          Array.from(document.getElementsByClassName('card-button'))
            .filter(
              btn =>
                btn.getAttribute('data-user-id') === userId &&
                btn !== e.currentTarget
            )
            .forEach(btn => {
              btn.classList.remove('-toggled');
            });
        }

        (e.currentTarget as HTMLButtonElement).classList.toggle('-toggled');
      }}
      disabled={isDisabled}
      data-card={card}
      data-user-id={userId}
      data-card-type={type}
    >
      <CardIcon card={card} hidden={hidden} />
    </button>
  );
}

export function HomeRoute() {
  const game = useSelector(state => state.game);
  const players = useSelector(state =>
    state.game.players.filter(player => !player.isFinished)
  );

  const tablePile = useSelector(state => reverse(state.game.tablePile));
  const tableDeck = useSelector(state => reverse(state.game.tableDeck));
  const tableDiscarded = useSelector(state =>
    reverse(state.game.tableDiscarded)
  );

  const dispatch = useDispatch();

  React.useEffect(() => {
    Array.from(document.getElementsByClassName('card-button')).forEach(btn =>
      btn.classList.remove('-toggled')
    );
  }, [game.currentPlayerUserId]);

  const join = (userId: string) => {
    dispatch({
      type: 'JOIN',
      userId,
    });
  };

  const joinBot = () => {
    dispatch({
      type: 'JOIN_BOT',
      botSettings: { difficulty: 'easy' },
    });
  };

  const leave = (userId: string) => {
    dispatch({
      type: 'LEAVE',
      userId,
    });
  };

  const deal = (userId: string) => {
    dispatch({
      type: 'DEAL',
      userId,
    });
  };

  const start = () => {
    dispatch({
      type: 'START',
      userId: 'a',
    });
  };

  const play = (userId: string, cards: CardId[]) => {
    dispatch({
      type: 'PLAY',
      userId,
      cards,
    });
  };

  const pick = (userId: string) => {
    dispatch({
      type: 'PICK',
      userId,
      ownCards: getSelectedCards(userId),
    });
  };

  const swap = (userId: string) => {
    dispatch({
      type: 'SWAP',
      userId,
      cardsHand: getSelectedCards(userId, 'hand'),
      cardsOpen: getSelectedCards(userId, 'open'),
    });
  };

  const clearThePile = () => {
    dispatch({
      type: 'CLEAR_THE_PILE',
    });
  };

  return (
    <div>
      <div className="stick">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button onClick={() => dispatch({ type: 'RESET' })}>reset</button>
          {game.state === 'pre-game' && <button onClick={start}>start</button>}
        </div>

        <h5>deck</h5>
        <div className="card-stack -overlap-large">
          {tableDeck.map(card => (
            <CardIcon key={card} card={card} hidden={true} />
          ))}
        </div>

        <h5>discarded</h5>
        <div className="card-stack -overlap-large">
          {tableDiscarded.map(card => (
            <CardIcon key={card} card={card} hidden={true} />
          ))}
        </div>

        <h5>pile</h5>
        <div className="card-stack -overlap">
          {tablePile.map(card => (
            <CardIcon key={card} card={card} />
          ))}
        </div>

        {game.state === 'clear-the-pile' && (
          <>
            <br />
            <button onClick={clearThePile}>CLEAR THE DECK</button>
          </>
        )}

        {game.error && (
          <>
            <br />
            <br />
            <div key={Math.random()} className="error">
              {game.error.message}
            </div>
          </>
        )}
      </div>

      {game.state === 'pre-deal' && (
        <div className="playfield">
          <input type="text" placeholder="Player ID" id="player_id" />
          <button
            onClick={() => {
              const inp = document.getElementById(
                'player_id'
              ) as HTMLInputElement;

              join(inp.value);

              // Clear input
              inp.value = '';
            }}
          >
            join
          </button>
          <br />
          <button
            onClick={() => {
              joinBot();
            }}
          >
            Add bot player
          </button>
        </div>
      )}

      {players.map(player => {
        const cardsHand = reverse(player.cardsHand);
        const cardsOpen = reverse(player.cardsOpen);
        const cardsClosed = player.cardsClosed;

        return (
          <div className="playfield" key={player.id}>
            <div className="user-header">
              <h2>
                {player.id} {player.isDealer ? '(dealer)' : ''}
              </h2>
              {game.state === 'pre-deal' && (
                <>
                  <button onClick={() => deal(player.id)}>deal</button>
                  <button onClick={() => leave(player.id)}>leave</button>
                </>
              )}
              {game.state === 'pre-game' && (
                <>
                  <button onClick={() => swap(player.id)}>swap</button>
                </>
              )}
              {game.state === 'playing' &&
                game.currentPlayerUserId === player.id && (
                  <>
                    <button onClick={() => pick(player.id)}>Pick</button>
                    <button
                      disabled={
                        game.error?.code === GAME_ERROR_ILLEGAL_MOVE_BLIND
                      }
                      onClick={() => {
                        play(player.id, getSelectedCards(player.id));
                      }}
                    >
                      Play
                    </button>
                  </>
                )}
            </div>

            {game.state === 'ended' && <h1>💩🗣 SCHEISSKOPFFFF!!!</h1>}

            {game.state !== 'ended' && (
              <div className="user-stacks">
                {cardsHand.length > 0 && (
                  <div className="card-stack -overlap">
                    {cardsHand.map(cardHand => {
                      return (
                        <CardButton
                          key={cardHand}
                          card={cardHand}
                          userId={player.id}
                          type="hand"
                          isDisabled={
                            game.state === 'pre-game'
                              ? false
                              : !(
                                  game.state === 'playing' &&
                                  game.currentPlayerUserId === player.id
                                )
                          }
                        />
                      );
                    })}
                  </div>
                )}

                {cardsOpen.length > 0 && (
                  <div className="card-stack -spaced">
                    {cardsOpen.map(card => {
                      return (
                        <CardButton
                          key={card}
                          card={card}
                          userId={player.id}
                          type="open"
                          isDisabled={
                            game.state === 'pre-game'
                              ? false
                              : !(
                                  game.state === 'playing' &&
                                  game.currentPlayerUserId === player.id &&
                                  player.cardsHand.length === 0
                                )
                          }
                        />
                      );
                    })}
                  </div>
                )}

                {cardsClosed.length > 0 && (
                  <div className="card-stack -spaced">
                    {cardsClosed.map(card => {
                      return (
                        <CardButton
                          key={card}
                          card={card}
                          userId={player.id}
                          type="closed"
                          hidden={true}
                          isDisabled={
                            !(
                              game.state === 'playing' &&
                              game.currentPlayerUserId === player.id &&
                              player.cardsHand.length === 0 &&
                              player.cardsOpen.length === 0
                            ) ||
                            (game.state === 'playing' &&
                              game.currentPlayerUserId === player.id &&
                              game.error?.code ===
                                GAME_ERROR_ILLEGAL_MOVE_BLIND)
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
