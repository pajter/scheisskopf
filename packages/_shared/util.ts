import _ from 'lodash';

import { CardId, CardSuit, CardRank, Err } from './types';

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

export const suits: CardSuit[] = ['C', 'D', 'H', 'S'];

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
  const eventHandlers: {
    loop: (() => void)[];
  } = {
    loop: [],
  };

  const self = {
    curIdx: 0,
    src,
    on: (event: 'loop', handler: () => void) => {
      eventHandlers[event].push(handler);
    },
    set: (idx: number) => {
      self.curIdx = idx;
    },
    get: () => {
      return src[self.curIdx];
    },
    getItems: () => {
      let ret: T[] = [];
      let i: T = self.get();
      do {
        ret.push({ ...i });
      } while ((i = self.next()) && ret.length !== src.length);
      return ret;
    },
    next: () => {
      self.curIdx++;
      if (self.curIdx > src.length - 1) {
        self.curIdx = 0;
        eventHandlers.loop.forEach((f) => f());
      }
      return self.get();
    },
    prev: () => {
      self.curIdx--;
      if (self.curIdx < 0) {
        self.curIdx = src.length - 1;
        eventHandlers.loop.forEach((f) => f());
      }
      return self.get();
    },
    forward: (assert: (i: T) => boolean) => {
      let n = 0;
      while (!assert(self.next())) {
        if (n > src.length) {
          break;
        }
        n++;
      }
    },
    reverse: (assert: (i: T) => boolean) => {
      let n = 0;
      while (!assert(self.prev())) {
        if (n > src.length) {
          break;
        }
        n++;
      }
    },
  };
  return self;
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
  cards.forEach((card) => {
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
  cards.forEach((card) => {
    const cardObj = getCardObj(card);
    if (!ret[cardObj.suit]) {
      ret[cardObj.suit] = [];
    }
    ret[cardObj.suit]!.push(card);
  });
  return ret;
};

export const generateRandomString = (
  length: number = 4,
  dict = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
) => {
  let ret = '';
  while (ret.length < length) {
    ret += _.sample(dict);
  }
  return ret;
};

export const createError = (msg: string): Err => {
  const e = new Error(msg);

  return { message: e.message };
};
