import React from 'react';
import { Provider } from 'react-redux';

import { getStore } from '../../redux/store';
import { Router } from '../router';
import { Init } from '../init';
import { Header } from '../../components/header';

const store = getStore();

export function App() {
  return (
    <Provider store={store}>
      <Init />
      <Header />
      <Router />
    </Provider>
  );
}
