import difference from 'lodash-es/difference';

import { State, Action, Player } from './types';
import {
  getDeck,
  cardsEqualFn,
  ranks,
  suits,
  getRankIdx,
  getCardId,
  getCardFromId,
  getIterator,
} from '../../util';
import { Card } from '../../types';
import {
  GameError,
  GAME_ERROR_NO_CARDS_PLAYED,
  GAME_ERROR_ILLEGAL_MOVE_CARD_RANKS_DONT_MATCH,
  GAME_ERROR_ILLEGAL_MOVE_FIRST_TURN_MUST_HAVE_STARTING_CARD,
  GAME_ERROR_ILLEGAL_MOVE_BLIND,
  GAME_ERROR_ILLEGAL_MOVE,
} from './error';

export const initialState: State = {
  tablePile: [],
  tableDeck: [],
  tableDiscarded: [],
  players: [],
  dealerUserId: null,
  currentPlayerUserId: null,
  startCardHandCount: null,
  state: 'pre-deal',
  error: null,
  startingCard: null,
};

export const reducer = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case 'DEAL': {
      // Get shuffled deck
      const deck = getDeck(true);

      // Get GameUser objects for each user in this game
      const gameUsers: Player[] = action.gameUsers.map(({ id, position }) => {
        return {
          id,
          position,
          cardsClosed: [],
          cardsHand: [],
          cardsOpen: [],
          isFinished: false,
          turns: 0,
        };
      });

      // TODO: calc based on number of users
      const startCardHandCount = 3;
      const startCardOpenCount = 3;
      let userPileCounts = {
        cardsClosed: 3,
        cardsOpen: startCardOpenCount,
        cardsHand: startCardHandCount,
      };
      const userPileOrder: ['cardsClosed', 'cardsOpen', 'cardsHand'] = [
        'cardsClosed',
        'cardsOpen',
        'cardsHand',
      ];

      // Start with first cardType in order
      let userPile = userPileOrder.shift()!;
      let userIdx = 0;
      while (true) {
        if (userIdx > gameUsers.length - 1) {
          // Back to first user
          userIdx = 0;
        }

        const currentUser = gameUsers[userIdx];

        // Switch to next card type when first user has received enough cards
        if (currentUser[userPile].length === userPileCounts[userPile]) {
          const nextUserCardType = userPileOrder.shift();

          if (!nextUserCardType) {
            // Stop loop because all card types have been dealt
            break;
          }

          userPile = nextUserCardType;
        }

        // Add card to user's card type
        const nextCard = deck.shift();
        if (!nextCard) {
          throw new Error(
            'Something went wrong with dealing. Ran out of cards!'
          );
        }
        currentUser[userPile!].push(nextCard);

        // Move to next user
        userIdx++;
      }

      return {
        ...state,

        dealerUserId: action.userId,
        startCardHandCount,
        tableDeck: deck,
        tableDiscarded: [],
        tablePile: [],
        currentPlayerUserId: null,
        error: null,
        startingCard: null,
        players: gameUsers,
        state: 'pre-game',
      };
    }
    case 'SWAP_CARDS': {
      const currentPlayerIdx = state.players.findIndex(
        user => user.id === action.userId
      );

      // Clone user
      const player = { ...state.players[currentPlayerIdx] };

      if (
        difference(
          action.cardsHand.map(getCardId),
          player.cardsHand.map(getCardId)
        ).length
      ) {
        throw new Error('Card not in hand!');
      }
      if (
        difference(
          action.cardsOpen.map(getCardId),
          player.cardsOpen.map(getCardId)
        ).length
      ) {
        throw new Error('Card not in open pile!');
      }

      // Swap cards
      player.cardsHand = [
        ...difference(
          player.cardsHand.map(getCardId),
          action.cardsHand.map(getCardId)
        ).map(getCardFromId),
        ...action.cardsOpen,
      ];
      player.cardsOpen = [
        ...difference(
          player.cardsOpen.map(getCardId),
          action.cardsOpen.map(getCardId)
        ).map(getCardFromId),
        ...action.cardsHand,
      ];

      // TODO: maybe find a way not to create a whole new players array?
      const newPlayers = [...state.players];
      newPlayers[currentPlayerIdx] = player;

      return {
        ...state,
        players: newPlayers,
      };
    }
    case 'START': {
      const { startingPlayer, startingCard } = findStartingPlayer(
        state.players
      );

      if (!startingPlayer) {
        throw new Error('Could not find user with required card!?');
      }

      return {
        ...state,
        currentPlayerUserId: startingPlayer.id,

        startingCard,
        state: 'playing',
      };
    }
    case 'PLAY': {
      // Clone player
      const playerIdx = state.players.findIndex(
        ({ id }) => id === action.userId
      );
      const player = { ...getPlayerById(action.userId, state.players) };

      let error: GameError | undefined;

      if (action.cards.length === 0) {
        return {
          ...state,
          error: new GameError('Play something!', GAME_ERROR_NO_CARDS_PLAYED),
        };
      }

      // Check that all cards are the same rank
      if (!areCardsTheSameRank(action.cards)) {
        return {
          ...state,
          error: new GameError(
            'Illegal move! Cards must have the same rank.',
            GAME_ERROR_ILLEGAL_MOVE_CARD_RANKS_DONT_MATCH
          ),
        };
      }

      // If start of game, the startingCard has to be played
      if (
        getTotalTurns(state.players) === 0 &&
        !action.cards.find(cardsEqualFn(state.startingCard!))
      ) {
        return {
          ...state,
          error: new GameError(
            'Illegal move! First card must include the starting card.',
            GAME_ERROR_ILLEGAL_MOVE_FIRST_TURN_MUST_HAVE_STARTING_CARD
          ),
        };
      }

      // Playing blind card
      const firstCard = action.cards[0];
      if (
        player.cardsHand.length === 0 &&
        player.cardsOpen.length === 0 &&
        action.cards.length === 1 &&
        player.cardsClosed.find(cardsEqualFn(firstCard))
      ) {
        if (state.error?.code === GAME_ERROR_ILLEGAL_MOVE_BLIND) {
          // We can't make any more moves until the pile has been picked up
          return state;
        }

        const illegalMove = getIllegalMove(firstCard, state.tablePile);

        if (illegalMove) {
          // Add cards to pile
          let tablePile = [...state.tablePile, ...action.cards];

          // Remove blind card from closed cards
          player.cardsClosed = removeCard(firstCard, player.cardsClosed);
          player.turns = player.turns + 1;

          const players = [...state.players];
          players[playerIdx] = player;

          return {
            ...state,
            tablePile,
            players,
            error: new GameError(
              `Illegal move! Can not play a ${firstCard.rank} on a ${illegalMove.rank}.`,
              GAME_ERROR_ILLEGAL_MOVE_BLIND
            ),
          };
        }
      }

      // Remove cards from player
      for (const card of action.cards) {
        // Check if card can be played
        const illegalMove = getIllegalMove(card, state.tablePile);
        if (illegalMove) {
          error = new GameError(
            `Illegal move! Can not play a ${card.rank} on a ${illegalMove.rank}.`,
            GAME_ERROR_ILLEGAL_MOVE
          );
          break;
        }

        // Cards can be remove from all piles
        player.cardsHand = removeCard(card, player.cardsHand);
        player.cardsOpen = removeCard(card, player.cardsOpen);
        player.cardsClosed = removeCard(card, player.cardsClosed);
      }

      if (error) {
        return {
          ...state,
          error,
        };
      }

      // Add cards to pile
      let tablePile = [...state.tablePile, ...action.cards];

      const tableDeck = [...state.tableDeck];

      // Add cards back into players hand while there are cards in the deck and the player doesn't have enough in hand
      while (
        tableDeck.length &&
        player.cardsHand.length < state.startCardHandCount!
      ) {
        player.cardsHand.push(tableDeck.shift()!);
      }

      // Increase player turns
      player.turns = player.turns + 1;

      if (
        player.cardsClosed.length === 0 &&
        player.cardsOpen.length === 0 &&
        player.cardsHand.length === 0
      ) {
        player.isFinished = true;
      }

      const players = [...state.players];
      players[playerIdx] = player;

      // Check how many players are skipped by counting number of 8 cards played
      const skipPlayers = action.cards.filter(({ rank }) => rank === '8')
        .length;

      // Warn: pass new players data because of recent updates that haven't yet persisted to state yet
      const nextPlayer = getNextPlayer(player, players, skipPlayers);

      let nextPlayerUserId = nextPlayer.id;
      let tableDiscarded = state.tableDiscarded;
      if (shouldClearTheDeck(tablePile)) {
        // Move pile to discarded
        tableDiscarded = [...tableDiscarded, ...tablePile];
        tablePile = [];

        // Keep same player if not yet finished
        if (!player.isFinished) {
          nextPlayerUserId = player.id;
        }
      }

      // If only one player left
      let newGameState = state.state;
      if (players.filter(player => !player.isFinished).length === 1) {
        newGameState = 'ended';
      }

      // Successful turn
      return {
        ...state,
        state: newGameState,
        error: null,
        tablePile,
        tableDeck,
        tableDiscarded,
        players,
        currentPlayerUserId: nextPlayerUserId,
      };
    }
    case 'PICK': {
      const playerIdx = state.players.findIndex(
        player => player.id === action.userId
      );

      // If also picking own cards, they must be of the same rank!
      if (
        action.ownCards &&
        action.ownCards.length &&
        !areCardsTheSameRank(action.ownCards)
      ) {
        return {
          ...state,
          error: new GameError(
            'Illegal move! Cards must have the same rank.',
            GAME_ERROR_ILLEGAL_MOVE_CARD_RANKS_DONT_MATCH
          ),
        };
      }

      const player = { ...state.players[playerIdx] };

      // Take the (shit)pile
      player.cardsHand = [...player.cardsHand, ...state.tablePile];

      if (Array.isArray(action.ownCards)) {
        // Filter cards already in hand
        action.ownCards = action.ownCards.filter(
          card => !player.cardsHand.find(cardsEqualFn(card))
        );

        // Remove own cards from whatever pile
        player.cardsOpen = player.cardsOpen.filter(
          card => !action.ownCards!.find(cardsEqualFn(card))
        );
        player.cardsClosed = player.cardsClosed.filter(
          card => !action.ownCards!.find(cardsEqualFn(card))
        );

        // Add to cards in hand
        player.cardsHand = [...player.cardsHand, ...action.ownCards];
      }

      const newPlayers = [...state.players];
      newPlayers[playerIdx] = player;

      const nextPlayer = getNextPlayer(player, state.players);

      return {
        ...state,
        error: null,
        players: newPlayers,
        tablePile: [],
        currentPlayerUserId: nextPlayer.id,
      };
    }
  }
  return state;
};

const getPlayerById = (playerId: string, players: Player[]): Player => {
  const foundPlayer = players.find(({ id }) => id === playerId);
  if (!foundPlayer) {
    throw new Error('Could not find player!?');
  }
  return foundPlayer;
};

const getNextPlayer = (
  currentPlayer: Player,
  players: Player[],
  skip: number = 0
): Player => {
  // Filter player and sort by position
  const availablePlayers = players
    .filter(player => !player.isFinished)
    .sort((a, b) => a.position - b.position);

  // Find next player by getting first available player at higher position than current player
  let nextPlayerIdx = availablePlayers.findIndex(
    ({ position }) => position > currentPlayer.position
  );
  // If there's no player with a higher position
  if (nextPlayerIdx === -1) {
    // Back to first...
    nextPlayerIdx = 0;
  }

  while (skip > 0) {
    // Increase player idx
    nextPlayerIdx += 1;
    if (nextPlayerIdx > availablePlayers.length - 1) {
      // Back to first...
      nextPlayerIdx = 0;
    }

    skip--;
  }

  const nextPlayer = availablePlayers[nextPlayerIdx];
  if (!nextPlayer) {
    throw new Error('Could not find next player!?');
  }
  return nextPlayer;
};

const removeCard = (card: Card, cards: Card[]): Card[] => {
  const fn = cardsEqualFn(card);
  return cards.filter(c => !fn(c));
};

const getIllegalMove = (
  playingCard: Card,
  cards?: Card[]
): Card | undefined => {
  // Can always play an empty pile
  if (typeof cards === 'undefined' || !cards.length) {
    return;
  }

  // Special cards
  if (
    playingCard.rank === '2' ||
    playingCard.rank === '3' ||
    playingCard.rank === '10'
  ) {
    return;
  }

  // If we have a '3', move up the pile until there's no longer a 3
  const cardsCopy = [...cards];
  let currentCard = cardsCopy.pop()!;
  while (currentCard.rank === '3' && cardsCopy.length) {
    currentCard = cardsCopy.pop()!;
  }
  // If there's still a 3, that means the whole pile is made up out of 3's, so it's a free play
  if (currentCard.rank === '3') {
    return;
  }

  if (currentCard.rank === '7') {
    // Next card needs to be equal to or lower than 7
    return getRankIdx(playingCard) <= getRankIdx(currentCard)
      ? undefined
      : currentCard;
  }

  // Next card needs to be equal or higher than current
  return getRankIdx(playingCard) >= getRankIdx(currentCard)
    ? undefined
    : currentCard;
};

export const shouldClearTheDeck = (cards: Card[]) => {
  if (cards[cards.length - 1].rank === '10') {
    return true;
  }

  let currentRankIdx: number | undefined;
  let count: number = 0;
  const reversedCards = [...cards];
  reversedCards.reverse();
  for (const card of reversedCards) {
    if (typeof currentRankIdx === 'undefined') {
      currentRankIdx = getRankIdx(card);

      // We have one card of this rank
      count = 1;
    } else {
      // TODO: this doesn't work somehow
      if (card.rank === '3') {
        // Continue loop because 3 is invisible
        continue;
      }

      if (getRankIdx(card) === currentRankIdx) {
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

export const getTotalTurns = (players: Player[]): number => {
  return players.reduce((acc, player) => {
    acc = acc + player.turns;
    return acc;
  }, 0);
};

export const areCardsTheSameRank = (cards: Card[]): boolean => {
  // Check that all cards are the same rank
  if (cards.length > 1) {
    const firstRank = cards[0].rank;
    for (const card of cards) {
      if (card.rank !== firstRank) {
        return false;
      }
    }
  }

  return true;
};

export const findStartingPlayer = (players: Player[]) => {
  let iterateSuits = getIterator(suits);
  let iterateRanks = getIterator(
    // Filter 2s and 3s
    [...ranks].filter(r => !['2', '3'].includes(r))
  );
  iterateSuits.on('loop', () => {
    // Move on to next rank once we've looped suits
    iterateRanks.next();
  });

  let startingPlayer: Player | undefined;

  while (!startingPlayer) {
    players.find(player => {
      // Note: discuss whether or not it's allowed to have a club 4 in open cards

      // Search in hand only
      if (
        player.cardsHand.find(
          cardsEqualFn({ suit: iterateSuits.get(), rank: iterateRanks.get() })
        )
      ) {
        startingPlayer = player;

        // Break users loop
        return true;
      }
    });

    if (startingPlayer) {
      break;
    }

    // If we haven't found it after scanning all users, move on to the next card
    iterateSuits.next();
  }

  const startingCard: Card = {
    suit: iterateSuits.get(),
    rank: iterateRanks.get(),
  };
  return { startingPlayer, startingCard };
};
