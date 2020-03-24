import _shuffle from 'lodash-es/shuffle';

import { CardId, CardSuit, CardRank } from './types';

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

export const suits: CardSuit[] = ['club', 'spade', 'diamond', 'heart'];

export const getDeck = (shuffle: boolean = true): CardId[] => {
  const deck: CardId[] = [];

  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push(getCardId({ suit, rank }));
    });
  });

  if (shuffle) {
    return _shuffle(deck);
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
}): CardId => `${suit}:${rank}`;

export const getCardObj = (
  cardId: string
): { suit: CardSuit; rank: CardRank } => {
  const [suit, rank] = cardId.split(':');

  return {
    suit: suit as CardSuit,
    rank: +rank as CardRank,
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

export const getCardSortFn = () => {
  return (a: CardId, b: CardId) => {
    return getCardObj(a).rank - getCardObj(b).rank;
  };
};

export const getIterator = <T>(array: T[]) => {
  const handlers: {
    loop: (() => void)[];
  } = {
    loop: [],
  };
  let curIdx = 0;
  const iterator = {
    on: (event: 'loop', handler: () => void) => {
      handlers[event].push(handler);
    },
    set: (idx: number) => {
      curIdx = idx;
    },
    get: () => {
      return array[curIdx];
    },
    next: () => {
      curIdx++;
      if (curIdx > array.length - 1) {
        curIdx = 0;
        handlers.loop.forEach(f => f());
      }
      return iterator.get();
    },
    prev: () => {
      curIdx--;
      if (curIdx < 0) {
        curIdx = array.length - 1;
        handlers.loop.forEach(f => f());
      }
      return iterator.get();
    },
    forward: (assert: (i: T) => boolean) => {
      let n = 0;
      while (!assert(iterator.next())) {
        if (n > array.length) {
          break;
        }
        n++;
      }
    },
    reverse: (assert: (i: T) => boolean) => {
      let n = 0;
      while (!assert(iterator.prev())) {
        if (n > array.length) {
          break;
        }
        n++;
      }
    },
  };
  return iterator;
};
