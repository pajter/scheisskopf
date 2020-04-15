import _ from 'lodash';

import {
  getCardObj,
  getIterator,
  areCardsTheSameRank,
} from '../../../../_shared/util';

import {
  GameError,
  GAME_ERROR_SWAP_UNFAIR,
  GAME_ERROR_NO_CARDS_PLAYED,
  GAME_ERROR_ILLEGAL_MOVE_CARD_RANKS_DONT_MATCH,
  GAME_ERROR_ILLEGAL_MOVE_FIRST_TURN_MUST_HAVE_STARTING_CARD,
  GAME_ERROR_ILLEGAL_MOVE_BLIND,
  GAME_ERROR_ILLEGAL_MOVE,
  GAME_ERROR_USER_ALREADY_EXISTS as GAME_ERROR_PLAYER_ALREADY_EXISTS,
  GAME_ERROR_ILLEGAL_MOVE_CARD_NOT_IN_HAND,
  GAME_ERROR_ILLEGAL_MOVE_CARD_NOT_IN_OPEN_PILE,
  GAME_ERROR_COULD_NOT_FIND_STARTING_PLAYER,
} from './error';

import { State, Action } from './types';

import {
  calcCardCounts,
  createPlayer,
  findStartingPlayer,
  getNextPlayer,
  findPlayerById,
  isPlayerFinished,
  sortPlayerCards,
  updatePlayers,
  getDeck,
  getIllegalMoveCard,
  shouldClearThePile,
  getTotalTurns,
  getErrorState,
} from './util';

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

      const existingUser = findPlayerById(action.userId, state.players);
      if (existingUser) {
        return getErrorState(state, GAME_ERROR_PLAYER_ALREADY_EXISTS);
      }

      const newPlayer = createPlayer(action.userId, action.name);

      return {
        ...state,

        error: null,

        players: [...state.players, newPlayer],
      };
    }

    case 'LEAVE':
      return {
        ...state,

        error: null,

        players: state.players.filter(({ userId }) => userId !== action.userId),
      };

    case 'DEAL': {
      // Get shuffled deck
      const deck = getDeck(true);

      const playerCount = state.players.length;
      const newPlayers = [...state.players];

      // Set dealer
      newPlayers[
        newPlayers.findIndex(({ userId }) => userId === action.userId)
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

        error: null,

        state: 'pre-game',

        startCardHandCount,

        startingCard: null,

        tableDeck: deck,
        tableDiscarded: [],
        tablePile: [],

        players: newPlayers,
        currentPlayerUserId: null,
      };
    }

    case 'SWAP': {
      if (action.cardsHand.length !== action.cardsOpen.length) {
        return getErrorState(state, GAME_ERROR_SWAP_UNFAIR);
      }

      const currentPlayerIdx = state.players.findIndex(
        ({ userId }) => userId === action.userId
      );

      // Clone user
      const player = { ...state.players[currentPlayerIdx] };

      // Check if card is in hand
      if (_.difference(action.cardsHand, player.cardsHand).length) {
        return getErrorState(state, GAME_ERROR_ILLEGAL_MOVE_CARD_NOT_IN_HAND);
      }

      // Check if card is in open pile
      if (_.difference(action.cardsOpen, player.cardsOpen).length) {
        return getErrorState(
          state,
          GAME_ERROR_ILLEGAL_MOVE_CARD_NOT_IN_OPEN_PILE
        );
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
        return getErrorState(state, GAME_ERROR_COULD_NOT_FIND_STARTING_PLAYER);
      }

      return {
        ...state,

        error: null,

        currentPlayerUserId: startingPlayer.userId,

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
      const player = { ...findPlayerById(action.userId, state.players) };

      if (action.cards.length === 0) {
        return getErrorState(state, GAME_ERROR_NO_CARDS_PLAYED);
      }

      // Check that all cards are the same rank
      if (!areCardsTheSameRank(action.cards)) {
        return getErrorState(
          state,
          GAME_ERROR_ILLEGAL_MOVE_CARD_RANKS_DONT_MATCH
        );
      }

      // If start of game, the startingCard has to be played
      if (
        getTotalTurns(state.players) === 0 &&
        !action.cards.includes(state.startingCard!)
      ) {
        return getErrorState(
          state,
          GAME_ERROR_ILLEGAL_MOVE_FIRST_TURN_MUST_HAVE_STARTING_CARD
        );
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

        const illegalMoveCard = getIllegalMoveCard(blindCard, state.tablePile);

        if (illegalMoveCard) {
          // Add cards to pile
          const tablePile = [...state.tablePile, ...action.cards];

          // Remove blind card from closed cards
          player.cardsClosed = player.cardsClosed.filter(
            (c) => c !== blindCard
          );
          player.turns = player.turns + 1;

          return getErrorState(
            {
              ...state,
              tablePile,
              players: updatePlayers(state.players, player),
            },
            new GameError(
              GAME_ERROR_ILLEGAL_MOVE_BLIND,
              blindCard,
              illegalMoveCard
            )
          );
        }
      }

      // Remove cards from player
      for (const card of action.cards) {
        // Check if card can be played
        const illegalMoveCard = getIllegalMoveCard(card, state.tablePile);
        if (illegalMoveCard) {
          return getErrorState(
            state,
            new GameError(GAME_ERROR_ILLEGAL_MOVE, card, illegalMoveCard)
          );
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
      let nextPlayerUserId = nextPlayer.userId;

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
          nextPlayerUserId = player.userId;
        }
      }

      // Successful turn
      return {
        ...state,

        error: null,

        state: newGameState,

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

        error: null,

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
        return getErrorState(
          state,
          GAME_ERROR_ILLEGAL_MOVE_CARD_RANKS_DONT_MATCH
        );
      }

      const player = { ...findPlayerById(action.userId, state.players) };

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
        currentPlayerUserId: nextPlayer.userId,
      };
    }
  }

  return state;
};
