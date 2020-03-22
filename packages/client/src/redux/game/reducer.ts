import { State, Action, Player } from './types';
import {
  getDeck,
  cardsEqualFn,
  ranks,
  suits,
  getRankIdx,
  getCardId,
} from '../../util';
import { Card } from '../../types';
import { GameError } from './error';

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
  moves: 0,
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
        };
      });

      // TODO: calc based on number of users
      const startCardHandCount = 3;
      let userPileCounts = {
        cardsClosed: 3,
        cardsOpen: 3,
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
        players: gameUsers,
        state: 'pre-game',
        moves: 0,
      };
    }
    case 'SWITCH_CARD': {
      const currentPlayerIdx = state.players.findIndex(
        user => user.id === action.userId
      );

      // Clone user
      const player = { ...state.players[currentPlayerIdx] };

      let [cardsHand, cardsOpen] = switchCard(
        action.cardFromHand,
        action.cardFromOpen,
        player.cardsHand,
        player.cardsOpen
      );

      player.cardsHand = cardsHand;
      player.cardsOpen = cardsOpen;

      // TODO: maybe find a way not to create a whole new players array?
      const newPlayers = [...state.players];
      newPlayers[currentPlayerIdx] = player;

      return {
        ...state,
        players: newPlayers,
      };
    }
    case 'START': {
      // Find user that gets to start
      let searchSuits = [...suits];
      let searchCard: Card = { suit: searchSuits.shift()!, rank: '4' };
      let foundPlayer: Player | undefined;

      while (!foundPlayer) {
        state.players.find(player => {
          // Note: discuss whether or not it's allowed to have a club 4 in open cards

          // Search in hand only
          if (player.cardsHand.find(cardsEqualFn(searchCard))) {
            foundPlayer = player;

            // Break users loop
            return true;
          }
        });

        if (foundPlayer) {
          break;
        }

        // If we haven't found it after scanning all users, move on to the next card
        const higherCard = getHigherCard(searchCard);
        if (!higherCard) {
          // Start from 4 on next suit
          searchCard = { suit: searchSuits.shift()!, rank: '4' };
        } else {
          searchCard = higherCard;
        }
      }

      if (!foundPlayer) {
        throw new Error('Could not find user with required card!?');
      }

      return {
        ...state,
        currentPlayerUserId: foundPlayer.id,
        startingCard: searchCard,
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
          error: new GameError('Play something!'),
        };
      }

      // Check that all cards are the same rank
      if (action.cards.length > 1) {
        const firstRank = action.cards[0].rank;
        action.cards.forEach(card => {
          if (card.rank !== firstRank) {
            error = new GameError(
              'Illegal move! Cards must have the same rank.'
            );
            return;
          }
        });
      }

      if (error) {
        return {
          ...state,
          error,
        };
      }

      // If start of game, the startingCard has to be played
      if (
        state.moves === 0 &&
        !action.cards.find(cardsEqualFn(state.startingCard!))
      ) {
        return {
          ...state,
          error: new GameError(
            'Illegal move! First card must include the starting card.'
          ),
        };
      }

      // Remove cards from player
      action.cards.forEach(card => {
        // Check if card can be played
        const illegalMove = getIllegalMove(card, state.tablePile);
        if (illegalMove) {
          error = new GameError(
            `Illegal move! Can not play a ${card.rank} on a ${illegalMove.rank}.`
          );
          return;
        }

        // Cards can be remove from all piles
        player.cardsHand = removeCard(card, player.cardsHand);
        player.cardsOpen = removeCard(card, player.cardsOpen);
        player.cardsClosed = removeCard(card, player.cardsClosed);
      });

      if (error) {
        return {
          ...state,
          error,
        };
      }

      // Add cards to pile
      const tablePile = [...state.tablePile, ...action.cards];

      // Add cards back into players hand while there are cards in the deck and the player doesn't have enough in hand
      const tableDeck = [...state.tableDeck];

      while (
        tableDeck.length &&
        player.cardsHand.length < state.startCardHandCount!
      ) {
        player.cardsHand.push(tableDeck.shift()!);
      }

      // TODO: maybe not copy all players
      const players = [...state.players];
      players[playerIdx] = player;

      if (shouldClearTheDeck(tablePile)) {
        return {
          ...state,
          error: null,
          tablePile: [],
          tableDeck,
          tableDiscarded: [...state.tableDiscarded, ...tablePile],
          players,
          moves: state.moves + 1,
        };
      }

      // Set next player
      const nextPlayer = getNextPlayer(player, state.players);

      return {
        ...state,
        error: null,
        tablePile,
        tableDeck,
        players,
        currentPlayerUserId: nextPlayer.id,
        moves: state.moves + 1,
      };
    }
    case 'PICK': {
      const playerIdx = state.players.findIndex(
        player => player.id === action.userId
      );

      const player = { ...state.players[playerIdx] };
      // Take the (shit)pile
      player.cardsHand = [...player.cardsHand, ...state.tablePile];

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

const getNextPlayer = (currentPlayer: Player, players: Player[]): Player => {
  let nextPosition: number = currentPlayer.position + 1;
  if (nextPosition > players.length - 1) {
    // Back to first position
    nextPosition = 0;
  }
  const nextPlayer = players.find(player => {
    return player.position === nextPosition;
  });
  if (!nextPlayer) {
    throw new Error('Could not find next player!?');
  }
  return nextPlayer;
};

const switchCard = (
  fromCard: Card,
  toCard: Card,
  from: Card[],
  to: Card[]
): [Card[], Card[]] => {
  const fromIdx = from.findIndex(cardsEqualFn(fromCard));
  const toIdx = to.findIndex(cardsEqualFn(toCard));
  if (fromIdx === -1 || toIdx === -1) {
    throw new Error('Card can not be switched! It is not in the pile.');
  }

  const newFrom = [...from];
  newFrom.splice(fromIdx, 1, toCard);
  const newTo = [...to];
  newTo.splice(toIdx, 1, fromCard);

  return [newFrom, newTo];
};

const removeCard = (card: Card, cards: Card[]): Card[] => {
  const fn = cardsEqualFn(card);
  return cards.filter(c => !fn(c));
};

const getHigherCard = (card: Card): Card | undefined => {
  const rankIdx = ranks.findIndex(rank => rank === card.rank);
  let nextRankIdx = rankIdx + 1;
  if (nextRankIdx > ranks.length - 1) {
    // Card higher than ace doesn't exist
    return;
  }

  // Return new card with previous or next rank
  return { ...card, rank: ranks[nextRankIdx] };
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
  for (const card of cards) {
    if (typeof currentRankIdx === 'undefined') {
      currentRankIdx = getRankIdx(card);
      count++;
    } else {
      if (card.rank === '3') {
        // Continue loop because 3 is invisible
        continue;
      }

      if (getRankIdx(card) === currentRankIdx) {
        count++;
      } else {
        break;
      }
    }
  }
  return count === 4;
};
