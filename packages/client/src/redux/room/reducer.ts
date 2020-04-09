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
      return action.state;
    }
  }
  return state;
};
