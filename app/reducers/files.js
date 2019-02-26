import log from 'electron-log';

const file = (state = {}, type, payload, index) => {
  switch (type) {
    case 'LOAD_MOVIE_LIST_FROM_DROP':
      // log.debug(payload[index]);
      // log.debug(state);
      return Object.assign({}, {
        id: payload[index].id,
        lastModified: payload[index].lastModified,
        // lastModifiedDate: payload[index].lastModifiedDate,
        name: payload[index].name,
        path: payload[index].path,
        size: payload[index].size,
        type: payload[index].type,
        webkitRelativePath: payload[index].webkitRelativePath,
        posterFrameId: payload[index].posterFrameId,
        columnCount: payload[index].columnCount,
      });
    case 'UPDATE_MOVIE_LIST_ITEM_USERATIO':
      if (state.id !== payload.fileId) {
        return state;
      }
      return Object.assign({}, state, {
        useRatio: payload.useRatio
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
    case 'UPDATE_OBJECTURL_FROM_POSTERFRAME':
      if (state.posterFrameId !== payload.frameId) {
        return state;
      }
      return Object.assign({}, state, {
        objectUrl: window.URL.createObjectURL(payload.frame.data)
      });
      // return {
        // objectUrl: window.URL.createObjectURL(payload[index].data)
      // };
    case 'UPDATE_OBJECTURLS_FROM_POSTERFRAME':
      try {
        return Object.assign({}, state, {
          objectUrl: window.URL.createObjectURL(
            payload.frames.filter(obj => obj.frameId === payload.files[index].posterFrameId)[0].data
          )
        });
      } catch (e) {
        log.error('catch error in UPDATE_OBJECTURLS_FROM_POSTERFRAME', e);
        return state;
      }
    default:
      return state;
  }
};

const files = (state = [], { type, payload }) => {
  switch (type) {
    case 'CLEAR_MOVIE_LIST':
      return [];
    case 'LOAD_MOVIE_LIST_FROM_DROP':
      return Object.keys(payload).map((t, index) =>
        file(t, type, payload, index));
    case 'REMOVE_MOVIE_LIST_ITEM': {
      const newArray = state.slice();
      const indexOfItemToRemove =
        newArray.findIndex((singleFile) => singleFile.id === payload.fileId);
      newArray.splice(indexOfItemToRemove, 1);
      return newArray;
    }
    case 'UPDATE_MOVIE_LIST_ITEM_USERATIO':
    case 'UPDATE_MOVIE_LIST_ITEM':
    case 'UPDATE_IN_OUT_POINT':
      return state.map((t, index) =>
        file(t, type, payload, index)
      );
    case 'UPDATE_OBJECTURL_FROM_POSTERFRAME':
      return state.map((t, index) =>
        file(t, type, payload, index)
      );
    case 'UPDATE_OBJECTURLS_FROM_POSTERFRAME':
      return payload.files.map((t, index) =>
        file(t, type, payload, index)
      );
    default:
      return state;
  }
};

export default files;
