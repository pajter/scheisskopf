import { State } from './types';

export const initialState: State = {
  users: [],
};

export const reducer = (state = initialState, action: any) => {
  switch (action.type) {
    default:
      break;
  }
  return state;
};
