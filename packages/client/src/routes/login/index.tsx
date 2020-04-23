import React from 'react';
import { Redirect } from 'react-router-dom';

import { useSelector, useDispatch } from '../../redux/hooks';
import { Err } from '../../../../_shared/types';
import { useSocket } from '../../socket';

export function LoginRoute() {
  const { emitAndListen } = useSocket();
  const dispatch = useDispatch();

  const session = useSelector((state) => state.client.session);

  const [name, setName] = React.useState('');
  const [error, setError] = React.useState<Err>();

  if (session) {
    return <Redirect to="/" />;
  }

  const login = () => {
    emitAndListen(
      'LOGIN',
      {
        username: name,
      },
      ({ error, userId, username }) => {
        if (error) {
          setError(error);
        }

        if (userId && username) {
          dispatch({
            type: 'SET_SESSION',
            session: {
              username,
              userId,
            },
          });
        }
      }
    );
  };

  return (
    <div className="pad">
      {error && <pre>{error.message}</pre>}

      <input
        type="text"
        placeholder="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br />
      <br />

      <button disabled={!name} onClick={login}>
        Login
      </button>
    </div>
  );
}
