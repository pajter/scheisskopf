import difference from 'lodash-es/difference';
import reverse from 'lodash-es/reverse';

import { State, Action, Player } from './types';
import {
  getDeck,
  ranks,
  suits,
  getCardObj,
  getIterator,
  getCardId,
} from '../../util';
import { CardId } from '../../types';
import {
  GameError,
  GAME_ERROR_SWAP_UNFAIR,
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

  currentPlayerUserId: null,
  startCardHandCount: null,
  state: 'pre-deal',
  error: null,
  startingCard: null,
};

export const reducer = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case 'RESET': {
      return { ...initialState };
    }

    case 'JOIN': {
      const newPlayer = getPlayer(action.userId, state.players.length);
      return { ...state, players: [...state.players, newPlayer] };
    }

    case 'LEAVE':
      return {
        ...state,
        players: state.players.filter(({ id }) => id !== action.userId),
      };

    case 'DEAL': {
      // Get shuffled deck
      const deck = getDeck(true);

      const playerCount = state.players.length;
      const players = [...state.players];
      players[
        players.findIndex(({ id }) => id === action.userId)
      ].isDealer = true;
      const iteratePlayers = getIterator(players);
      const counts = calcCardCounts(playerCount);
      const startCardHandCount = counts.hand;

      // Multiply each by amount of players to get total amount of cards to deal
      let closed = counts.closed * playerCount;
      while (closed) {
        iteratePlayers.next().cardsClosed.push(deck.shift()!);
        closed--;
      }
      let open = counts.open * playerCount;
      while (open) {
        iteratePlayers.next().cardsOpen.push(deck.shift()!);
        open--;
      }
      let hand = counts.hand * playerCount;
      while (hand) {
        iteratePlayers.next().cardsHand.push(deck.shift()!);
        hand--;
      }

      return {
        ...state,

        startCardHandCount,
        tableDeck: deck,
        tableDiscarded: [],
        tablePile: [],
        currentPlayerUserId: null,
        error: null,
        startingCard: null,
        players: iteratePlayers.src,
        state: 'pre-game',
      };
    }

    case 'SWAP': {
      if (action.cardsHand.length !== action.cardsOpen.length) {
        return {
          ...state,
          error: new GameError('Swap must be fair!', GAME_ERROR_SWAP_UNFAIR),
        };
      }

      const currentPlayerIdx = state.players.findIndex(
        user => user.id === action.userId
      );

      // Clone user
      const player = { ...state.players[currentPlayerIdx] };

      if (difference(action.cardsHand, player.cardsHand).length) {
        throw new Error('Card not in hand!');
      }
      if (difference(action.cardsOpen, player.cardsOpen).length) {
        throw new Error('Card not in open pile!');
      }

      // Swap cards
      player.cardsHand = [
        ...difference(player.cardsHand, action.cardsHand),
        ...action.cardsOpen,
      ];
      player.cardsOpen = [
        ...difference(player.cardsOpen, action.cardsOpen),
        ...action.cardsHand,
      ];

      // TODO: maybe find a way not to create a whole new players array?
      const newPlayers = [...state.players];
      newPlayers[currentPlayerIdx] = player;

      return {
        ...state,
        error: null,
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
        !action.cards.includes(state.startingCard!)
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
        player.cardsClosed.includes(firstCard)
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
          player.cardsClosed = player.cardsClosed.filter(c => c !== firstCard);
          player.turns = player.turns + 1;

          const players = [...state.players];
          players[playerIdx] = player;

          return {
            ...state,
            tablePile,
            players,
            error: new GameError(
              `Illegal move! Can not play a ${
                getCardObj(firstCard).rank
              } on a ${getCardObj(illegalMove).rank}.`,
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
            `Illegal move! Can not play a ${getCardObj(card).rank} on a ${
              getCardObj(illegalMove).rank
            }.`,
            GAME_ERROR_ILLEGAL_MOVE
          );
          return {
            ...state,
            error,
          };
        }

        // Cards can be removed from all piles
        player.cardsHand = player.cardsHand.filter(c => c !== card);
        player.cardsOpen = player.cardsOpen.filter(c => c !== card);
        player.cardsClosed = player.cardsClosed.filter(c => c !== card);
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

      // Player is finished if there are no more cards left
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
      const skipPlayers = action.cards.filter(c => getCardObj(c).rank === 8)
        .length;

      // Warn: pass new players data because (instead of players still in `state`)
      const nextPlayer = getNextPlayer(player, players, skipPlayers);

      let nextPlayerUserId = nextPlayer.id;
      let tableDiscarded = state.tableDiscarded;
      if (shouldClearTheDeck(tablePile)) {
        // Move pile to discarded
        tableDiscarded = [...tableDiscarded, ...tablePile];
        tablePile = [];

        // Warn: only keep same player if not yet finished
        if (!player.isFinished) {
          nextPlayerUserId = player.id;
        }
      }

      // If only one player left
      let newGameState = state.state;
      if (players.filter(player => !player.isFinished).length === 1) {
        // A shithead has been crowned!
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
        // Filter cards already in hand (this could happen by accident, we just want to make sure)
        action.ownCards = difference(action.ownCards, player.cardsHand);

        // Remove own cards from whatever pile
        player.cardsOpen = difference(player.cardsOpen, action.ownCards);
        player.cardsClosed = difference(player.cardsClosed, action.ownCards);

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
  const currentPlayerIdx = players.findIndex(
    ({ id }) => id === currentPlayer.id
  );

  const iteratePlayers = getIterator([...players]);
  // Set iterator to current player
  iteratePlayers.set(currentPlayerIdx);
  // Move to next player that is still in the game
  iteratePlayers.forward(player => !player.isFinished);

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

const getIllegalMove = (
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

export const getTotalTurns = (players: Player[]): number => {
  return players.reduce((acc, player) => {
    acc = acc + player.turns;
    return acc;
  }, 0);
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

export const findStartingPlayer = (players: Player[]) => {
  let iterateSuits = getIterator(suits);
  let iterateRanks = getIterator(
    // Start from 4 (filter 2s and 3s)
    [...ranks].filter(r => r > 3)
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
        player.cardsHand.includes(
          getCardId({ suit: iterateSuits.get(), rank: iterateRanks.get() })
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

  return {
    startingPlayer,
    startingCard: getCardId({
      suit: iterateSuits.get(),
      rank: iterateRanks.get(),
    }),
  };
};

const getPlayer = (id: string, position: number) => ({
  id,
  position,
  cardsClosed: [],
  cardsHand: [],
  cardsOpen: [],
  isFinished: false,
  isDealer: false,
  turns: 0,
});

const calcCardCounts = (
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
