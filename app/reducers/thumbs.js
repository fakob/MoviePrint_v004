import log from 'electron-log';
import { deleteProperty } from './../utils/utils';
import {
  SHEET_TYPE,
} from '../utils/constants';

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

const sheetsByFileId = (state = {}, action) => {
  switch (action.type) {
    case 'ADD_THUMB': {
      // load the current thumbs array, if it does not exist it stays empty
      log.debug(action.payload);
      log.debug(state);
      let currentArray = [];
      if (state[action.payload.fileId] && state[action.payload.fileId][action.payload.sheet]) {
        currentArray = state[action.payload.fileId][action.payload.sheet].thumbsArray.slice();
      }
      currentArray.splice(action.payload.index, 0, action.payload);
      const combinedArrayReordered = currentArray.map((t, index) => thumb(t, action, index));
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheet]: {
            // conditional adding of properties
            ...(state[action.payload.fileId] === undefined ?
              {} :
              state[action.payload.fileId][action.payload.sheet]
            ),
            thumbsArray: combinedArrayReordered
          }
        }
      };
    }
    case 'ADD_THUMBS': {
      // load the current thumbs array, if it does not exist it stays empty
      log.debug(action.payload);
      log.debug(state);
      let currentArray = [];
      if (state[action.payload.fileId] && state[action.payload.fileId][action.payload.sheet]) {
        currentArray = state[action.payload.fileId][action.payload.sheet].thumbsArray.slice();
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
          [action.payload.sheet]: {
            // conditional adding of properties
            ...(state[action.payload.fileId] === undefined ?
              {} :
              state[action.payload.fileId][action.payload.sheet]
            ),
            thumbsArray: reIndexedArray
          }
        }
      };
    }
    case 'CHANGE_THUMB':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheet]: {
            ...state[action.payload.fileId][action.payload.sheet],
            thumbsArray: state[action.payload.fileId][action.payload.sheet].thumbsArray.map((t, index) =>
              thumb(t, action)
            )
          }
        }
      };
    case 'TOGGLE_THUMB':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheet]: {
            ...state[action.payload.fileId][action.payload.sheet],
            thumbsArray: state[action.payload.fileId][action.payload.sheet].thumbsArray.map((t, index) =>
              thumb(t, action)
            )
          }
        }
      };
    case 'UPDATE_FRAMENUMBER_OF_THUMB':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheet]: {
            ...state[action.payload.fileId][action.payload.sheet],
            thumbsArray: state[action.payload.fileId][action.payload.sheet].thumbsArray.map(t =>
              thumb(t, action)
            )
          }
        }
      };
    case 'UPDATE_ORDER':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheet]: {
            ...state[action.payload.fileId][action.payload.sheet],
            thumbsArray: state[action.payload.fileId][action.payload.sheet].thumbsArray.map((t, index) =>
              thumb(t, action, index)
            )
          }
        }
      };
    case 'CLEAR_SHEETS':
      // if fileId is an empty string, then clear all sheets
      // else only clear sheets of specific fileId
      // console.log(action.payload);
      if (action.payload.fileId === '') {
        // fileId is empty, so delete everything
        return {};
      }
      if (state[action.payload.fileId] === undefined) {
        // fileId does not exist, so it does not have to be deleted
        return state;
      }
      const copyOfState = Object.assign({}, state);
      if (action.payload.sheet === '') {
        // sheet is empty, so delete whole fileId
        delete copyOfState[action.payload.fileId];
        return copyOfState;
      }
      if (state[action.payload.fileId][action.payload.sheet] === undefined) {
        // sheet does not exist, so it does not have to be deleted
        return state;
      }
      delete copyOfState[action.payload.fileId][action.payload.sheet];
      return copyOfState;
    case 'DELETE_SCENE_SHEETS':
      // console.log(action.payload);
      if (state[action.payload.fileId] === undefined) {
        // console.log('fileId does not exist');
        // fileId does not exist, so it does not have to be deleted
        return state;
      }
      const arrayOfKeys = Object.keys(state[action.payload.fileId]);
      // filter out interval and scenes sheet, as they do not be deleted
      const arrayOfKeysToDelete = arrayOfKeys.filter(item => (!item.startsWith(SHEET_TYPE.INTERVAL) || item.startsWith(SHEET_TYPE.SCENES)));
      // console.log(state);

      const fileId = action.payload.fileId;
      // separate the fileIds which do not change
      const { [fileId]: fileIdObject, ...otherObjects } = state;
      // console.log(fileIdObject);

      let newValue = fileIdObject;
      // loop through the arrayOfKeysToDelete and remove the property of every item in the array
      arrayOfKeysToDelete.map(childKey => {
        newValue = deleteProperty(newValue, childKey);
        // console.log(newValue);
      });

      // Merge back together
      const stateWithoutProperties = { ...otherObjects, [fileId]: newValue };
      // console.log(stateWithoutProperties);
      // console.log(arrayOfKeys);
      // console.log(arrayOfKeysToDelete);
      return stateWithoutProperties;
    default:
      return state;
  }
};

export default sheetsByFileId;
