import _shuffle from 'lodash-es/shuffle';

import { Card, CardSuit, CardRank } from './types';

export const ranks: CardRank[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
];

export const suits: CardSuit[] = ['club', 'spade', 'diamond', 'heart'];

export const getDeck = (shuffle: boolean = true): Card[] => {
  const deck: Card[] = [];

  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({ suit, rank });
    });
  });

  if (shuffle) {
    return _shuffle(deck);
  } else {
    return deck;
  }
};

export const cardsEqual = (cardA: Card, cardB: Card): boolean =>
  cardA.rank === cardB.rank && cardA.suit === cardB.suit;

export const cardsEqualFn = (cardA: Card) => (cardB: Card): boolean =>
  cardsEqual(cardA, cardB);

export const getCardId = (card: Card): string =>
  [card.suit, card.rank].join(':');

export const getCardFromId = (cardId: string): Card => {
  const [suit, rank] = cardId.split(':') as [CardSuit, CardRank];

  return {
    suit,
    rank,
  };
};

export const getRankIdx = (card: Card) => {
  return ranks.findIndex(rank => rank === card.rank);
};

export const getCardSortFn = () => {
  return (a: Card, b: Card) => {
    return getRankIdx(a) - getRankIdx(b);
  };
};
