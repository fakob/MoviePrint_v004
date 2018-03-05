import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ActionCreators as UndoActionCreators } from 'redux-undo';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
// import { loadState, saveState } from './store/localStorage';
import { updateFileDetails, updateThumbImage } from './actions';

const { ipcRenderer } = require('electron');

ipcRenderer.on('undo', () => {
  store.dispatch(UndoActionCreators.undo());
});

ipcRenderer.on('redo', () => {
  store.dispatch(UndoActionCreators.redo());
});

const store = configureStore();

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    const NextRoot = require('./containers/Root').default; // eslint-disable-line global-require
    // const NextRoot = require('./containers/Root'); // eslint-disable-line global-require
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
