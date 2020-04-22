import React from 'react';
import {
  BrowserRouter,
  Switch,
  Route,
  Redirect,
  RouteProps,
} from 'react-router-dom';

import { useSelector } from '../../redux/hooks';

import { HomeRoute } from '../../routes/home';
import { LoginRoute } from '../../routes/login';
import { JoinRoute } from '../../routes/join';

function PrivateRoute({
  children,
  ...rest
}: RouteProps & { children: React.ReactNode }) {
  const session = useSelector((state) => state.client.session);

  return (
    <Route
      {...rest}
      render={({ location }) =>
        session ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: location },
            }}
          />
        )
      }
    />
  );
}

export function Router() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/login">
          <LoginRoute />
        </Route>

        <PrivateRoute path="/join">
          <JoinRoute />
        </PrivateRoute>

        <PrivateRoute path="/">
          <HomeRoute />
        </PrivateRoute>
      </Switch>
    </BrowserRouter>
  );
}
