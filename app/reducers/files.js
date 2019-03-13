import log from 'electron-log';

const file = (state = {}, type, payload, index) => {
  switch (type) {
    case 'UPDATE_SHEETCOUNTER':
      if (state.id !== payload.fileId) {
        return state;
      }
      return Object.assign({}, state, {
        sheetCounter: ((state.sheetCounter || 0) + payload.incrementValue),
      });
    case 'UPDATE_FILESCAN_STATUS':
      if (state.id !== payload.fileId) {
        return state;
      }
      return Object.assign({}, state, {
        fileScanStatus: payload.fileScanStatus
      });
    case 'UPDATE_MOVIE_LIST_ITEM_USERATIO':
      if (state.id !== payload.fileId) {
        return state;
      }
      return Object.assign({}, state, {
        useRatio: payload.useRatio
      });
    case 'REPLACE_MOVIE_LIST_ITEM':
      if (state.id !== payload.fileId) {
        return state;
      }
      return Object.assign({}, state, {
        path: payload.path,
        name: payload.name,
        size: payload.size,
        lastModified: payload.lastModified,
      });
    case 'UPDATE_MOVIE_LIST_ITEM':
      if (state.id !== payload.fileId) {
        return state;
      }
      return Object.assign({}, state, {
        frameCount: payload.frameCount,
        width: payload.width,
        height: payload.height,
        fps: payload.fps,
        fourCC: payload.fourCC
      });
    case 'UPDATE_IN_OUT_POINT':
      if (state.id !== payload.fileId) {
        return state;
      }
      return Object.assign({}, state, {
        fadeInPoint: payload.fadeInPoint,
        fadeOutPoint: payload.fadeOutPoint
      });
    default:
      return state;
  }
};

const files = (state = [], { type, payload }) => {
  switch (type) {
    case 'CLEAR_MOVIE_LIST':
      return [];
    case 'ADD_MOVIE_LIST_ITEMS': {
      log.debug(payload);
      log.debug(state);
      // combine state array and new files array
      const combinedArray = state.concat(payload);
      log.debug(combinedArray);
      return combinedArray;
    }
    case 'REMOVE_MOVIE_LIST_ITEM': {
      const newArray = state.slice();
      const indexOfItemToRemove =
        newArray.findIndex((singleFile) => singleFile.id === payload.fileId);
      newArray.splice(indexOfItemToRemove, 1);
      return newArray;
    }
    case 'REPLACE_MOVIE_LIST_ITEM':
    case 'UPDATE_MOVIE_LIST_ITEM_USERATIO':
    case 'UPDATE_MOVIE_LIST_ITEM':
    case 'UPDATE_IN_OUT_POINT':
    case 'UPDATE_FILESCAN_STATUS':
    case 'UPDATE_SHEETCOUNTER':
      return state.map((t, index) =>
        file(t, type, payload, index)
      );
    default:
      return state;
  }
};

export default files;
