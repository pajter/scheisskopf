import _ from 'lodash';

import {
  ranks,
  suits,
  getIterator,
  getCardId,
  getCardObj,
} from '../../../_shared/util';
import { CardId } from '../../../_shared/types';
import { GameErrorCode, GameError } from '../../../_shared/error';

import { Player, State, Spectator } from './types';
import { ScheissUser } from '../app/user';

export const createPlayer = (
  user: ScheissUser & { userId: string }
): Player => ({
  userId: user.userId,
  name: user.username,
  cardsHand: [],
  cardsOpen: [],
  cardsBlind: [],
  isFinished: false,
  isDealer: false,
  turns: 0,
  connected: true,
  lastPing: new Date(),
});

export const createSpectator = (
  user: ScheissUser & { userId: string }
): Spectator => ({
  userId: user.userId,
  name: user.username,
  connected: true,
  lastPing: new Date(),
});

export const findPlayerById = (
  playerId: string,
  players: Player[]
): Player | undefined => {
  const player = players.find(({ userId }) => userId === playerId);
  if (player) {
    // Always return copy
    return { ...player };
  }
};

export const getNextPlayer = (
  currentPlayer: Player,
  players: Player[],
  skip: number = 0
): Player => {
  const currentPlayerIdx = players.findIndex(
    ({ userId }) => userId === currentPlayer.userId
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

  return iteratePlayers.get();
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
    startingPlayer: { ...startingPlayer },
    startingCard: getCardId({
      suit: iterateSuits.get(),
      rank: iterateRanks.get(),
    }),
  };
};

export const calcCardCounts = (
  playerCount: number
): { blind: number; open: number; hand: number } => {
  // Start at 3 for each
  let blind = 3;
  let open = 3;
  let hand = 3;

  // Min amount of cards
  const blindMin = 2;
  const openMin = 1;
  const handMin = 1;

  const cardsPerPlayer = 52 / playerCount;

  // While the amount of cards we want to deal is greater than the cards available per player
  while (blind + open + hand > Math.floor(cardsPerPlayer)) {
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

    // Subtract blind cards
    if (blind > blindMin) {
      blind--;
      continue;
    }
  }

  return { blind, open, hand };
};

export const updatePlayers = (
  players: Player[],
  newPlayer: Player | ((player: Player) => Player),
  userId?: string
) => {
  userId = typeof newPlayer === 'function' ? userId : newPlayer.userId;

  const idx = players.findIndex((p) => p.userId === userId);
  if (idx < 0) {
    throw new Error('UPDATE_PLAYERS: Player not found');
  }

  const playersCopy = [...players];

  playersCopy[idx] = {
    ...(typeof newPlayer === 'function' ? newPlayer(players[idx]) : newPlayer),
  };

  return playersCopy;
};

export const isPlayerFinished = (player: Player): boolean =>
  player.cardsBlind.filter((i) => i !== null).length === 0 &&
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
  testCard: CardId,
  cardsPile?: CardId[]
): CardId | undefined => {
  // Can always play an empty pile
  if (typeof cardsPile === 'undefined' || !cardsPile.length) {
    return;
  }

  // Special cards
  const playingCardObj = getCardObj(testCard);
  if (
    playingCardObj.rank === 2 ||
    playingCardObj.rank === 3 ||
    playingCardObj.rank === 10
  ) {
    return;
  }

  // If we have a '3', move up the pile until there's no longer a 3
  const cardsCopy = [...cardsPile];
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

export const mustPlayerPick = (
  player: Player,
  cardsPile: CardId[]
): boolean => {
  // Player must first play from hand before playing from open
  const playingPile = player.cardsHand.length
    ? player.cardsHand
    : player.cardsOpen.length
    ? player.cardsOpen
    : [];

  if (!playingPile.length) {
    // Player does not need to pick if there are no cards
    return false;
  }

  for (const cardId of playingPile) {
    if (!getIllegalMoveCard(cardId, cardsPile)) {
      // If a legal move is found, player does NOT have to pick
      return false;
    }
  }

  // If no legal moves were found in the players' playing pile, player has to pick
  return true;
};

export const assertGameState = (
  gameState: State['state'],
  nextPlayerUserId: string,
  players: Player[],
  player: Player,
  tablePile: CardId[]
) => {
  if (players.filter((player) => !player.isFinished).length === 1) {
    // A shithead has been crowned!
    gameState = 'ended';

    const playerIdx = players.findIndex((p) => p.userId === player.userId);
    const nextPlayerIdx = playerIdx > players.length - 1 ? 0 : playerIdx + 1;
    players.forEach((player) => {
      player.isDealer = false;
    });
    players[nextPlayerIdx].isDealer = true;
  } else if (shouldClearThePile(tablePile)) {
    // We check for clear the pile after checking if game is finished
    // else we would not be able to finish the game after clearing the deck
    gameState = 'clear-the-pile';

    if (!player.isFinished) {
      // Keep same player when clearing the deck
      nextPlayerUserId = player.userId;
    }
  }
  return { gameState, nextPlayerUserId, players };
};
