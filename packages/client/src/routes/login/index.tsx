import React from 'react';
import { Redirect } from 'react-router-dom';

import { useSelector, useDispatch } from '../../redux/hooks';
import { Err } from '../../../../_shared/types';
import { useSocket } from '../../socket';

export function LoginRoute() {
  const { emitAndListen } = useSocket();

  const session = useSelector((state) => state.client.session);

  const dispatch = useDispatch();

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

      <h4>What is your name?</h4>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br />
      <br />

      <button disabled={!name} onClick={login}>
        Enter
      </button>
    </div>
  );
}
