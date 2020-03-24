export const GAME_ERROR_SWAP_UNFAIR = 'GAME_ERROR_SWAP_UNFAIR' as const;
export const GAME_ERROR_ILLEGAL_MOVE = 'GAME_ERROR_ILLEGAL_MOVE' as const;
export const GAME_ERROR_ILLEGAL_MOVE_BLIND = 'GAME_ERROR_ILLEGAL_MOVE_BLIND' as const;
export const GAME_ERROR_ILLEGAL_MOVE_CARD_RANKS_DONT_MATCH = 'GAME_ERROR_ILLEGAL_MOVE_CARD_RANKS_DONT_MATCH' as const;
export const GAME_ERROR_NO_CARDS_PLAYED = 'GAME_ERROR_NO_CARDS_PLAYED' as const;
export const GAME_ERROR_ILLEGAL_MOVE_FIRST_TURN_MUST_HAVE_STARTING_CARD = 'GAME_ERROR_ILLEGAL_MOVE_FIRST_TURN_MUST_HAVE_STARTING_CARD' as const;

type Code =
  | typeof GAME_ERROR_SWAP_UNFAIR
  | typeof GAME_ERROR_ILLEGAL_MOVE
  | typeof GAME_ERROR_ILLEGAL_MOVE_BLIND
  | typeof GAME_ERROR_NO_CARDS_PLAYED
  | typeof GAME_ERROR_ILLEGAL_MOVE_CARD_RANKS_DONT_MATCH
  | typeof GAME_ERROR_ILLEGAL_MOVE_FIRST_TURN_MUST_HAVE_STARTING_CARD;

export class GameError extends Error {
  code: Code;
  constructor(msg: string, code: Code) {
    super(msg);
    this.code = code;
  }
}
