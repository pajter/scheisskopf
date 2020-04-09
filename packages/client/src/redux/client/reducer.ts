import _ from 'lodash';

import { State, Action } from './types';

export const initialState: State = {
  session: null,
  error: null,
};

export const reducer = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case 'RESET': {
      return { ...initialState };
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
