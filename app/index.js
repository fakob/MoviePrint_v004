import React, { Fragment } from 'react';
import { render } from 'react-dom';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import { ActionCreators as UndoActionCreators } from 'redux-undo';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';

const { ipcRenderer } = require('electron');

ipcRenderer.on('undo', () => {
  store.dispatch(UndoActionCreators.undo());
});

ipcRenderer.on('redo', () => {
  store.dispatch(UndoActionCreators.redo());
});

const store = configureStore();

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

// if (module.hot) {
//   module.hot.accept('./containers/Root', () => {
//     // eslint-disable-line global-require
//
//     const NextRoot = require('./containers/Root').default;
//     render(
//       <AppContainer>
//         <NextRoot store={store} history={history} />
//       </AppContainer>,
//       document.getElementById('root')
//     );
//   });
// }
