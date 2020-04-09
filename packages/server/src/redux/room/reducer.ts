import _ from 'lodash';

import {
  ranks,
  suits,
  getCardObj,
  getIterator,
  getCardId,
  areCardsTheSameRank,
  getRankName,
} from '../../../../_shared/util';
import { CardId } from '../../../../_shared/types';

import {
  getDeck,
  getIllegalMove,
  shouldClearThePile,
  getTotalTurns,
} from '../../util';

import {
  GameError,
  GAME_ERROR_SWAP_UNFAIR,
  GAME_ERROR_NO_CARDS_PLAYED,
  GAME_ERROR_ILLEGAL_MOVE_CARD_RANKS_DONT_MATCH,
  GAME_ERROR_ILLEGAL_MOVE_FIRST_TURN_MUST_HAVE_STARTING_CARD,
  GAME_ERROR_ILLEGAL_MOVE_BLIND,
  GAME_ERROR_ILLEGAL_MOVE,
  GAME_ERROR_USER_ALREADY_EXISTS as GAME_ERROR_PLAYER_ALREADY_EXISTS,
} from './error';
import { State, Action, Player } from './types';

export const initialState: State = {
  roomId: '$$EMPTY',
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

export const reducer = (
  state: State = initialState,
  action: Action & { userId?: string }
): State => {
  switch (action.type) {
    case 'RESET': {
      return { ...initialState };
    }

    case 'JOIN': {
      if (!action.userId) {
        throw new Error('Missing userId!');
      }
      if (!action.socket) {
        throw new Error('Missing socket!');
      }

      if (state.players.find(({ id }) => id === action.userId)) {
        return {
          ...state,
          error: new GameError(
            'Player already exists.',
            GAME_ERROR_PLAYER_ALREADY_EXISTS
          ),
        };
      }
      const newPlayer = createPlayer(action.userId, action.name, action.socket);
      return { ...state, error: null, players: [...state.players, newPlayer] };
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
      const newPlayers = [...state.players];

      // Set dealer
      newPlayers[
        newPlayers.findIndex(({ id }) => id === action.userId)
      ].isDealer = true;

      const iteratePlayers = getIterator(newPlayers);
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

      // Sort players' cards
      newPlayers.forEach(sortPlayerCards);

      return {
        ...state,

        startCardHandCount,
        tableDeck: deck,
        tableDiscarded: [],
        tablePile: [],
        currentPlayerUserId: null,
        error: null,

        startingCard: null,
        players: newPlayers,
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
        (user) => user.id === action.userId
      );

      // Clone user
      const player = { ...state.players[currentPlayerIdx] };

      if (_.difference(action.cardsHand, player.cardsHand).length) {
        throw new Error('Card not in hand!');
      }
      if (_.difference(action.cardsOpen, player.cardsOpen).length) {
        throw new Error('Card not in open pile!');
      }

      // Swap cards
      player.cardsHand = [
        ..._.difference(player.cardsHand, action.cardsHand),
        ...action.cardsOpen,
      ];
      player.cardsOpen = [
        ..._.difference(player.cardsOpen, action.cardsOpen),
        ...action.cardsHand,
      ];

      // Sort player's cards
      sortPlayerCards(player);

      return {
        ...state,
        error: null,
        players: updatePlayers(state.players, player),
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

    case 'PAUSE': {
      return {
        ...state,
        state: 'paused',
      };
    }

    case 'PLAY': {
      if (!action.userId) {
        throw new Error('Missing userId!');
      }

      // Clone player
      const player = { ...getPlayerById(action.userId, state.players) };

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
      const blindCard =
        player.cardsHand.length === 0 &&
        player.cardsOpen.length === 0 &&
        action.cards.length === 1 &&
        player.cardsClosed.includes(action.cards[0])
          ? action.cards[0]
          : undefined;
      if (blindCard) {
        if (state.error?.code === GAME_ERROR_ILLEGAL_MOVE_BLIND) {
          // We can't make any more moves until the pile has been picked up
          return state;
        }

        const illegalMove = getIllegalMove(blindCard, state.tablePile);

        if (illegalMove) {
          // Add cards to pile
          const tablePile = [...state.tablePile, ...action.cards];

          // Remove blind card from closed cards
          player.cardsClosed = player.cardsClosed.filter(
            (c) => c !== blindCard
          );
          player.turns = player.turns + 1;

          return {
            ...state,
            tablePile,
            players: updatePlayers(state.players, player),

            error: new GameError(
              getIllegalMoveErrMessage(blindCard, illegalMove),
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
          return {
            ...state,

            error: new GameError(
              getIllegalMoveErrMessage(card, illegalMove),
              GAME_ERROR_ILLEGAL_MOVE
            ),
          };
        }

        // Cards can be removed from all piles
        player.cardsHand = player.cardsHand.filter((c) => c !== card);
        player.cardsOpen = player.cardsOpen.filter((c) => c !== card);
        player.cardsClosed = player.cardsClosed.filter((c) => c !== card);
      }

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
      if (isPlayerFinished(player)) {
        player.isFinished = true;
      }

      const newPlayers = updatePlayers(state.players, player);

      // Check how many players are skipped by counting number of 8 cards played
      const skipPlayers = action.cards.filter((c) => getCardObj(c).rank === 8)
        .length;

      // Warn: pass new players data because (instead of players still in `state`)
      const nextPlayer = getNextPlayer(player, newPlayers, skipPlayers);
      let nextPlayerUserId = nextPlayer.id;

      // Check for clear the deck
      let tableDiscarded = state.tableDiscarded;

      // Add cards to pile
      const tablePile = [...state.tablePile, ...action.cards];

      // If only one player left
      let newGameState = state.state;
      if (newPlayers.filter((player) => !player.isFinished).length === 1) {
        // A shithead has been crowned!
        newGameState = 'ended';
      } else if (shouldClearThePile(tablePile)) {
        // We check for clear the pile after checking if game is finished
        // else we would not be able to finish the game after clearing the deck
        newGameState = 'clear-the-pile';

        if (!player.isFinished) {
          // Keep same player when clearing the deck
          nextPlayerUserId = player.id;
        }
      }

      // Successful turn
      return {
        ...state,
        state: newGameState,
        error: null,
        tablePile,
        tableDeck,
        tableDiscarded,
        players: newPlayers,

        currentPlayerUserId: nextPlayerUserId,
      };
    }

    case 'CLEAR_THE_PILE': {
      // Move pile to discarded
      const tableDiscarded = [...state.tableDiscarded, ...state.tablePile];

      return {
        ...state,
        state: 'playing',
        tablePile: [],
        tableDiscarded,
      };
    }

    case 'PICK': {
      if (!action.userId) {
        throw new Error('Missing userId!');
      }

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

      const player = { ...getPlayerById(action.userId, state.players) };

      // Take the (shit)pile
      player.cardsHand = [...player.cardsHand, ...state.tablePile];

      if (action.ownCards && action.ownCards.length) {
        // Filter cards already in hand (this could happen by accident, we just want to make sure)
        action.ownCards = _.difference(action.ownCards, player.cardsHand);

        // Remove own cards from whatever pile
        player.cardsOpen = _.difference(player.cardsOpen, action.ownCards);
        player.cardsClosed = _.difference(player.cardsClosed, action.ownCards);

        // Add to cards in hand
        player.cardsHand = [...player.cardsHand, ...action.ownCards];
      }

      // Sort player's cards
      sortPlayerCards(player);

      const newPlayers = updatePlayers(state.players, player);

      const nextPlayer = getNextPlayer(player, newPlayers);

      return {
        ...state,
        error: null,

        tablePile: [],
        players: newPlayers,
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

const createPlayer = (
  id: string,
  name: string,
  socket: SocketIO.Socket
): Player => ({
  id,
  name,
  cardsClosed: [],
  cardsHand: [],
  cardsOpen: [],
  isFinished: false,
  isDealer: false,
  turns: 0,
  socket,
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

const updatePlayers = (players: Player[], newPlayer: Player) => {
  const idx = players.findIndex(({ id }) => id === newPlayer.id);
  if (idx < 0) {
    throw new Error('Could not find player?!');
  }
  const newPlayers = [...players];
  newPlayers[idx] = { ...newPlayer };
  return newPlayers;
};

const isPlayerFinished = (player: Player): boolean =>
  player.cardsClosed.length === 0 &&
  player.cardsOpen.length === 0 &&
  player.cardsHand.length === 0;

const sortPlayerCards = (player: Player): void => {
  // Only sort hand and open cards
  player.cardsHand = player.cardsHand.sort();
  player.cardsOpen = player.cardsOpen.sort();
};

const getIllegalMoveErrMessage = (card: CardId, illegalCard: CardId) => {
  return `Illegal move! Can not play a ${getRankName(
    getCardObj(card).rank
  )} on a ${getRankName(getCardObj(illegalCard).rank)}.`;
};
