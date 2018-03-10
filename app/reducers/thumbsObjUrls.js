const thumbsObjUrls = (state = {}, action) => {
  switch (action.type) {
    case 'CLEAR_MOVIE_LIST':
      return {};
    case 'UPDATE_OBJECTURL_FROM_THUMBLIST':
      // console.log(action.payload.fileId);
      // console.log(action.payload.frameId);
      // console.log(action.payload.thumb);
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          [action.payload.frameId]: {
            objectUrl: window.URL.createObjectURL(
              action.payload.thumb.filter(obj => obj.frameId === action.payload.frameId)[0].data
            )
          }
        }
      };
    case 'UPDATE_OBJECTURLS_FROM_THUMBLIST':
      // console.log(action.payload.thumbs);
      // console.log(state);
      return {
        ...state,
        [action.payload.fileId]:
            action.payload.thumbs.reduce((previous, current) => {
              // console.log(previous);
              // console.log(current.data);
              const tempObject = Object.assign({}, previous,
                { [current.frameId]: { objectUrl: window.URL.createObjectURL(current.data) } }
              );
              // console.log(tempObject);
              return tempObject;
            }, {})
      };
    default:
      return state;
  }
};

export default thumbsObjUrls;
