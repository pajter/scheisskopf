import React from 'react';
import reverse from 'lodash-es/reverse';
import { useSelector, useDispatch } from '../../redux/hooks';
import { getCardObj, getRankName } from '../../util';
import { CardId } from '../../types';
import { GAME_ERROR_ILLEGAL_MOVE_BLIND } from '../../redux/game/error';

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

  const deal = () => {
    dispatch({
      type: 'DEAL',
      userId: 'a',
      players: [
        { id: 'a', position: 0 },
        { id: 'b', position: 1 },
        { id: 'c', position: 2 },
        { id: 'd', position: 3 },
        { id: 'e', position: 4 },
      ],
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
      type: 'SWAP_CARDS',
      userId,
      cardsHand: getSelectedCards(userId, 'hand'),
      cardsOpen: getSelectedCards(userId, 'open'),
    });
  };

  return (
    <div>
      <div className="stick">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={deal}>deal</button>
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

      {players.map(user => {
        const cardsHand = reverse(user.cardsHand.sort());
        const cardsOpen = reverse(user.cardsOpen.sort());
        const cardsClosed = user.cardsClosed;
        return (
          <div className="playfield" key={user.id}>
            <div className="user-header">
              <h2>{user.id}</h2>
              {game.state === 'pre-game' && (
                <>
                  <button onClick={() => swap(user.id)}>swap</button>
                </>
              )}
              {game.state === 'playing' &&
                game.currentPlayerUserId === user.id && (
                  <>
                    <button onClick={() => pick(user.id)}>Pick</button>
                    <button
                      disabled={
                        game.error?.code === GAME_ERROR_ILLEGAL_MOVE_BLIND
                      }
                      onClick={() => {
                        play(user.id, getSelectedCards(user.id));
                      }}
                    >
                      Play
                    </button>
                  </>
                )}
            </div>

            {game.state === 'ended' && <h1>💩🗣 SCHEISKOPFFFF!!!</h1>}

            {game.state !== 'ended' && (
              <div className="user-stacks">
                {cardsHand.length > 0 && (
                  <div className="card-stack -overlap">
                    {cardsHand.map(cardHand => {
                      return (
                        <CardButton
                          key={cardHand}
                          card={cardHand}
                          userId={user.id}
                          type="hand"
                          isDisabled={
                            game.state === 'pre-game'
                              ? false
                              : !(
                                  game.state === 'playing' &&
                                  game.currentPlayerUserId === user.id
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
                          userId={user.id}
                          type="open"
                          isDisabled={
                            game.state === 'pre-game'
                              ? false
                              : !(
                                  game.state === 'playing' &&
                                  game.currentPlayerUserId === user.id &&
                                  user.cardsHand.length === 0
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
                          userId={user.id}
                          type="closed"
                          hidden={true}
                          isDisabled={
                            !(
                              game.state === 'playing' &&
                              game.currentPlayerUserId === user.id &&
                              user.cardsHand.length === 0 &&
                              user.cardsOpen.length === 0
                            ) ||
                            (game.state === 'playing' &&
                              game.currentPlayerUserId === user.id &&
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
