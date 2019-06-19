// @flow
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createHashHistory } from 'history';
import { routerMiddleware } from 'connected-react-router';
import throttle from 'lodash/throttle';
import rootReducer from '../reducers';
import { loadState, saveState } from './localStorage';

const history = createHashHistory();
const router = routerMiddleware(history);
const enhancer = applyMiddleware(thunk, router);

function configureStore(initialState) {
  let persistedState;
  if (initialState === undefined) {
    persistedState = loadState();
  } else {
    persistedState = initialState;
  }

  // Create Store
  const store = createStore(rootReducer, persistedState, enhancer); // eslint-disable-line

  store.subscribe(throttle(() => {
    saveState(store.getState());
    // // only store thumbs in localStorage
    // saveState({
    //   thumbs: store.getState().thumbs
    // });
  }, 1000));

  return store;
}

export default { configureStore, history };
