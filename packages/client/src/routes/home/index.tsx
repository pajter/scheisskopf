import React from 'react';
import _ from 'lodash';

import { CardId } from '../../../../_shared/types';

import { useSelector } from '../../redux/hooks';
import { emitActionRoom } from '../../socket';
import { CardIcon } from '../../components/card-icon';
import { CardButton } from '../../components/card-button';

function Login() {
  const [name, setName] = React.useState('');
  const [roomId, setRoomId] = React.useState('');
  const [showJoin, setShowJoin] = React.useState(false);

  const join = () => {
    emitActionRoom({
      type: 'JOIN',
      roomId,
      name,
    });
  };

  const toggleJoin = (state = !showJoin) => setShowJoin(state);

  return (
    <div className="pad">
      <input
        type="text"
        placeholder="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {!showJoin && (
        <>
          <br />
          <br />
          <button onClick={join}>Create room</button>
          <br />
          <br />
          <b>or</b>
          <br />
          <br />
          <button onClick={() => toggleJoin(true)}>Join existing room</button>
        </>
      )}

      {showJoin && (
        <>
          <br />
          <br />
          <input
            type="text"
            placeholder="room code"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />

          <br />
          <br />
          <button onClick={join}>Join</button>
          <br />
          <br />
          <button onClick={() => toggleJoin(false)}>Cancel</button>
        </>
      )}
    </div>
  );
}

export function HomeRoute() {
  const stateRoom = useSelector((state) => state.room);

  if (!stateRoom) {
    return <Login />;
  }

  const deal = () => {
    emitActionRoom({
      type: 'DEAL',
    });
  };

  const swap = (cardsHand: CardId[], cardsOpen: CardId[]) => {
    emitActionRoom({
      type: 'SWAP',
      cardsHand,
      cardsOpen,
    });
  };

  const start = () => {
    emitActionRoom({
      type: 'START',
    });
  };

  return (
    <div>
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
        </div>

        <div className="deck">
          <div className="card-stack -overlap-large">
            {Array.from(Array(stateRoom.cardsDeckCount)).map((_, idx) => (
              <CardButton key={idx} />
            ))}
          </div>
        </div>

        <div className="discarded">
          <div className="card-stack">
            {Array.from(Array(stateRoom.cardsDiscardedCount)).map((_, idx) => (
              <CardIcon key={idx} />
            ))}
          </div>
        </div>

        <div className="pile">
          {stateRoom.cardsPile.map((cardId) => (
            <CardIcon cardId={cardId} key={cardId} />
          ))}
        </div>
      </div>

      <div className="pad">
        <h2>
          You: {stateRoom.player.name} <code>{stateRoom.player.userId}</code>
        </h2>

        <div>
          <h5>Closed</h5>
          {Array.from(Array(stateRoom.player.cardsClosedCount)).map(
            (_, idx) => (
              <CardButton key={idx} />
            )
          )}
        </div>

        <div>
          <h5>Open</h5>
          {stateRoom.player.cardsOpen.map((cardId) => (
            <CardButton cardId={cardId} />
          ))}
        </div>

        <div>
          <h5>Hand</h5>
          {stateRoom.player.cardsHand.map((cardId) => (
            <CardButton cardId={cardId} />
          ))}
        </div>
      </div>
      <div>
        <h2>Players</h2>

        {stateRoom.otherPlayers.map((otherPlayer, idx) => {
          return (
            <div key={idx}>
              <h3>{otherPlayer.name}</h3>
              <code>{otherPlayer.userId}</code>

              <div>
                <h5>Closed</h5>
                {Array.from(Array(otherPlayer.cardsClosedCount)).map(
                  (_, idx) => (
                    <CardIcon key={idx} />
                  )
                )}
              </div>

              <div>
                <h5>Open</h5>
                {otherPlayer.cardsOpen.map((cardId) => (
                  <CardIcon cardId={cardId} />
                ))}
              </div>

              <div>
                <h5>Hand</h5>
                {Array.from(Array(otherPlayer.cardsHandCount)).map((_, idx) => (
                  <CardIcon key={idx} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
