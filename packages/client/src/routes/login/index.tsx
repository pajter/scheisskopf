import React from 'react';
import { Redirect } from 'react-router-dom';

import { emit } from '../../socket';
import { useSelector } from '../../redux/hooks';

export function LoginRoute() {
  const error = useSelector((state) => state.client.error);
  const session = useSelector((state) => state.client.session);

  const [name, setName] = React.useState('');

  if (session) {
    return <Redirect to="/" />;
  }

  const login = () => {
    emit('login', {
      username: name,
    });
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
