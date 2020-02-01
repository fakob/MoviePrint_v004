// @flow
import React from 'react';
import { Provider } from 'react-redux';
import { hot } from 'react-hot-loader/root';
import App from './App';
import ErrorBoundary from '../components/ErrorBoundary';

type Props = {
  store: Store,
  history: {}
};

const Root = ({ store, history }: Props) => (
  <Provider store={store}>
    <ErrorBoundary>
      <App history={history} />
    </ErrorBoundary>
  </Provider>
);

export default hot(Root);
