// @flow
import React from 'react';
import { Provider } from 'react-redux';
import App from '.././components/App';

type RootType = {
  store: {},
  history: {}
};

export default function Root({ store, history }: RootType) {
  return (
    <Provider store={store}>
      <App history={history} />
    </Provider>
  );
}
