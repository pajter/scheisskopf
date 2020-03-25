import shuffle from 'lodash-es/shuffle';
import reverse from 'lodash-es/reverse';

import { CardId, CardSuit, CardRank } from './types';
import { Player } from './redux/game/types';

export const ranks: CardRank[] = [
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11, // Jack
  12, // Queen
  13, // King
  14, // Ace
];

export const suits: CardSuit[] = ['club', 'diamond', 'heart', 'spade'];

export const getDeck = (shuffleDeck: boolean = true): CardId[] => {
  const deck: CardId[] = [];

  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push(getCardId({ suit, rank }));
    });
  });

  if (shuffleDeck) {
    return shuffle(deck);
  } else {
    return deck;
  }
};

export const getCardId = ({
  suit,
  rank,
}: {
  suit: CardSuit;
  rank: CardRank;
}): CardId => `${`${rank}`.padStart(2, '0')}:${suit}`;

export const getCardObj = (
  cardId: string
): { suit: CardSuit; rank: CardRank } => {
  const [rank, suit] = cardId.split(':');

  return {
    suit: suit as CardSuit,
    rank: +rank.replace(/^0/, '') as CardRank,
  };
};

export const getRankName = (rank: CardRank): string => {
  switch (rank) {
    case 11:
      return 'J';
    case 12:
      return 'Q';
    case 13:
      return 'K';
    case 14:
      return 'A';
    default:
      return `${rank}`;
  }
};

export const getIterator = <T>(src: T[]) => {
  const handlers: {
    loop: (() => void)[];
  } = {
    loop: [],
  };

  const iterator = {
    curIdx: 0,
    src,
    on: (event: 'loop', handler: () => void) => {
      handlers[event].push(handler);
    },
    set: (idx: number) => {
      iterator.curIdx = idx;
    },
    get: () => {
      return src[iterator.curIdx];
    },
    next: () => {
      iterator.curIdx++;
      if (iterator.curIdx > src.length - 1) {
        iterator.curIdx = 0;
        handlers.loop.forEach(f => f());
      }
      return iterator.get();
    },
    prev: () => {
      iterator.curIdx--;
      if (iterator.curIdx < 0) {
        iterator.curIdx = src.length - 1;
        handlers.loop.forEach(f => f());
      }
      return iterator.get();
    },
    forward: (assert: (i: T) => boolean) => {
      let n = 0;
      while (!assert(iterator.next())) {
        if (n > src.length) {
          break;
        }
        n++;
      }
    },
    reverse: (assert: (i: T) => boolean) => {
      let n = 0;
      while (!assert(iterator.prev())) {
        if (n > src.length) {
          break;
        }
        n++;
      }
    },
  };
  return iterator;
};

export const areCardsTheSameRank = (cards: CardId[]): boolean => {
  // Check that all cards are the same rank
  if (cards.length > 1) {
    const firstRank = getCardObj(cards[0]).rank;
    for (const card of cards) {
      if (getCardObj(card).rank !== firstRank) {
        return false;
      }
    }
  }

  return true;
};

export const groupCardsByRank = (
  cards: CardId[]
): Partial<{ [K in CardRank]: CardId[] }> => {
  const ret: Partial<{ [K in CardRank]: CardId[] }> = {};
  cards.forEach(card => {
    const cardObj = getCardObj(card);
    if (!ret[cardObj.rank]) {
      ret[cardObj.rank] = [];
    }
    ret[cardObj.rank]!.push(card);
  });

  return ret;
};

export const groupCardsBySuit = (
  cards: CardId[]
): Partial<{ [K in CardSuit]: CardId[] }> => {
  const ret: Partial<{ [K in CardSuit]: CardId[] }> = {};
  cards.forEach(card => {
    const cardObj = getCardObj(card);
    if (!ret[cardObj.suit]) {
      ret[cardObj.suit] = [];
    }
    ret[cardObj.suit]!.push(card);
  });
  return ret;
};

export const shouldClearTheDeck = (cards: CardId[]) => {
  if (getCardObj(cards[cards.length - 1]).rank === 10) {
    return true;
  }

  let currentRank: number | undefined;
  let count: number = 0;
  const reversedCardObjs = reverse([...cards]).map(getCardObj);

  for (const cardObj of reversedCardObjs) {
    if (typeof currentRank === 'undefined') {
      currentRank = cardObj.rank;

      // We have one card of this rank
      count = 1;
    } else {
      // TODO: this doesn't work somehow
      if (cardObj.rank === 3) {
        // Continue loop because 3 is invisible
        continue;
      }

      if (cardObj.rank === currentRank) {
        // We have another card of this rank
        count++;
      } else {
        // Another rank was found, abort!
        break;
      }
    }
  }
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

export const getTotalTurns = (players: Player[]): number => {
  return players.reduce((acc, player) => {
    acc = acc + player.turns;
    return acc;
  }, 0);
};
