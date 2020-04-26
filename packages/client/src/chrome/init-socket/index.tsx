import React from 'react';

import { initSocket } from '../../socket';

export function InitSocket({ children }: { children: React.ReactNode }) {
  const [socketReady, setSocketReady] = React.useState(false);
  const [error, setError] = React.useState<Error>();

  React.useEffect(() => {
    setTimeout(() => {
      initSocket()
        .then(() => {
          setSocketReady(true);
        })
        .catch(() => {
          setError(new Error('Scheisskopf server unreachable!'));
        });
    }, 1);
  }, []);

  if (!error && socketReady) {
    return <>{children}</>;
  }

  if (error) {
    return (
      <div className="pad">
        <pre>{error.message}</pre>
      </div>
    );
  }

  return null;
}
