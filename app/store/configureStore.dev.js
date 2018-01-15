import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { createHashHistory } from 'history';
import { routerMiddleware, push } from 'react-router-redux';
import { createLogger } from 'redux-logger';
import throttle from 'lodash/throttle';
import rootReducer from '../reducers';
import * as thumbActions from '../actions/index';
import type { counterStateType } from '../reducers/index';
import { loadState, saveState } from './localStorage';

const history = createHashHistory();

const configureStore = (initialState?: counterStateType) => {
// const configureStore = (initialState: ?counterStateType) => {
  // store State in localStorage
  let persistedState;
  if (typeof initialState === 'undefined') {
    persistedState = loadState();
  } else {
    persistedState = initialState;
  }

  // Redux Configuration
  const middleware = [];
  const enhancers = [];

  // Thunk Middleware
  middleware.push(thunk);

  // Logging Middleware
  const logger = createLogger({
    level: 'info',
    collapsed: true
  });

  // Skip redux logs in console during the tests
  if (process.env.NODE_ENV !== 'test') {
  middleware.push(logger);
  }

  // Router Middleware
  const router = routerMiddleware(history);
  middleware.push(router);

  // Redux DevTools Configuration
  const actionCreators = {
    ...thumbActions,
    push,
  };
  // If Redux DevTools Extension is installed use it, otherwise use Redux compose
  /* eslint-disable no-underscore-dangle */
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      // Options: http://zalmoxisus.github.io/redux-devtools-extension/API/Arguments.html
      actionCreators,
    })
    : compose;
  /* eslint-enable no-underscore-dangle */

  // Apply Middleware & Compose Enhancers
  enhancers.push(applyMiddleware(...middleware));
  const enhancer = composeEnhancers(...enhancers);

  // Create Store
  const store = createStore(rootReducer, persistedState, enhancer);

  store.subscribe(throttle(() => {
    saveState(store.getState());
    // // only store thumbs in localStorage
    // saveState({
    //   thumbs: store.getState().thumbs
    // });
  }, 1000));

  if (module.hot) {
    module.hot.accept('../reducers', () =>
      store.replaceReducer(require('../reducers')) // eslint-disable-line global-require
    );
  }

  return store;
};

export default { configureStore, history };
