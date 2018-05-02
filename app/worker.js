import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ActionCreators as UndoActionCreators } from 'redux-undo';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';

const store = configureStore();

render(
  <h1>Hello, world</h1>,
  document.getElementById('worker')
);

// if (module.hot) {
//   module.hot.accept('./containers/Root', () => {
//     render(
//       <h1>Hello, world</h1>,
//       document.getElementById('worker')
//     );
//   });
// }
