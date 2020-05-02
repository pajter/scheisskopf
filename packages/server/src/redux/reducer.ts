import _ from 'lodash';

import {
  getCardObj,
  getIterator,
  areCardsTheSameRank,
} from '../../../_shared/util';

import {
  GameError,
  E_SWAP_UNFAIR,
  E_NO_CARDS_PLAYED,
  E_CARD_RANKS_DONT_MATCH,
  E_FIRST_TURN_MUST_HAVE_STARTING_CARD,
  E_ILLEGAL_MOVE_BLIND,
  E_ILLEGAL_MOVE,
  E_CARD_NOT_IN_HAND,
  E_CARD_NOT_IN_OPEN_PILE,
} from '../../../_shared/error';

import { State, Action } from './types';

import {
  calcCardCounts,
  createPlayer,
  findStartingPlayer,
  getNextPlayer,
  findPlayerById,
  isPlayerFinished,
  updatePlayers,
  getDeck,
  getIllegalMoveCard,
  getTotalTurns,
  getErrorState,
  createSpectator,
  assertGameState,
} from './util';

export const initialState: State = {
  // Use this string because we will always have a defined room ID string when creating the room
  roomId: '$$EMPTY',

  tablePile: [],
  tableDeck: [],
  tableDiscarded: [],

  players: [],
  spectactors: [],

  currentPlayerUserId: '$$EMPTY',
  startCardHandCount: -1,

  state: 'pre-deal',

  error: null,
};

export const reducer = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    //
    // PRIVATE ACTIONS
    // ----------------------------

    case '$JOIN': {
      // Add user to spectators when game is in progress
      if (state.state !== 'pre-deal') {
        return {
          ...state,

          error: null,

          spectactors: [...state.spectactors, createSpectator(action.user)],
        };
      }

      return {
        ...state,

        error: null,

        players: [
          ...state.players,
          createPlayer(action.user, state.players.length === 0),
        ],
      };
    }

    case '$REJOIN': {
      return {
        ...state,

        players: updatePlayers(
          state.players,
          (user) => ({ ...user, connected: true }),
          action.user.userId
        ),
      };
    }

    case '$USER_DISCONNECT': {
      return {
        ...state,

        players: updatePlayers(
          state.players,
          (player) => ({ ...player, connected: false }),
          action.user.userId
        ),
      };
    }

    //
    // PUBLIC ACTIONS
    // ----------------------------

    case 'LEAVE':
      return {
        ...state,

        error: null,

        players: state.players.filter(
          ({ userId }) => userId !== action.user.userId
        ),
      };

    case 'RESET': {
      return { ...initialState };
    }

    case 'DEAL': {
      // Clone
      let players = state.players.map((p) => ({
        ...p,
        isFinished: false,
        cardsBlind: [],
        cardsHand: [],
        cardsOpen: [],
        turns: 0,
        hasStartingCard: false,
      }));

      // Get shuffled deck
      const deck = getDeck(true);

      const playerCount = players.length;
      const counts = calcCardCounts(playerCount);
      const startCardHandCount = counts.hand;

      const iteratePlayers = getIterator(players);

      // Multiply each by amount of players to get total amount of cards to deal
      let blind = counts.blind * playerCount;
      while (blind) {
        iteratePlayers.next().cardsBlind.push(deck.shift()!);
        blind--;
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

      // Refresh players from iterator
      players = iteratePlayers.getItems();

      // Sort players' cards
      players.forEach((p) => {
        // Only sort hand and open cards
        p.cardsHand = p.cardsHand.sort();
        p.cardsOpen = p.cardsOpen.sort();
      });

      // Find starting player
      players = findStartingPlayer(players);

      const startingPlayer = players.find((p) => p.hasStartingCard)!;

      return {
        ...state,

        error: null,

        state: 'pre-game',

        tableDeck: deck,
        tableDiscarded: [],
        tablePile: [],

        startCardHandCount,

        players,
        currentPlayerUserId: startingPlayer.userId,
      };
    }

    case 'SWAP': {
      if (action.cardsHand.length !== action.cardsOpen.length) {
        throw new GameError(E_SWAP_UNFAIR);
      }

      let player = findPlayerById(action.user.userId, state.players);
      if (!player) {
        return state;
      }

      // Clone player
      player = { ...player };

      // Check if card is in hand
      if (_.difference(action.cardsHand, player.cardsHand).length) {
        throw new GameError(E_CARD_NOT_IN_HAND);
      }

      // Check if card is in open pile
      if (_.difference(action.cardsOpen, player.cardsOpen).length) {
        throw new GameError(E_CARD_NOT_IN_OPEN_PILE);
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

      // Only sort hand and open cards
      player.cardsHand = player.cardsHand.sort();
      player.cardsOpen = player.cardsOpen.sort();

      return {
        ...state,

        error: null,

        players: updatePlayers(state.players, player),
      };
    }

    case 'PAUSE': {
      return {
        ...state,

        state: 'paused',
      };
    }

    case 'PLAY': {
      // Clone player
      let player = findPlayerById(action.user.userId, state.players);
      if (!player) {
        return state;
      }
      player = { ...player };

      if (action.cards.length === 0) {
        throw new GameError(E_NO_CARDS_PLAYED);
      }

      // Check that all cards are the same rank
      if (!areCardsTheSameRank(action.cards)) {
        throw new GameError(E_CARD_RANKS_DONT_MATCH);
      }

      if (getTotalTurns(state.players) === 0) {
        // Update state when making first play
        state.state = 'playing';
      }

      // If start of game, the startingCard has to be played
      if (
        getTotalTurns(state.players) === 0 &&
        player.hasStartingCard &&
        !action.cards.includes(player.hasStartingCard)
      ) {
        throw new GameError(E_FIRST_TURN_MUST_HAVE_STARTING_CARD);
      }

      for (const card of action.cards) {
        // Check if card can be played
        const illegalMoveCard = getIllegalMoveCard(card, state.tablePile);
        if (illegalMoveCard) {
          return getErrorState(
            state,
            new GameError(E_ILLEGAL_MOVE, card, illegalMoveCard)
          );
        }

        // Remove cards from hand
        player.cardsHand = player.cardsHand.filter((c) => c !== card);
        // Nullify open cards
        player.cardsOpen = player.cardsOpen.map((c) => (c === card ? null : c));
      }

      // Add cards back into players hand while there are cards in the deck and the player doesn't have enough in hand
      const tableDeck = [...state.tableDeck];
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

      // Create new players before modifying them
      const playersClone = updatePlayers(state.players, player);

      // Check how many players are skipped by counting number of 8 cards played
      const skipPlayers = action.cards.filter((c) => getCardObj(c).rank === 8)
        .length;

      // Warn: pass new players data
      const nextPlayer = getNextPlayer(player, playersClone, skipPlayers);

      // Add cards to pile
      const tablePile = [...state.tablePile, ...action.cards];

      const { gameState, nextPlayerUserId, players } = assertGameState(
        state.state,
        nextPlayer.userId,
        playersClone,
        player,
        tablePile
      );

      // Successful turn
      return {
        ...state,

        error: null,

        state: gameState,

        tablePile,
        tableDeck,

        players,
        currentPlayerUserId: nextPlayerUserId,
      };
    }

    case 'PLAY_BLIND': {
      // Clone player
      let player = findPlayerById(action.user.userId, state.players);
      if (!player) {
        return state;
      }

      if (typeof action.idx === 'undefined') {
        throw new GameError(E_NO_CARDS_PLAYED);
      }

      if (state.error?.code === E_ILLEGAL_MOVE_BLIND) {
        // We can't make any more moves until the pile has been picked up
        return state;
      }

      const blindCard = player.cardsBlind[action.idx];
      if (blindCard === null) {
        // Impossible
        return state;
      }

      // Remove blind card from player (nullify)
      player.cardsBlind[action.idx] = null;

      // Put blind card on pile
      const tablePile = [...state.tablePile, blindCard];

      player.turns = player.turns + 1;

      const illegalMoveCard = getIllegalMoveCard(blindCard, state.tablePile);
      if (illegalMoveCard) {
        return getErrorState(
          {
            ...state,
            tablePile,
            players: updatePlayers(state.players, player),
          },
          new GameError(E_ILLEGAL_MOVE_BLIND, blindCard, illegalMoveCard)
        );
      }

      // Player is finished if there are no more cards left
      if (isPlayerFinished(player)) {
        player.isFinished = true;
      }

      // Create all new players before modifying them
      const playersClone = updatePlayers(state.players, player);

      // Check if player needs to be skipped because of 8 card
      const skipPlayers = getCardObj(blindCard).rank === 8 ? 1 : 0;

      // Warn: pass new players data because (instead of players still in `state`)
      const nextPlayer = getNextPlayer(player, playersClone, skipPlayers);

      // Check game state
      const { gameState, nextPlayerUserId, players } = assertGameState(
        state.state,
        nextPlayer.userId,
        playersClone,
        player,
        tablePile
      );

      // Successful turn
      return {
        ...state,

        error: null,

        state: gameState,

        tablePile,

        players,
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
      // If also picking own cards, they must be of the same rank!
      if (
        action.ownCards &&
        action.ownCards.length &&
        !areCardsTheSameRank(action.ownCards)
      ) {
        throw new GameError(E_CARD_RANKS_DONT_MATCH);
      }

      const player = findPlayerById(action.user.userId, state.players);
      if (!player) {
        return state;
      }

      // Take the (shit)pile
      player.cardsHand = [...player.cardsHand, ...state.tablePile];

      if (action.ownCards && action.ownCards.length) {
        // Filter cards already in hand (this could happen by accident, we just want to make sure)
        action.ownCards = _.difference(action.ownCards, player.cardsHand);

        // Remove own cards from open stack
        player.cardsOpen = player.cardsOpen.map((c) => {
          if (c && action.ownCards!.includes(c)) {
            // Nullify
            return null;
          }
          return c;
        });

        // Add to cards in hand
        player.cardsHand = [...player.cardsHand, ...action.ownCards];
      }

      // Sort player's cards
      player.cardsHand = player.cardsHand.sort();

      player.turns = player.turns + 1;

      const players = updatePlayers(state.players, player);

      const nextPlayer = getNextPlayer(player, players);

      return {
        ...state,

        error: null,

        tablePile: [],

        players,
        currentPlayerUserId: nextPlayer.userId,
      };
    }
  }

  return state;
};
