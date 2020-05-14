import _ from 'lodash';

import { State, Action } from './types';

export const reducer = (
  state: State | null = null,
  action: Action
): State | null => {
  switch (action.type) {
    case 'RESET': {
      return null;
    }
    case 'SYNC': {
      localStorage.setItem('roomId', action.state.roomId);

      return action.state;
    }
    case 'CLEAR_ROOM': {
      localStorage.removeItem('roomId');

      return null;
    }
  }

  return state;
};
