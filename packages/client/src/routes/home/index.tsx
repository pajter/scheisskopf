import React from 'react';
import _ from 'lodash';

import { CardId } from '../../../../_shared/types';
import { getCardObj, getRankName } from '../../../../_shared/util';

import { useSelector } from '../../redux/hooks';
import { emitActionRoom } from '../../socket';

function CardIcon({ cardId }: { cardId?: CardId }) {
  const EMOJI = {
    club: '♣️',
    diamond: '♦️',
    heart: '♥️',
    spade: '♠️',
  } as const;

  const cardObj =
    typeof cardId === 'undefined' ? undefined : getCardObj(cardId);

  return (
    <div className={`card-icon ${!cardObj ? '-hidden' : ''}`}>
      {cardObj && (
        <>
          <div>{EMOJI[cardObj.suit]}</div>
          <div>{getRankName(cardObj.rank)}</div>
        </>
      )}
    </div>
  );
}

function Login() {
  const [name, setName] = React.useState('');
  const [roomId, setRoomId] = React.useState('');

  const join = () => {
    emitActionRoom({
      type: 'JOIN',
      roomId,
      name,
    });
  };

  return (
    <div>
      <input
        type="text"
        placeholder="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <h2>{roomId ? 'Join' : 'Create'} room</h2>

      <input
        type="text"
        placeholder="room code"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />

      <br />
      <button onClick={join}>{roomId ? 'Join' : 'Create'}</button>
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

  return (
    <div>
      <div className="stick">
        <b>room code: {stateRoom.roomId}</b>
        <button onClick={deal}>deal</button>

        <div>
          <b>deck</b>
          <code>{stateRoom.cardsDeckCount}</code>
        </div>
        <div>
          <b>discarded</b>
          <code>{stateRoom.cardsDiscardedCount}</code>
        </div>
        <div>
          <b>pile</b>
          {stateRoom.cardsPile.map((cardId) => (
            <CardIcon cardId={cardId} key={cardId} />
          ))}
        </div>
      </div>
      <div>
        {stateRoom.players.map((player, idx) => {
          return (
            <div key={idx}>
              <h3>{player.name}</h3>

              <div>
                <b>card closed</b>
                <code>{player.cardsClosedCount}</code>
              </div>

              <div>
                <b>cards open</b>
                {player.cardsOpen.map((cardId) => (
                  <CardIcon cardId={cardId} />
                ))}
              </div>

              <div>
                <b>cards hand</b>
                <code>{player.cardsHandCount}</code>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
