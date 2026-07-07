import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Route, Switch, Redirect } from 'react-router-dom'
import { Helmet, HelmetProvider } from 'react-helmet-async'

import { LandingPage } from '@/components/LandingPage'
import { TakeNoteApp } from '@/containers/TakeNoteApp'
import { PublicRoute } from '@/router/PublicRoute'
import { PrivateRoute } from '@/router/PrivateRoute'
import { getAuth } from '@/selectors'
import { login } from '@/slices/auth'

const isDemo = process.env.DEMO

const LoadingSpinner: React.FC = () => (
  <div className="loading">
    <div className="la-ball-beat">
      <div />
      <div />
      <div />
    </div>
  </div>
)

const useAuthInit = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(login())
  }, [dispatch])
}

export const App: React.FC = () => {
  const { loading } = useSelector(getAuth)

  useAuthInit()

  if (loading) {
    return <LoadingSpinner />
  }

  const routes = isDemo ? (
    <>
      <Route exact path="/" component={LandingPage} />
      <Route path="/app" component={TakeNoteApp} />
    </>
  ) : (
    <>
      <PublicRoute exact path="/" component={LandingPage} />
      <PrivateRoute path="/app" component={TakeNoteApp} />
    </>
  )

  return (
    <HelmetProvider>
      <Helmet>
        <meta charSet="utf-8" />
        <title>TakeNote</title>
        <link rel="canonical" href="https://takenote.dev" />
      </Helmet>

      <Switch>
        {routes}
        <Redirect to="/" />
      </Switch>
    </HelmetProvider>
  )
}