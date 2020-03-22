import React from 'react';
import { useSelector, useDispatch } from '../../redux/hooks';
import { getCardId, getCardFromId } from '../../redux/game/util';
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
      <button onClick={start}>start</button>

      <h1>debug</h1>
      <pre>
        card count:{' '}
        {tableDeck.length +
          users.reduce((acc, { cardsClosed, cardsOpen, cardsHand }) => {
            acc += cardsClosed.length + cardsOpen.length + cardsHand.length;
            return acc;
          }, 0)}
        <br />
        state: {game.state}
        <br />
        dealerUserId: {JSON.stringify(game.dealerUserId)}
        <br />
        currentPlayerId: {JSON.stringify(game.currentPlayerUserId)}
      </pre>

      <div style={horStyle}>
        <div>
          <h5>pile</h5>
          {tablePile.map(card => (
            <pre>{getCardId(card)}</pre>
          ))}
        </div>
        <div>
          <h5>deck</h5>
          {tableDeck.map(card => (
            <pre>{getCardId(card)}</pre>
          ))}
        </div>
        <div>
          <h5>discarded</h5>
          {tableDiscarded.map(card => (
            <pre>{getCardId(card)}</pre>
          ))}
        </div>
      </div>

      {users.map(user => {
        return (
          <div key={user.id}>
            <h1>{user.id}</h1>
            <div style={horStyle}>
              <div>
                <h5>hand</h5>
                {user.cardsHand.map(cardHand => {
                  const cardHandId = getCardId(cardHand);
                  return (
                    <pre
                      style={{ display: 'flex', alignItems: 'center' }}
                      key={cardHandId}
                    >
                      {cardHandId}

                      {game.state === 'pre-game' && (
                        <>
                          <select name={`${user.id}:${cardHandId}`}>
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
                                (document.getElementsByName(
                                  `${user.id}:${cardHandId}`
                                )[0] as HTMLSelectElement).value
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
                          <button onClick={() => play(user.id, [cardHand])}>
                            play
                          </button>
                        )}
                    </pre>
                  );
                })}
              </div>
              <div>
                <h5>open</h5>
                {user.cardsOpen.map(card => (
                  <pre>{getCardId(card)}</pre>
                ))}
              </div>
              <div>
                <h5>closed</h5>
                {user.cardsClosed.map(card => (
                  <pre>{getCardId(card)}</pre>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
