// import _ from 'lodash';

// import { CardId, CardRank } from '../../_shared/types';
// import { groupCardsByRank, getCardObj } from '../../_shared/util';

// import { GAME_ERROR_ILLEGAL_MOVE_BLIND } from './redux/room/error';
// import { Player } from './redux/room/types';

// import { getTotalTurns, getIllegalMoveCard } from './util';

// const store = {};

// // Subscribe to store updates
// store.subscribe(update);

// function update() {
//   const state = store.getState();

//   const currentPlayer = state.game.players.find(
//     (p) => p.id === state.game.currentPlayerUserId
//   );

//   if (currentPlayer && currentPlayer.botSettings) {
//     play(currentPlayer);
//   }
// }

// async function play(player: Player) {
//   await new Promise((r) => setTimeout(r, 1000));

//   const state = store.getState();
//   if (state.game.state === 'clear-the-pile') {
//     store.dispatch({
//       type: 'CLEAR_THE_PILE',
//     });
//     return;
//   }

//   if (state.game.state !== 'playing') {
//     return;
//   }

//   if (state.game.error?.code === GAME_ERROR_ILLEGAL_MOVE_BLIND) {
//     store.dispatch({
//       type: 'PICK',
//       userId: player.userId,
//     });
//     return;
//   }

//   if (player.cardsHand.length) {
//     // Start with first card if possible
//     if (
//       getTotalTurns(state.game.players) === 0 &&
//       player.cardsHand.includes(state.game.startingCard!)
//     ) {
//       store.dispatch({
//         type: 'PLAY',
//         userId: player.userId,
//         cards: [state.game.startingCard!],
//       });
//       return;
//     }

//     const { legal, illegal } = getLegalAndIllegalCards(player.cardsHand);
//     if (legal.length) {
//       const sorted = legal.sort();

//       const ranks = groupCardsByRank(legal);

//       // Play all lowest cards
//       let cardsToPlay = ranks[getCardObj(sorted[0]).rank]!;

//       // Check for a possibility to clear the deck
//       const foundRankThatClears = ((Object.keys(
//         ranks
//       ) as unknown) as CardRank[]).find((rank) => {
//         return ranks[rank]?.length === 4;
//       });
//       if (foundRankThatClears) {
//         cardsToPlay = ranks[foundRankThatClears]!;
//       }

//       store.dispatch({
//         type: 'PLAY',
//         userId: player.userId,
//         cards: cardsToPlay,
//       });
//       return;
//     }
//     if (illegal.length) {
//       store.dispatch({
//         type: 'PICK',
//         userId: player.userId,
//       });
//       return;
//     }
//   }

//   if (player.cardsOpen.length) {
//     const { legal, illegal } = getLegalAndIllegalCards(player.cardsOpen);
//     if (legal.length) {
//       // TODO: check which card is best
//       // TODO: ability to play multiple cards
//       store.dispatch({
//         type: 'PLAY',
//         userId: player.userId,
//         cards: [legal[0]],
//       });
//       return;
//     }
//     if (illegal.length) {
//       // TODO: check which illegal card is best to pick up
//       store.dispatch({
//         type: 'PICK',
//         userId: player.userId,
//         ownCards: [illegal[0]],
//       });
//       return;
//     }
//   }

//   if (player.cardsClosed.length) {
//     const randomBlindCard = _.sample(player.cardsClosed)!;
//     store.dispatch({
//       type: 'PLAY',
//       userId: player.userId,
//       cards: [randomBlindCard],
//     });
//   }
// }

// function getLegalAndIllegalCards(cards: CardId[]) {
//   const legal: CardId[] = [];
//   const illegal: CardId[] = [];
//   cards.forEach((card) => {
//     const illegalMove = getIllegalMoveCard(
//       card,
//       store.getState().game.tablePile
//     );
//     if (illegalMove) {
//       illegal.push(card);
//     } else {
//       legal.push(card);
//     }
//   });
//   return { legal, illegal };
// }
