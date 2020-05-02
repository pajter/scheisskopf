import _ from 'lodash';

import { State, Action } from './types';

export const initialState: State = {
  session: null,
  error: null,
  roomError: null,
  loading: true,
  selectedCardIds: {
    hand: [],
    open: [],
  },
};

export const reducer = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case 'RESET': {
      return { ...initialState };
    }
    case 'SET_LOADING': {
      return { ...state, loading: action.loading };
    }
    case 'SET_SESSION': {
      // Side-effect: update localstorage
      localStorage.setItem('sessionId', action.session.sessionId);

      return { ...state, error: null, session: action.session };
    }
    case 'DESTROY_SESSION': {
      // Side-effect: update localstorage
      localStorage.removeItem('sessionId');
      localStorage.removeItem('roomId');

      return { ...state, session: null };
    }
    case 'SET_ERROR': {
      return { ...state, error: action.error };
    }
    case 'CLEAR_ERROR': {
      return { ...state, error: null };
    }
    case 'SET_ROOM_ERROR': {
      return { ...state, roomError: action.error };
    }
    case 'CLEAR_ROOM_ERROR': {
      return { ...state, roomError: null };
    }
    case 'SELECT_CARD': {
      return {
        ...state,
        selectedCardIds: {
          ...state.selectedCardIds,
          [action.stack]: [
            ...state.selectedCardIds[action.stack],
            action.cardId,
          ],
        },
      };
    }
    case 'DESELECT_CARD': {
      const newSelectedCardIds = state.selectedCardIds[action.stack].filter(
        (cardId) => cardId !== action.cardId
      );
      return {
        ...state,
        selectedCardIds: {
          ...state.selectedCardIds,
          [action.stack]: newSelectedCardIds,
        },
      };
    }
    case 'CLEAR_CARD_SELECTION': {
      return {
        ...state,
        selectedCardIds: {
          hand: [],
          open: [],
        },
      };
    }
  }

  return state;
};
