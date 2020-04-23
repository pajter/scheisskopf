import _ from 'lodash';

import { State, Action } from './types';

export const initialState: State = {
  session: null,
  error: null,
  loading: true,
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
      localStorage.setItem('username', action.session.username);
      localStorage.setItem('userId', action.session.userId);

      return { ...state, session: action.session };
    }
    case 'DESTROY_SESSION': {
      // Side-effect: update localstorage
      localStorage.removeItem('username');
      localStorage.removeItem('userId');

      return { ...state, session: null };
    }
    case 'SET_ERROR': {
      return { ...initialState, error: action.error };
    }
    case 'CLEAR_ERROR': {
      return { ...initialState, error: null };
    }
  }

  return state;
};
