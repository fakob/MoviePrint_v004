import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ActionCreators as UndoActionCreators } from 'redux-undo';
import WorkerRoot from './containers/WorkerRoot';
import { configureStore, history } from './store/configureStore';

const store = configureStore();

render(
  <AppContainer>
    <WorkerRoot store={store} history={history} />
  </AppContainer>,
  document.getElementById('worker')
);

if (module.hot) {
  module.hot.accept('./containers/WorkerRoot', () => {
    const NextWorkerRoot = require('./containers/WorkerRoot').default; // eslint-disable-line global-require
    render(
      <AppContainer>
        <NextWorkerRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('worker')
    );
  });
}
