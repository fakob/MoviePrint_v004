import log from 'electron-log';
import { deleteProperty } from './../utils/utils';

const scene = (state = {}, action, index) => {
  switch (action.type) {
    case 'ADD_SCENE':
      return {
        sceneId: action.sceneId,
        start: action.start,
        length: action.length,
        colorArray: action.colorArray,
      };
    case 'TOGGLE_SCENE':
      if (state.sceneId !== action.payload.sceneId) {
        return state;
      }
      return Object.assign({}, state, {
        hidden: !state.hidden
      });
    default:
      return state;
  }
};

const scenesByFileId = (state = {}, action) => {
  switch (action.type) {
    case 'ADD_SCENE':
      // load the current scenes array, if it does not exist it stays empty
      let currentArray = [];
      if (state[action.payload.fileId] && state[action.payload.fileId].sceneArray) {
        currentArray = state[action.payload.fileId].sceneArray.slice();
      }
      let combinedArray = currentArray.concat(action.payload);
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          sceneArray: combinedArray
        }
      };
    case 'TOGGLE_SCENE':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          sceneArray: state[action.payload.fileId].sceneArray.map((t, index) =>
            scene(t, action)
          )
        }
      };
    case 'CLEAR_SCENES':
      // if fileId is an empty string, then clear all scenes
      // else only clear scenes of specific fileId
      if (action.payload.fileId === undefined) {
        return {};
      }
      return deleteProperty(state, action.payload.fileId);
    default:
      return state;
  }
};

export default scenesByFileId;
