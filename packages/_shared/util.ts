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

export const suits: CardSuit[] = ['club', 'diamond', 'heart', 'spade'];

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

// TODO: come up with card id system that is sortable
export const getCardId = ({
  suit,
  rank,
}: {
  suit: CardSuit;
  rank: CardRank;
}): CardId => `${rank}:${suit}`;

export const getCardObj = (
  cardId: string
): { suit: CardSuit; rank: CardRank } => {
  const [rank, suit] = cardId.split(':');

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

export const getIterator = <T>(src: T[]) => {
  const handlers: {
    loop: (() => void)[];
  } = {
    loop: [],
  };
  let curIdx = 0;
  const iterator = {
    src,
    on: (event: 'loop', handler: () => void) => {
      handlers[event].push(handler);
    },
    set: (idx: number) => {
      curIdx = idx;
    },
    get: () => {
      return src[curIdx];
    },
    next: () => {
      curIdx++;
      if (curIdx > src.length - 1) {
        curIdx = 0;
        handlers.loop.forEach(f => f());
      }
      return iterator.get();
    },
    prev: () => {
      curIdx--;
      if (curIdx < 0) {
        curIdx = src.length - 1;
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
