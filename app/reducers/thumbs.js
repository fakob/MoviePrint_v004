import log from 'electron-log';
import { deleteProperty } from './../utils/utils';

const thumb = (state = {}, action, index) => {
  switch (action.type) {
    case 'ADD_THUMB':
      return Object.assign({}, state, {
        index
      });
    case 'ADD_THUMBS':
      return {
        thumbId: action.payload.thumbIdArray[index],
        frameId: action.payload.frameIdArray[index],
        frameNumber: action.payload.frameNumberArray[index],
        fileId: action.payload.fileId,
        index,
        hidden: false,
      };
    case 'CHANGE_THUMB':
      if (state.thumbId !== action.payload.thumbId) {
        return state;
      }
      return Object.assign({}, state, {
        frameId: action.payload.newFrameId,
        frameNumber: action.payload.newFrameNumber
      });
    case 'TOGGLE_THUMB':
      if (state.thumbId !== action.payload.thumbId) {
        return state;
      }
      return Object.assign({}, state, {
        hidden: !state.hidden
      });
    case 'UPDATE_FRAMENUMBER_OF_THUMB':
      if (state.thumbId !== action.payload.thumbId) {
        return state;
      }
      return Object.assign({}, state, {
        frameNumber: action.payload.frameNumber
      });
    case 'UPDATE_ORDER':
      // log.debug(state);
      // log.debug(state.id);
      // log.debug(index);
      // log.debug(action.payload.array[index].index);
      if (index === action.payload.array[index].index) {
        return state;
      }
      return Object.assign({}, action.payload.array[index], {
        index
      });
    default:
      return state;
  }
};

const thumbsByFileId = (state = [], action) => {
  switch (action.type) {
    case 'ADD_THUMB': {
      const newArray = state[action.payload.fileId][action.payload.mode].slice();
      newArray.splice(action.payload.index, 0, action.payload);
      const newArrayReordered = newArray.map((t, index) => thumb(t, action, index));
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.mode]: newArrayReordered
        }
      };
    }
    case 'ADD_THUMBS': {
      // load the current thumbs array, if it does not exist it stays empty
      let currentArray = [];
      if (state[action.payload.fileId] && state[action.payload.fileId][action.payload.mode]) {
        currentArray = state[action.payload.fileId][action.payload.mode].slice();
      }

      // create new thumbs array
      const newArray = Object.keys(action.payload.thumbIdArray).map((t, index) =>
        thumb(undefined, action, index));

      // combine current and new thumbs array
      let combinedArray = currentArray.concat(newArray);

      // sort and reindex combinedArray
      combinedArray.sort((a, b) => a.frameNumber - b.frameNumber);
      const reIndexedArray = combinedArray.map((item, index) => {
        return {...item, index: index}
      });
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.mode]: reIndexedArray
        }
      };
    }
    case 'CHANGE_THUMB':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.mode]: state[action.payload.fileId][action.payload.mode].map((t, index) =>
            thumb(t, action)
          )
        }
      };
    case 'TOGGLE_THUMB':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.mode]: state[action.payload.fileId][action.payload.mode].map((t, index) =>
            thumb(t, action)
          )
        }
      };
    case 'UPDATE_FRAMENUMBER_OF_THUMB':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.mode]: state[action.payload.fileId][action.payload.mode].map((t, index) =>
            thumb(t, action)
          )
        }
      };
    case 'UPDATE_ORDER':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.mode]: state[action.payload.fileId][action.payload.mode].map((t, index) =>
            thumb(t, action, index)
          )
        }
      };
    case 'REMOVE_THUMB':
      // create new state with thumb removed
      // log.debug(state);
      const tempState = state[action.payload.fileId][action.payload.mode]
        .slice(0, state[action.payload.fileId][action.payload.mode]
        .find(x => x.thumbId === action.payload.thumbId).index)
        .concat(state[action.payload.fileId][action.payload.mode]
        .slice(state[action.payload.fileId][action.payload.mode]
        .find(x => x.thumbId === action.payload.thumbId).index + 1)
      );
      // log.debug(tempState);

      // construct new UPDATE_ORDER action
      const tempAction = Object.assign({}, action, {
        type: 'UPDATE_ORDER',
        payload: {
          mode: action.payload.mode,
          currentFileId: action.payload.fileId,
          array: tempState
        },
      });

      // run UPDATE_ORDER on thumb
      return {
        ...state,
        [action.payload.fileId]: {
          [action.payload.mode]: tempState.map((t, index) =>
            thumb(t, tempAction, index)
          )
        }
      };
    case 'CLEAR_THUMBS':
      // if fileId is an empty string, then clear all thumbs
      // else only clear thumbs of specific fileId
      if (action.payload.fileId === '') {
        // fileId is empty, so delete everything
        return {};
      }
      if (state[action.payload.fileId] === undefined) {
        // fileId does not exist, so it does not have to be deleted
        return state;
      }
      const copyOfState = Object.assign({}, state);
      if (action.payload.mode === '') {
        // mode is empty, so delete whole fileId
        delete copyOfState[action.payload.fileId];
        return copyOfState;
      }
      if (state[action.payload.fileId][action.payload.mode] === undefined) {
        // mode does not exist, so it does not have to be deleted
        return state;
      }
      delete copyOfState[action.payload.fileId][action.payload.mode];
      return copyOfState;
    default:
      return state;
  }
};

export default thumbsByFileId;
