import React from 'react';
import { useSelector, useDispatch } from '../../redux/hooks';
import { getCardId, getCardFromId, getCardSortFn } from '../../util';
import { Card } from '../../types';

const horStyle = { display: 'flex', justifyContent: 'space-between' };

export function HomeRoute() {
  const game = useSelector(state => state.game);
  const users = useSelector(state => state.game.players);

  const tablePile = useSelector(state => state.game.tablePile);
  const tableDeck = useSelector(state => state.game.tableDeck);
  const tableDiscarded = useSelector(state => state.game.tableDiscarded);

  const dispatch = useDispatch();

  const deal = () => {
    dispatch({
      type: 'DEAL',
      userId: 'a',
      gameUsers: [
        { id: 'a', position: 0 },
        { id: 'b', position: 1 },
        { id: 'c', position: 2 },
        { id: 'd', position: 3 },
      ],
    });
  };

  const start = () => {
    dispatch({
      type: 'START',
      userId: 'a',
    });
  };

  const play = (userId: string, cards: Card[]) => {
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
    });
  };

  const swap = (userId: string, cardFromHand: Card, cardFromOpen: Card) => {
    dispatch({
      type: 'SWITCH_CARD',
      userId,
      cardFromHand,
      cardFromOpen,
    });
  };

  return (
    <div>
      <button onClick={deal}>deal</button>
      {game.state === 'pre-game' && <button onClick={start}>start</button>}

      <h1>Game</h1>
      <pre>state: {game.state}</pre>
      <pre>dealerUserId: {JSON.stringify(game.dealerUserId)}</pre>
      <pre>currentPlayerId: {JSON.stringify(game.currentPlayerUserId)}</pre>
      <pre>
        startingCard:{' '}
        {game.startingCard ? getCardId(game.startingCard) : 'null'}
      </pre>
      <pre>error: {game.error ? game.error.message : 'null'}</pre>

      <div style={horStyle}>
        <div>
          <h5>pile</h5>
          {tablePile.map(card => (
            <pre key={getCardId(card)}>{getCardId(card)}</pre>
          ))}
        </div>
        <div>
          <h5>deck</h5>
          {tableDeck.map(card => (
            <pre key={getCardId(card)}>{getCardId(card)}</pre>
          ))}
        </div>
        <div>
          <h5>discarded</h5>
          {tableDiscarded.map(card => (
            <pre key={getCardId(card)}>{getCardId(card)}</pre>
          ))}
        </div>
      </div>

      {users.map(user => {
        if (
          user.cardsClosed.length === 0 &&
          user.cardsOpen.length === 0 &&
          user.cardsHand.length === 0
        ) {
          // User is done
          return null;
        }

        return (
          <div key={user.id}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1>{user.id}</h1>
              {game.state === 'playing' &&
                game.currentPlayerUserId === user.id && (
                  <>
                    <button onClick={() => pick(user.id)}>Pick</button>
                    <button
                      onClick={() => {
                        const cardCheckboxes = document.getElementsByName(
                          `${user.id}`
                        ) as NodeListOf<HTMLInputElement>;
                        const selectedCards: Card[] = [];
                        cardCheckboxes.forEach(cardCheckbox => {
                          if (cardCheckbox.checked) {
                            selectedCards.push(
                              getCardFromId(cardCheckbox.value)
                            );
                          }
                        });

                        play(user.id, selectedCards);
                      }}
                    >
                      Play
                    </button>
                  </>
                )}
            </div>
            <div style={horStyle}>
              <div>
                <h5>hand</h5>
                {user.cardsHand.sort(getCardSortFn()).map(cardHand => {
                  const cardHandId = getCardId(cardHand);
                  return (
                    <pre
                      style={{ display: 'flex', alignItems: 'center' }}
                      key={cardHandId}
                    >
                      {cardHandId}

                      {game.state === 'pre-game' && (
                        <>
                          <select id={`${user.id}:${cardHandId}`}>
                            {user.cardsOpen.map(cardOpen => {
                              const cardOpenId = getCardId(cardOpen);
                              return (
                                <option key={cardOpenId} value={cardOpenId}>
                                  {cardOpenId}
                                </option>
                              );
                            })}
                          </select>
                          <button
                            onClick={() => {
                              const cardOpen = getCardFromId(
                                (document.getElementById(
                                  `${user.id}:${cardHandId}`
                                ) as HTMLSelectElement).value
                              );

                              swap(user.id, cardHand, cardOpen);
                            }}
                          >
                            swap
                          </button>
                        </>
                      )}

                      {game.state === 'playing' &&
                        game.currentPlayerUserId === user.id && (
                          <input
                            type="checkbox"
                            name={`${user.id}`}
                            value={`${cardHandId}`}
                          />
                        )}
                    </pre>
                  );
                })}
              </div>
              <div>
                <h5>open</h5>
                {user.cardsOpen.sort(getCardSortFn()).map(card => {
                  const cardId = getCardId(card);
                  return (
                    <pre
                      key={cardId}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      {cardId}

                      {game.state === 'playing' &&
                        game.currentPlayerUserId === user.id &&
                        user.cardsHand.length === 0 && (
                          <input
                            type="checkbox"
                            name={`${user.id}`}
                            value={`${cardId}`}
                          />
                        )}
                    </pre>
                  );
                })}
              </div>
              <div>
                <h5>closed</h5>
                {user.cardsClosed.map(card => (
                  <pre
                    key={getCardId(card)}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    {getCardId(card)}

                    {game.state === 'playing' &&
                      game.currentPlayerUserId === user.id &&
                      user.cardsOpen.length === 0 && (
                        <button onClick={() => play(user.id, [card])}>
                          play
                        </button>
                      )}
                  </pre>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
