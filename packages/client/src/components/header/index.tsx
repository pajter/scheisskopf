import React from 'react';

import { useSelector } from '../../redux/hooks';

export const Header = () => {
  const error = useSelector((state) => state.client.error);

  if (error) {
    return <pre>{error.message}</pre>;
  }

  return null;
};
