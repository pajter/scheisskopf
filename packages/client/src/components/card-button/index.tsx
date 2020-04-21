import React from 'react';

import { CardId } from '../../../../_shared/types';

import { CardIcon } from '../card-icon';

export function CardButton({
  cardId,
  onClick,
  disabled,
}: {
  cardId?: CardId;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button className="card-button" onClick={onClick} disabled={disabled}>
      <CardIcon cardId={cardId} />
    </button>
  );
}
