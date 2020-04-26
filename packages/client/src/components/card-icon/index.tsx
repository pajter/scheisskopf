import React from 'react';

import { CardId } from '../../../../_shared/types';
import { getCardObj, getRankName } from '../../../../_shared/util';

const EMOJI = {
  club: '♣️',
  diamond: '♦️',
  heart: '♥️',
  spade: '♠️',
} as const;

export function CardIcon({ cardId }: { cardId?: CardId | null }) {
  const cardObj = typeof cardId === 'string' ? getCardObj(cardId) : undefined;

  return (
    <div
      className={`card-icon ${typeof cardId === 'undefined' ? '-hidden' : ''} ${
        cardId === null ? '-empty' : ''
      }`}
    >
      {cardObj && (
        <>
          <div>{EMOJI[cardObj.suit]}</div>
          <div>{getRankName(cardObj.rank)}</div>
        </>
      )}
    </div>
  );
}
