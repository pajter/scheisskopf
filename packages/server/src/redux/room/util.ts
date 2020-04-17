import _ from 'lodash';

import {
  ranks,
  suits,
  getIterator,
  getCardId,
  getCardObj,
} from '../../../../_shared/util';
import { CardId } from '../../../../_shared/types';

import { Player, State } from './types';
import { GameErrorCode, GameError } from './error';

export const createPlayer = (id: string, name: string): Player => ({
  userId: id,
  name,
  cardsClosed: [],
  cardsHand: [],
  cardsOpen: [],
  isFinished: false,
  isDealer: false,
  turns: 0,
});

export const findPlayerById = (
  playerId: string,
  players: Player[]
): Player | undefined => {
  return players.find(({ userId }) => userId === playerId);
};

export const getNextPlayer = (
  currentPlayer: Player,
  players: Player[],
  skip: number = 0
): Player => {
  const currentPlayerIdx = players.findIndex(
    ({ userId: id }) => id === currentPlayer.userId
  );

  const iteratePlayers = getIterator([...players]);
  // Set iterator to current player
  iteratePlayers.set(currentPlayerIdx);
  // Move to next player that is still in the game
  iteratePlayers.forward((player) => !player.isFinished);

  while (skip > 0) {
    const nextPlayer = iteratePlayers.next();
    if (!nextPlayer.isFinished) {
      // Decrease skip only for players that are in the game
      skip--;
    }
  }

  const nextPlayer = iteratePlayers.get();
  if (!nextPlayer) {
    throw new Error('Could not find next player!?');
  }
  return nextPlayer;
};

export const findStartingPlayer = (players: Player[]) => {
  let iterateSuits = getIterator(suits);
  let iterateRanks = getIterator(
    // Start from 4 (filter 2s and 3s)
    [...ranks].filter((r) => r > 3)
  );

  let startingPlayer: Player | undefined;

  while (!startingPlayer) {
    for (const player of players) {
      // Note: discuss whether or not it's allowed to have a club 4 in open cards

      // Search in hand only
      if (
        player.cardsHand.includes(
          getCardId({ suit: iterateSuits.get(), rank: iterateRanks.get() })
        )
      ) {
        startingPlayer = player;

        // Break users loop
        break;
      }
    }

    if (startingPlayer) {
      break;
    }

    // If we haven't found it after scanning all users, move on to the next card
    iterateSuits.next();
    if (iterateSuits.curIdx === 0) {
      // Move on to next rank if we restart the suits loop
      iterateRanks.next();
    }
  }

  return {
    startingPlayer,
    startingCard: getCardId({
      suit: iterateSuits.get(),
      rank: iterateRanks.get(),
    }),
  };
};

export const calcCardCounts = (
  playerCount: number
): { closed: number; open: number; hand: number } => {
  // Start at 3 for each
  let closed = 3;
  let open = 3;
  let hand = 3;

  // Min amount of cards
  const closedMin = 2;
  const openMin = 1;
  const handMin = 1;

  const cardsPerPlayer = 52 / playerCount;

  // While the amount of cards we want to deal is greater than the cards available per player
  while (closed + open + hand > Math.floor(cardsPerPlayer)) {
    // Subtract cards from hand first
    if (hand > handMin) {
      hand--;
      continue;
    }

    // Subtract open cards
    if (open > openMin) {
      open--;
      continue;
    }

    // Subtract closed cards
    if (closed > closedMin) {
      closed--;
      continue;
    }
  }

  return { closed, open, hand };
};

export const updatePlayers = (players: Player[], newPlayer: Player) => {
  console.log(players, newPlayer);
  const idx = players.findIndex(({ userId }) => userId === newPlayer.userId);
  if (idx < 0) {
    throw new Error('Could not find player?!');
  }
  const newPlayers = [...players];
  newPlayers[idx] = { ...newPlayer };
  return newPlayers;
};

export const isPlayerFinished = (player: Player): boolean =>
  player.cardsClosed.length === 0 &&
  player.cardsOpen.length === 0 &&
  player.cardsHand.length === 0;

export const sortPlayerCards = (player: Player): void => {
  // Only sort hand and open cards
  player.cardsHand = player.cardsHand.sort();
  player.cardsOpen = player.cardsOpen.sort();
};

export const getErrorState = (
  state: State,
  error: GameErrorCode | GameError
) => {
  return {
    ...state,

    error: typeof error === 'string' ? new GameError(error) : error,
  };
};

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

export const getIllegalMoveCard = (
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
