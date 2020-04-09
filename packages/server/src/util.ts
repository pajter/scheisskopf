import _ from 'lodash';

import { CardId } from '../../_shared/types';
import { getCardId, suits, ranks, getCardObj } from '../../_shared/util';

import { Player } from './redux/room/types';

export const getTotalTurns = (players: Player[]): number => {
  return players.reduce((acc, player) => {
    acc = acc + player.turns;
    return acc;
  }, 0);
};

export const getDeck = (shuffleDeck: boolean = true): CardId[] => {
  const deck: CardId[] = [];

  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      deck.push(getCardId({ suit, rank }));
    });
  });

  if (shuffleDeck) {
    return _.shuffle(deck);
  } else {
    return deck;
  }
};

export const shouldClearThePile = (cards: string[]) => {
  if (getCardObj(cards[cards.length - 1]).rank === 10) {
    return true;
  }

  const reversedCardObjs = _.reverse([...cards]).map(getCardObj);

  let currentRank: number = reversedCardObjs[0].rank;
  let count: number = 0;

  for (const cardObj of reversedCardObjs) {
    if (cardObj.rank === currentRank) {
      // We have another card of this rank
      count++;
    } else {
      if (cardObj.rank === 3) {
        // Continue loop because 3 is invisible
        continue;
      }

      // Another rank was found, abort!
      break;
    }
  }

  // 4 of the same ranks clears the deck
  return count === 4;
};

export const getIllegalMove = (
  playingCard: CardId,
  cards?: CardId[]
): CardId | undefined => {
  // Can always play an empty pile
  if (typeof cards === 'undefined' || !cards.length) {
    return;
  }

  // Special cards
  const playingCardObj = getCardObj(playingCard);
  if (
    playingCardObj.rank === 2 ||
    playingCardObj.rank === 3 ||
    playingCardObj.rank === 10
  ) {
    return;
  }

  // If we have a '3', move up the pile until there's no longer a 3
  const cardsCopy = [...cards];
  let currentCardObj = getCardObj(cardsCopy.pop()!);
  while (currentCardObj.rank === 3 && cardsCopy.length) {
    currentCardObj = getCardObj(cardsCopy.pop()!);
  }
  // If there's still a 3, that means the whole pile is made up out of 3's, so it's a free play
  if (currentCardObj.rank === 3) {
    return;
  }

  if (currentCardObj.rank === 7) {
    // Next card needs to be equal to or lower than 7
    return playingCardObj.rank <= currentCardObj.rank
      ? undefined
      : getCardId(currentCardObj);
  }

  // Next card needs to be equal or higher than current
  return playingCardObj.rank >= currentCardObj.rank
    ? undefined
    : getCardId(currentCardObj);
};
