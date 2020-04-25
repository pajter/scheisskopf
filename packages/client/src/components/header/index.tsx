import React from 'react';

import { useSelector } from '../../redux/hooks';

export const Header = () => {
  const error = useSelector((state) => state.client.error);

  return error ? (
    <div className="pad">
      <pre>{error.message}</pre>
    </div>
  ) : null;
};
