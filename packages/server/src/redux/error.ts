import { CardId } from '../../../_shared/types';

export const E_USER_ALREADY_EXISTS = 'E_USER_ALREADY_EXISTS' as const;
export const E_SWAP_UNFAIR = 'E_SWAP_UNFAIR' as const;
export const E_ILLEGAL_MOVE = 'E_ILLEGAL_MOVE' as const;
export const E_ILLEGAL_MOVE_BLIND = 'E_ILLEGAL_MOVE_BLIND' as const;
export const E_CARD_RANKS_DONT_MATCH = 'E_CARD_RANKS_DONT_MATCH' as const;
export const E_NO_CARDS_PLAYED = 'E_NO_CARDS_PLAYED' as const;
export const E_FIRST_TURN_MUST_HAVE_STARTING_CARD = 'E_FIRST_TURN_MUST_HAVE_STARTING_CARD' as const;
export const E_CARD_NOT_IN_HAND = 'E_CARD_NOT_IN_HAND' as const;
export const E_CARD_NOT_IN_OPEN_PILE = 'E_CARD_NOT_IN_OPEN_PILE' as const;
export const E_COULD_NOT_FIND_STARTING_PLAYER = 'E_COULD_NOT_FIND_STARTING_PLAYER' as const;

export type GameErrorCode =
  | typeof E_USER_ALREADY_EXISTS
  | typeof E_SWAP_UNFAIR
  | typeof E_ILLEGAL_MOVE
  | typeof E_ILLEGAL_MOVE_BLIND
  | typeof E_NO_CARDS_PLAYED
  | typeof E_CARD_RANKS_DONT_MATCH
  | typeof E_FIRST_TURN_MUST_HAVE_STARTING_CARD
  | typeof E_CARD_NOT_IN_HAND
  | typeof E_CARD_NOT_IN_OPEN_PILE
  | typeof E_COULD_NOT_FIND_STARTING_PLAYER;

export class GameError extends Error {
  code: GameErrorCode;
  playedCard?: CardId;
  illegalMoveCard?: CardId;

  constructor(
    code: GameErrorCode,
    playedCard?: CardId,
    illegalMoveCard?: CardId
  ) {
    super(code);

    this.code = code;
    this.playedCard = playedCard;
    this.illegalMoveCard = illegalMoveCard;
  }
}
