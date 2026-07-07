import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';

import { LandingPage } from '@/components/LandingPage';
import { TakeNoteApp } from '@/containers/TakeNoteApp';
import { PublicRoute } from '@/router/PublicRoute';
import { PrivateRoute } from '@/router/PrivateRoute';
import { getAuth } from '@/selectors';
import { login } from '@/slices/auth';

const isDemo = process.env.DEMO;

const LoadingSpinner: React.FC = () => (
  <div className="loading">
    <div className="la-ball-beat">
      <div />
      <div />
      <div />
    </div>
  </div>
);

const AppRoutes: React.FC<{ isDemo: boolean }> = ({ isDemo }) => (
  <Switch>
    {isDemo ? (
      <>
        <Route exact path="/" component={LandingPage} />
        <Route path="/app" component={TakeNoteApp} />
      </>
    ) : (
      <>
        <PublicRoute exact path="/" component={LandingPage} />
        <PrivateRoute path="/app" component={TakeNoteApp} />
      </>
    )}
    <Redirect to="/" />
  </Switch>
);

const AppHelmet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <HelmetProvider>
    <Helmet>
      <meta charSet="utf-8" />
      <title>TakeNote</title>
      <link rel="canonical" href="https://takenote.dev" />
    </Helmet>
    {children}
  </HelmetProvider>
);

export const App: React.FC = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector(getAuth);

  useEffect(() => {
    dispatch(login());
  }, [dispatch]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return <AppHelmet><AppRoutes isDemo={isDemo} /></AppHelmet>;
};