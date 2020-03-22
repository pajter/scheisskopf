import React from 'react';
import { Provider } from 'react-redux';
import { getStore } from '../../redux/store';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import { HomeRoute } from '../../routes/home';

const store = getStore();

export function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Switch>
          <Route path="/">
            <HomeRoute />
          </Route>
        </Switch>
      </BrowserRouter>
    </Provider>
  );
}
