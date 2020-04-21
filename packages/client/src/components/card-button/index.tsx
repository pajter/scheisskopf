import React from 'react';

import { CardId } from '../../../../_shared/types';

import { CardIcon } from '../card-icon';

export function CardButton({ cardId }: { cardId?: CardId }) {
  return (
    <div className="card-button">
      <CardIcon cardId={cardId} />
    </div>
  );
}
