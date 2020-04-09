import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import { HomeRoute } from '../../routes/home';

export function Router() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/">
          <HomeRoute />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}
