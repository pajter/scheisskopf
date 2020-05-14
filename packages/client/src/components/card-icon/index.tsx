import React from 'react';

import { CardId } from '../../../../_shared/types';

import svgs from '../../assets/cards/*.svg';

export function CardIcon({ cardId }: { cardId?: CardId | null }) {
  const src =
    typeof cardId === 'undefined'
      ? (svgs as any)['back']
      : cardId
      ? (svgs as any)[cardId.replace(':', '')]
      : undefined;

  return (
    <div className={`card-icon ${cardId === null ? '-empty' : ''}`}>
      {src && <img src={src} width="224" height="336" />}
    </div>
  );
}
