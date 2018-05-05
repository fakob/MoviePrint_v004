// @flow
import React from 'react';
import { Provider } from 'react-redux';
import WorkerApp from './WorkerApp';

type RootType = {
  store: {},
  history: {}
};

export default function WorkerRoot({ store, history }: RootType) {
  return (
    <Provider store={store}>
      <WorkerApp history={history} />
    </Provider>
  );
}
