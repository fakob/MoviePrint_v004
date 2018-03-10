const thumb = (state = {}, action, index) => {
  switch (action.type) {
    case 'ADD_THUMB':
      return {
        thumbId: action.thumbId,
        index: action.index,
        text: action.text,
        hidden: false
      };
    case 'ADD_DEFAULT_THUMBS':
      return {
        thumbId: action.thumbIdArray[index],
        frameId: action.frameIdArray[index],
        frameNumber: action.frameNumberArray[index],
        fileId: action.fileId,
        index,
        text: action.text,
        hidden: false,
        objectUrl: action.objectUrl
      };
    case 'ADD_THUMB_WITH_DETECT_FACE':
      return {
        thumbId: action.thumbId,
        index: action.index,
        text: action.text,
        hidden: false,
        objectUrl: action.objectUrl
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
      // console.log(state);
      // console.log(state.id);
      // console.log(index);
      // console.log(action.payload.array[index].index);
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
    case 'ADD_THUMB':
      return [
        //// code to insert thumb anywhere - not working yet
        //// see https://egghead.io/lessons/javascript-redux-avoiding-array-mutations-with-concat-slice-and-spread
        // ...state.slice(0, (action.index)),
        // thumb(undefined, action),
        // ...state.slice(action.index + 2)
        ...state,
        thumb(undefined, action)
      ];
    case 'ADD_DEFAULT_THUMBS':
      return {
        ...state,
        [action.fileId]: {
          width: action.width,
          height: action.height,
          thumbs: Object.keys(action.thumbIdArray).map((t, index) =>
            thumb(undefined, action, index))
        }
      };
    case 'ADD_THUMB_WITH_DETECT_FACE':
      return [
        ...state,
        thumb(undefined, action)
      ];
    case 'CHANGE_THUMB':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          thumbs: state[action.payload.fileId].thumbs.map((t, index) =>
            thumb(t, action)
          )
        }
      };
    case 'TOGGLE_THUMB':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          thumbs: state[action.payload.fileId].thumbs.map((t, index) =>
            thumb(t, action)
          )
        }
      };
    case 'UPDATE_FRAMENUMBER_OF_THUMB':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          thumbs: state[action.payload.fileId].thumbs.map((t, index) =>
            thumb(t, action)
          )
        }
      };
    case 'UPDATE_ORDER':
      return {
        ...state,
        [action.payload.fileId]: {
          ...state[action.payload.fileId],
          thumbs: state[action.payload.fileId].thumbs.map((t, index) =>
            thumb(t, action, index)
          )
        }
      };
    case 'REMOVE_THUMB':
      // create new state with thumb removed
      console.log(state);
      const tempState = state[action.payload.fileId].thumbs
        .slice(0, state[action.payload.fileId].thumbs
        .find(x => x.thumbId === action.payload.thumbId).index)
        .concat(state[action.payload.fileId].thumbs
        .slice(state[action.payload.fileId].thumbs
        .find(x => x.thumbId === action.payload.thumbId).index + 1)
      );
      console.log(tempState);

      // construct new UPDATE_ORDER action
      const tempAction = Object.assign({}, action, {
        type: 'UPDATE_ORDER',
        payload: {
          currentFileId: action.payload.fileId,
          array: tempState
        },
      });

      // run UPDATE_ORDER on thumb
      return {
        ...state,
        [action.payload.fileId]: {
          thumbs: tempState.map((t, index) =>
            thumb(t, tempAction, index)
          )
        }
      };
    // case 'UPDATE_OBJECTURL_FROM_THUMBLIST':
    //   // console.log(state[action.payload.currentFileId].thumbs);
    //   return {
    //     ...state,
    //     [action.payload.currentFileId]: {
    //       thumbs: state[action.payload.currentFileId].thumbs.map((t, index) =>
    //         thumb(t, action, index)
    //       )
    //     }
    //   };
    // case 'UPDATE_OBJECTURLS_FROM_THUMBLIST':
    //   // console.log('inside UPDATE_OBJECTURLS_FROM_THUMBLIST');
    //   return {
    //     ...state,
    //     [action.payload.fileId]: {
    //       thumbs: state[action.payload.fileId].thumbs.map((t, index) =>
    //         thumb(t, action, index)
    //       )
    //     }
    //   };
    case 'CLEAR_THUMBS':
      console.log('inside CLEAR_THUMBS');
      return {};
    default:
      return state;
  }
};

export default thumbsByFileId;
