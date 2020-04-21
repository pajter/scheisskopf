import React from 'react';

import { CardId } from '../../../../_shared/types';
import { getCardObj, getRankName } from '../../../../_shared/util';

const EMOJI = {
  club: '♣️',
  diamond: '♦️',
  heart: '♥️',
  spade: '♠️',
} as const;

export function CardIcon({ cardId }: { cardId?: CardId }) {
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
