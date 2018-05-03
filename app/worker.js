import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ActionCreators as UndoActionCreators } from 'redux-undo';
import WorkerRoot from './containers/workerRoot';
import { configureStore, history } from './store/configureStore';

const store = configureStore();

render(
  <AppContainer>
    <WorkerRoot store={store} history={history} />
  </AppContainer>,
  document.getElementById('worker')
);

if (module.hot) {
  module.hot.accept('./containers/workerRoot', () => {
    render(
      <AppContainer>
        <WorkerRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('worker')
    );
  });
}
