import _ from 'lodash';

import { State, Action, User } from './types';

export const initialState: State = {
  error: null,
  connectedUsers: [],
  rooms: [],
};

export const reducer = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'INIT': {
      return { ...state };
    }

    case 'SET_GLOBAL_ERROR': {
      return { ...state, error: action.error };
    }

    case 'CLEAR_GLOBAL_ERROR': {
      return { ...state, error: null };
    }

    case 'USER_CONNECT': {
      return {
        ...state,
        connectedUsers: [
          ...state.connectedUsers,
          createUser(action.userId, action.ip),
        ],
      };
    }

    case 'CREATE_ROOM': {
      return { ...state, error: null, rooms: [...state.rooms, action.newRoom] };
    }

    case 'USER_DISCONNECT': {
      return {
        ...state,
        connectedUsers: state.connectedUsers.filter(
          (user) => user.id !== action.userId
        ),
      };
    }
  }

  return state;
};

const createUser = (id: string, ip: string): User => ({
  id,
  ip,
});
