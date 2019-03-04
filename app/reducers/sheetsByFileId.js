import log from 'electron-log';
import { deleteProperty } from './../utils/utils';
import {
} from '../utils/constants';

const thumb = (state = {}, action, index) => {
  switch (action.type) {
    case 'TOGGLE_SCENE':
      if (state.sceneId !== action.payload.sceneId) {
        return state;
      }
      return Object.assign({}, state, {
        hidden: !state.hidden
      });
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
    case 'UPDATE_SCENEID_OF_THUMB':
      if (state.thumbId !== action.payload.thumbId) {
        return state;
      }
      return Object.assign({}, state, {
        sceneId: action.payload.sceneId
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
    case 'ADD_SCENE': {
      // load the current scenes array, if it does not exist it stays empty
      // log.debug(action.payload);
      // log.debug(state);
      let currentArray = [];
      if (state[action.payload.fileId] !== undefined &&
        state[action.payload.fileId][action.payload.sheetId] !== undefined &&
        state[action.payload.fileId][action.payload.sheetId].sceneArray !== undefined) {
        currentArray = state[action.payload.fileId][action.payload.sheetId].sceneArray.slice();
      }
      const combinedArray = currentArray.concat(action.payload);
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheetId]: {
            // conditional adding of properties
            ...(state[action.payload.fileId] === undefined ?
              {} :
              state[action.payload.fileId][action.payload.sheetId]
            ),
            sceneArray: combinedArray
          }
        }
      };
    }
    case 'UPDATE_SCENEARRAY':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheetId]: {
            // conditional adding of properties
            // only add when fileId exists
            ...(state[action.payload.fileId] === undefined ?
              {} :
              state[action.payload.fileId][action.payload.sheetId]
            ),
            sceneArray: action.payload.sceneArray,
          }
        }
      };
    case 'TOGGLE_SCENE':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheetId]: {
            ...state[action.payload.fileId][action.payload.sheetId],
            sceneArray: state[action.payload.fileId][action.payload.sheetId].sceneArray.map((t, index) =>
              thumb(t, action)
            )
          }
        }
      };
    case 'CLEAR_SCENES':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheetId]: {
            // conditional adding of properties
            // only add when fileId exists
            ...(state[action.payload.fileId] === undefined ?
              {} :
              state[action.payload.fileId][action.payload.sheetId]
            ),
            sceneArray: [],
          }
        }
      };
    case 'ADD_THUMB': {
      // load the current thumbs array, if it does not exist it stays empty
      log.debug(action.payload);
      log.debug(state);
      let currentArray = [];
      if (state[action.payload.fileId] !== undefined &&
        state[action.payload.fileId][action.payload.sheetId] !== undefined &&
        state[action.payload.fileId][action.payload.sheetId].thumbsArray !== undefined) {
        currentArray = state[action.payload.fileId][action.payload.sheetId].thumbsArray.slice();
      }
      currentArray.splice(action.payload.index, 0, action.payload);
      const combinedArrayReordered = currentArray.map((t, index) => thumb(t, action, index));
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheetId]: {
            // conditional adding of properties
            ...(state[action.payload.fileId] === undefined ?
              {} :
              state[action.payload.fileId][action.payload.sheetId]
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
      if (state[action.payload.fileId] !== undefined &&
        state[action.payload.fileId][action.payload.sheetId] !== undefined &&
        state[action.payload.fileId][action.payload.sheetId].thumbsArray !== undefined) {
        currentArray = state[action.payload.fileId][action.payload.sheetId].thumbsArray.slice();
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
          [action.payload.sheetId]: {
            // conditional adding of properties
            ...(state[action.payload.fileId] === undefined ?
              {} :
              state[action.payload.fileId][action.payload.sheetId]
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
          [action.payload.sheetId]: {
            ...state[action.payload.fileId][action.payload.sheetId],
            thumbsArray: state[action.payload.fileId][action.payload.sheetId].thumbsArray.map((t, index) =>
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
          [action.payload.sheetId]: {
            ...state[action.payload.fileId][action.payload.sheetId],
            thumbsArray: state[action.payload.fileId][action.payload.sheetId].thumbsArray.map((t, index) =>
              thumb(t, action)
            )
          }
        }
      };
    case 'UPDATE_SCENEID_OF_THUMB':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheetId]: {
            ...state[action.payload.fileId][action.payload.sheetId],
            thumbsArray: state[action.payload.fileId][action.payload.sheetId].thumbsArray.map(t =>
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
          [action.payload.sheetId]: {
            ...state[action.payload.fileId][action.payload.sheetId],
            thumbsArray: state[action.payload.fileId][action.payload.sheetId].thumbsArray.map(t =>
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
          [action.payload.sheetId]: {
            ...state[action.payload.fileId][action.payload.sheetId],
            thumbsArray: state[action.payload.fileId][action.payload.sheetId].thumbsArray.map((t, index) =>
              thumb(t, action, index)
            )
          }
        }
      };
    case 'DUPLICATE_SHEET':
      const sheetToDuplicate = state[action.payload.fileId][action.payload.sheetId];
      const duplicatedSheet = Object.assign({}, sheetToDuplicate);
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.newSheetId]: {
            ...duplicatedSheet,
          }
        }
      };
    case 'UPDATE_SHEET_SECONDSPERROW':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheetId]: {
            // conditional adding of properties
            // only add when fileId exists
            ...(state[action.payload.fileId] === undefined ?
              {} :
              state[action.payload.fileId][action.payload.sheetId]
            ),
            secondsPerRow: action.payload.secondsPerRow,
          }
        }
      };
    case 'UPDATE_SHEET_COLUMNCOUNT':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheetId]: {
            // conditional adding of properties
            // only add when fileId exists
            ...(state[action.payload.fileId] === undefined ?
              {} :
              state[action.payload.fileId][action.payload.sheetId]
            ),
            columnCount: action.payload.columnCount,
          }
        }
      };
    case 'UPDATE_SHEET_NAME':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheetId]: {
            // conditional adding of properties
            // only add when fileId exists
            ...(state[action.payload.fileId] === undefined ?
              {} :
              state[action.payload.fileId][action.payload.sheetId]
            ),
            name: action.payload.name,
          }
        }
      };
    case 'UPDATE_SHEET_VIEW':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheetId]: {
            // conditional adding of properties
            // only add when fileId exists
            ...(state[action.payload.fileId] === undefined ?
              {} :
              state[action.payload.fileId][action.payload.sheetId]
            ),
            sheetView: action.payload.sheetView,
          }
        }
      };
    case 'UPDATE_SHEET_TYPE':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheetId]: {
            // conditional adding of properties
            // only add when fileId exists
            ...(state[action.payload.fileId] === undefined ?
              {} :
              state[action.payload.fileId][action.payload.sheetId]
            ),
            type: action.payload.type,
          }
        }
      };
    case 'DELETE_SHEETS':
      // if fileId is an empty string, then clear all sheets
      // else only clear sheets of specific fileId
      console.log(action.payload);
      if (action.payload.fileId === undefined) {
        // fileId is empty, so delete everything
        return {};
      }
      if (state[action.payload.fileId] === undefined) {
        // fileId does not exist, so it does not have to be deleted
        return state;
      }
      const copyOfState = Object.assign({}, state);
      if (action.payload.sheetId === undefined) {
        // sheet is empty, so delete whole fileId
        delete copyOfState[action.payload.fileId];
        return copyOfState;
      }
      if (state[action.payload.fileId][action.payload.sheetId] === undefined) {
        // sheet does not exist, so it does not have to be deleted
        return state;
      }
      delete copyOfState[action.payload.fileId][action.payload.sheetId];
      return copyOfState;
    case 'DELETE_THUMBSARRAY':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.sheetId]: {
            // conditional adding of properties
            // only add when fileId exists
            ...(state[action.payload.fileId] === undefined ?
              {} :
              state[action.payload.fileId][action.payload.sheetId]
            ),
            thumbsArray: [],
          }
        }
      };
    default:
      return state;
  }
};

export default sheetsByFileId;
