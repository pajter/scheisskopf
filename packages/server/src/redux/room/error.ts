import { CardId } from '../../../../_shared/types';

export const GAME_ERROR_USER_ALREADY_EXISTS = 'GAME_ERROR_USER_ALREADY_EXISTS' as const;
export const GAME_ERROR_SWAP_UNFAIR = 'GAME_ERROR_SWAP_UNFAIR' as const;
export const GAME_ERROR_ILLEGAL_MOVE = 'GAME_ERROR_ILLEGAL_MOVE' as const;
export const GAME_ERROR_ILLEGAL_MOVE_BLIND = 'GAME_ERROR_ILLEGAL_MOVE_BLIND' as const;
export const GAME_ERROR_ILLEGAL_MOVE_CARD_RANKS_DONT_MATCH = 'GAME_ERROR_ILLEGAL_MOVE_CARD_RANKS_DONT_MATCH' as const;
export const GAME_ERROR_NO_CARDS_PLAYED = 'GAME_ERROR_NO_CARDS_PLAYED' as const;
export const GAME_ERROR_ILLEGAL_MOVE_FIRST_TURN_MUST_HAVE_STARTING_CARD = 'GAME_ERROR_ILLEGAL_MOVE_FIRST_TURN_MUST_HAVE_STARTING_CARD' as const;
export const GAME_ERROR_ILLEGAL_MOVE_CARD_NOT_IN_HAND = 'GAME_ERROR_ILLEGAL_MOVE_CARD_NOT_IN_HAND' as const;
export const GAME_ERROR_ILLEGAL_MOVE_CARD_NOT_IN_OPEN_PILE = 'GAME_ERROR_ILLEGAL_MOVE_CARD_NOT_IN_OPEN_PILE' as const;
export const GAME_ERROR_COULD_NOT_FIND_STARTING_PLAYER = 'GAME_ERROR_COULD_NOT_FIND_STARTING_PLAYER' as const;

export type GameErrorCode =
  | typeof GAME_ERROR_USER_ALREADY_EXISTS
  | typeof GAME_ERROR_SWAP_UNFAIR
  | typeof GAME_ERROR_ILLEGAL_MOVE
  | typeof GAME_ERROR_ILLEGAL_MOVE_BLIND
  | typeof GAME_ERROR_NO_CARDS_PLAYED
  | typeof GAME_ERROR_ILLEGAL_MOVE_CARD_RANKS_DONT_MATCH
  | typeof GAME_ERROR_ILLEGAL_MOVE_FIRST_TURN_MUST_HAVE_STARTING_CARD
  | typeof GAME_ERROR_ILLEGAL_MOVE_CARD_NOT_IN_HAND
  | typeof GAME_ERROR_ILLEGAL_MOVE_CARD_NOT_IN_OPEN_PILE
  | typeof GAME_ERROR_COULD_NOT_FIND_STARTING_PLAYER;

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
