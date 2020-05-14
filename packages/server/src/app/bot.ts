import _ from 'lodash';

import { ActionClient } from '../../../_shared/types';
import { groupCardsByRank, getCardObj, isDefined } from '../../../_shared/util';

import { Store, Bot } from '../redux/types';
import { getTotalTurns, getLegalAndIllegalCards } from '../redux/util';
import { syncRoom } from './rooms';

export class ScheissBot {
  roomStore: Store;
  userId: string;
  username: string;

  speed = 500;

  constructor(roomStore: Store, username?: string) {
    this.roomStore = roomStore;
    this.userId = this.createUniqueUserId();
    this.username = username || `Bot #${this.getBotNumber() + 1}`;

    this.roomStore.subscribe(this.update);
  }

  private getLastBot = (): Bot | undefined => {
    const bots = this.roomStore
      .getState()
      .players.filter((p): Bot | undefined =>
        'botSettings' in p ? p : undefined
      )
      .filter(isDefined) as Bot[];

    return bots[bots.length - 1];
  };

  private getBotNumber = (): number => {
    const lastBot = this.getLastBot();
    if (lastBot) {
      return +lastBot.userId.split('_').pop()!;
    }
    return 0;
  };

  private createUniqueUserId = () => {
    return `bot_${this.getBotNumber() + 1}`;
  };

  private update = () => {
    const state = this.roomStore.getState();

    if (state.state === 'ended' || state.state === 'pre-deal') {
      // No need to play
      return;
    }

    const player = state.players.find((p) => p.userId === this.userId);

    if (
      state.currentPlayerUserId === this.userId ||
      (player && player.hasStartingCard && getTotalTurns(state.players) === 0)
    ) {
      player && this.play(player as Bot);
    }
  };

  private dispatch(action: ActionClient) {
    this.roomStore.dispatch({ ...action, userId: this.userId });

    const actionClient = action.type.startsWith('$')
      ? undefined
      : (action as ActionClient);

    syncRoom(this.roomStore, actionClient);
  }

  private play = async (player: Bot) => {
    const state = this.roomStore.getState();

    const isPlaying = state.currentPlayerUserId === this.userId;
    if (!(isPlaying || player.hasStartingCard)) {
      return;
    }

    // Wait before playing
    await new Promise((r) => setTimeout(r, this.speed));

    if (state.state === 'clear-the-pile') {
      this.dispatch({ type: 'CLEAR_THE_PILE' });
      return;
    }

    if (state.state === 'pre-game') {
      // Swap
    }

    if (player.mustPick) {
      this.dispatch({
        type: 'PICK',
      });
      return;
    }

    if (player.cardsHand.length) {
      // Start with first card if possible
      if (getTotalTurns(state.players) === 0 && player.hasStartingCard) {
        this.dispatch({
          type: 'PLAY',
          cards: [player.hasStartingCard],
        });
        return;
      }

      const { legal, illegal } = getLegalAndIllegalCards(
        state.tablePile,
        player.cardsHand
      );

      if (legal.length) {
        const sorted = legal.sort();

        const ranks = groupCardsByRank(legal);

        // Play all lowest cards
        let cardsToPlay = ranks[getCardObj(sorted[0]).rank]!;

        // Check for a possibility to clear the deck
        const rankKeys = (Object.keys(
          ranks
        ) as unknown) as (keyof typeof ranks)[];
        const foundRankThatClears = rankKeys.find((rank) => {
          return ranks[rank]?.length === 4;
        });
        if (foundRankThatClears) {
          cardsToPlay = ranks[foundRankThatClears]!;
        }

        this.dispatch({
          type: 'PLAY',
          cards: cardsToPlay,
        });
        return;
      }

      if (illegal.length) {
        this.dispatch({
          type: 'PICK',
        });
        return;
      }
    }

    const playableCardsOpen = player.cardsOpen.filter(
      (c) => c !== null
    ) as string[];
    if (playableCardsOpen.length) {
      const { legal, illegal } = getLegalAndIllegalCards(
        state.tablePile,
        playableCardsOpen
      );

      if (legal.length) {
        // TODO: check which card is best
        // TODO: ability to play multiple cards
        this.dispatch({
          type: 'PLAY',
          cards: [legal[0]],
        });
        return;
      }

      if (illegal.length) {
        // TODO: check which illegal card is best to pick up
        this.dispatch({
          type: 'PICK',
          ownCards: [illegal[0]],
        });
        return;
      }
    }

    if (player.cardsBlind.filter((c) => c !== null).length) {
      const randomBlindIdx = player.cardsBlind.findIndex((p) => p !== null);

      this.dispatch({
        type: 'PLAY_BLIND',
        idx: randomBlindIdx,
      });
    }
  };
}
