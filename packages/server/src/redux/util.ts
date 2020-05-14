import _ from 'lodash';

import {
  ranks,
  suits,
  getIterator,
  getCardId,
  getCardObj,
} from '../../../_shared/util';
import { CardId, Spectator } from '../../../_shared/types';
import { GameErrorCode, GameError } from '../../../_shared/error';

import { Player, State, Bot } from './types';
import { ScheissUser } from '../app/user';
import { ScheissBot } from '../app/bot';

export const createPlayer = (
  user: ScheissUser & { userId: string },
  isDealer: boolean = false
): Player => ({
  userId: user.userId,
  name: user.username,

  cardsHand: [],
  cardsOpen: [],
  cardsBlind: [],

  turns: 0,

  isFinished: false,
  isDealer,
  isScheisskopf: false,

  hasStartingCard: undefined,

  mustPick: false,

  connected: true,
  lastPing: new Date(),
});

export const createBot = (bot: ScheissBot): Bot => {
  return {
    userId: bot.userId,
    name: bot.username,

    cardsHand: [],
    cardsOpen: [],
    cardsBlind: [],

    turns: 0,

    isFinished: false,
    isDealer: false,
    isScheisskopf: false,

    mustPick: false,

    hasStartingCard: undefined,

    botSettings: {
      difficulty: 'easy',
    },
  };
};

export const createSpectator = (
  user: ScheissUser & { userId: string }
): Spectator => ({
  userId: user.userId,
  name: user.username,

  connected: true,
  lastPing: new Date(),
});

export const findPlayerById = (
  playerUserId: string,
  players: (Player | Bot)[]
): Player | Bot | undefined => {
  const player = players.find(({ userId }) => userId === playerUserId);
  if (player) {
    // Always return copy
    return { ...player };
  }
};

export const getNextPlayer = (
  currentPlayer: Player | Bot,
  players: (Player | Bot)[],
  skip: number = 0
): Player | Bot => {
  players = players.map((p) => ({ ...p }));

  const currentPlayerIdx = players.findIndex(
    ({ userId }) => userId === currentPlayer.userId
  );

  const iteratePlayers = getIterator(players);
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

export const findStartingPlayer = (players: (Player | Bot)[]) => {
  // Clone
  players = players.map((p) => ({ ...p }));

  let iterateSuits = getIterator(suits);
  let iterateRanks = getIterator(
    // Start from 4 (filter 2s and 3s)
    [...ranks].filter((r) => r > 3)
  );

  // Prevent infinite loop
  let n = 10000;
  while (n > 0) {
    n--;

    const cardId = getCardId({
      suit: iterateSuits.get(),
      rank: iterateRanks.get(),
    });

    for (const player of players) {
      // Search in hand and open only
      if (
        player.cardsHand.includes(cardId) ||
        player.cardsOpen.includes(cardId)
      ) {
        player.hasStartingCard = getCardId({
          suit: iterateSuits.get(),
          rank: iterateRanks.get(),
        });

        return players;
      }
    }

    // If we haven't found it after scanning all users, move on to the next card
    iterateSuits.next();
    if (iterateSuits.curIdx === 0) {
      // Move on to next rank if we restart the suits loop
      iterateRanks.next();

      if (iterateRanks.curIdx === 0) {
        // Stop! Something went wrong...
        break;
      }
    }
  }

  throw new Error('Could not find starting player?!');
};

export const calcCardCounts = (
  playerCount: number
): { blind: number; open: number; hand: number } => {
  // Start at 3 for each
  let blind = 3;
  let open = 3;
  let hand = 3;

  // Min amount of cards
  const blindMin = 1;
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
  players: (Player | Bot)[],
  newPlayer: (Player | Bot) | ((player: Player | Bot) => Player | Bot),
  userId?: string
): (Player | Bot)[] => {
  // Clone
  players = players.map((p) => ({ ...p }));

  userId = typeof newPlayer === 'function' ? userId : newPlayer.userId;
  const idx = players.findIndex((p) => p.userId === userId);
  if (idx < 0) {
    throw new Error('UPDATE_PLAYERS: Player not found');
  }

  newPlayer =
    typeof newPlayer === 'function' ? newPlayer(players[idx]) : newPlayer;

  players[idx] = {
    ...newPlayer,
  };

  return players;
};

export const isPlayerFinished = (player: Player | Bot): boolean => {
  return (
    player.cardsBlind.filter((c) => c !== null).length === 0 &&
    player.cardsOpen.filter((c) => c !== null).length === 0 &&
    player.cardsHand.length === 0
  );
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

export const getTotalTurns = (players: (Player | Bot)[]): number => {
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
  const testCardObj = getCardObj(testCard);
  if (
    testCardObj.rank === 2 ||
    testCardObj.rank === 3 ||
    testCardObj.rank === 10
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
    return testCardObj.rank <= currentCardObj.rank
      ? undefined
      : getCardId(currentCardObj);
  }

  // Next card needs to be equal or higher than current
  return testCardObj.rank >= currentCardObj.rank
    ? undefined
    : getCardId(currentCardObj);
};

export const assertGameState = (
  gameState: State['state'],
  nextPlayerUserId: string,
  players: (Player | Bot)[],
  player: Player | Bot,
  tablePile: CardId[]
): {
  gameState: State['state'];
  nextPlayerUserId: string;
  players: (Player | Bot)[];
} => {
  // Clone
  players = players.map((p) => ({ ...p }));
  player = { ...player };

  const unfinishedPlayers = players.filter((player) => !player.isFinished);
  if (
    // Check if game has ended
    unfinishedPlayers.length === 1
  ) {
    // A shithead has been crowned!
    const shitheadPlayer = unfinishedPlayers[0];

    // The shithead will become the dealer
    const shitHeadPlayerIdx = players.findIndex(
      (p) => p.userId === shitheadPlayer.userId
    );
    // Reset player states
    players.forEach((player) => {
      player.isDealer = false;
      player.isScheisskopf = false;
    });
    // Set state on shithead
    players[shitHeadPlayerIdx].isDealer = true;
    players[shitHeadPlayerIdx].isScheisskopf = true;

    return { gameState: 'ended', nextPlayerUserId, players };
  }

  // Check for 'clear-the-pile'
  if (shouldClearThePile(tablePile)) {
    gameState = 'clear-the-pile';

    // If the player who clears the pile is not yet finished, they must play again
    if (!player.isFinished) {
      nextPlayerUserId = player.userId;
    }

    return { gameState: 'clear-the-pile', nextPlayerUserId, players };
  }

  // Check if next player needs to pick
  const nextPlayer = players.find((p) => p.userId === nextPlayerUserId);
  if (nextPlayer) {
    const handMoves = getLegalAndIllegalCards(tablePile, nextPlayer.cardsHand);
    const openMoves = getLegalAndIllegalCards(tablePile, nextPlayer.cardsOpen);

    let nextPlayerMustPick = false;
    if (nextPlayer.cardsHand.length) {
      nextPlayerMustPick =
        handMoves.legal.length === 0 && handMoves.illegal.length > 0;
    } else if (nextPlayer.cardsOpen.length) {
      nextPlayerMustPick =
        openMoves.legal.length === 0 && openMoves.illegal.length > 0;
    }

    console.log(
      'nextplayer must pick',
      nextPlayerMustPick,
      nextPlayer.name,
      handMoves,
      openMoves
    );

    if (nextPlayerMustPick) {
      // Update players array
      players.forEach((p) => {
        if (p.userId === nextPlayerUserId) {
          p.mustPick = true;
        }
      });
    }
  }

  return { gameState, nextPlayerUserId, players };
};

export const getLegalAndIllegalCards = (
  tablePile: CardId[],
  cards: (CardId | null)[]
) => {
  const legal: CardId[] = [];
  const illegal: CardId[] = [];

  cards.forEach((card) => {
    if (!card) {
      return;
    }

    const illegalMove = getIllegalMoveCard(card, tablePile);

    if (illegalMove) {
      illegal.push(card);
    } else {
      legal.push(card);
    }
  });

  return { legal, illegal };
};
