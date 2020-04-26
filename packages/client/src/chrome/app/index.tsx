import React from 'react';
import { Provider } from 'react-redux';

import { getStore } from '../../redux/store';
import { Router } from '../router';
import { InitSocket } from '../init-socket';
import { Init } from '../init';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';

const store = getStore();

export function App() {
  return (
    <Provider store={store}>
      <InitSocket>
        <Init />
        <Header />
        <Router />
        <Footer />
      </InitSocket>
    </Provider>
  );
}
