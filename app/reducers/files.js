
const file = (state = {}, type, payload, index) => {
  switch (type) {
    case 'LOAD_MOVIE_LIST_FROM_DROP':
      // console.log(payload[index]);
      // console.log(state);
      return Object.assign({}, {
        id: payload[index].id,
        lastModified: payload[index].lastModified,
        lastModifiedDate: payload[index].lastModifiedDate,
        name: payload[index].name,
        path: payload[index].path,
        size: payload[index].size,
        type: payload[index].type,
        webkitRelativePath: payload[index].webkitRelativePath,
        posterThumbId: payload[index].posterThumbId
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
    case 'UPDATE_OBJECTURL_FROM_POSTERFRAME':
      if (state.posterThumbId !== payload.id) {
        return state;
      }
      return Object.assign({}, state, {
        objectUrl: window.URL.createObjectURL(payload.thumb[0].data)
      });
      // return {
        // objectUrl: window.URL.createObjectURL(payload[index].data)
      // };
    case 'UPDATE_OBJECTURLS_FROM_POSTERFRAME':
      try {
        return Object.assign({}, state, {
          objectUrl: window.URL.createObjectURL(
            payload.thumbs.filter(obj => obj.id === payload.files[index].posterThumbId)[0].data
          )
        });
      } catch (e) {
        console.log('catch error in UPDATE_OBJECTURLS_FROM_POSTERFRAME', e);
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
        file(t, type, payload, index)
      );
    case 'UPDATE_MOVIE_LIST_ITEM':
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