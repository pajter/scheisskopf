import React from 'react';

import { CardId } from '../../../../_shared/types';

import { CardIcon } from '../card-icon';
import { useDispatch, useSelector } from '../../redux/hooks';
import { getCardObj } from '../../../../_shared/util';

export function CardButton({
  cardId,
  onClick,
  disabled,
  stack,
}: {
  cardId?: CardId;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  stack?: 'open' | 'hand';
}) {
  const dispatch = useDispatch();

  const selectedCardIds = useSelector((state) =>
    stack ? state.client.selectedCardIds[stack] : []
  );
  const gameState = useSelector((state) => state.room.state);

  // Check whether card can be selected based on existing selection
  if (cardId && stack && selectedCardIds.length && gameState !== 'pre-game') {
    const selectedCardIsSameRank =
      getCardObj(selectedCardIds[0]).rank === getCardObj(cardId).rank;
    disabled = disabled || !selectedCardIsSameRank;
  }

  const isSelected = cardId && selectedCardIds.includes(cardId);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (stack) {
      if (isSelected) {
        dispatch({ type: 'DESELECT_CARD', cardId, stack });
      } else {
        dispatch({ type: 'SELECT_CARD', cardId, stack });
      }
    }

    onClick && onClick(e);
  };

  return (
    <button
      className={'card-button' + (isSelected ? ' -selected' : '')}
      onClick={handleClick}
      disabled={disabled}
    >
      <CardIcon cardId={cardId} />
    </button>
  );
}
