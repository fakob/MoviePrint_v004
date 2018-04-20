const visibilitySettings = (state = {}, action) => {
  switch (action.type) {
    case 'SET_VISIBILITY_FILTER':
      return { ...state, visibilityFilter: action.filter };
    case 'TOGGLE_MOVIELIST':
      return { ...state, showMovielist: !state.showMovielist };
    case 'SHOW_MOVIELIST':
      return { ...state, showMovielist: true };
    case 'HIDE_MOVIELIST':
      return { ...state, showMovielist: false };
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings };
    case 'SHOW_SETTINGS':
      return { ...state, showSettings: true };
    case 'HIDE_SETTINGS':
      return { ...state, showSettings: false };
    case 'TOGGLE_PLAYBAR':
      return { ...state, showPlaybar: !state.showPlaybar };
    case 'SHOW_PLAYBAR':
      return { ...state, showPlaybar: true };
    case 'HIDE_PLAYBAR':
      return { ...state, showPlaybar: false };
    case 'SHOW_MOVIEPRINT_VIEW':
      return { ...state, showMoviePrintView: true };
    case 'SHOW_THUMB_VIEW':
      return { ...state, showMoviePrintView: false };
    // case 'TOGGLE_ZOOM_OUT':
    //   return { ...state, zoomOut: !state.zoomOut };
    // case 'ZOOM_OUT':
    //   return { ...state, zoomOut: true };
    // case 'ZOOM_IN':
    //   return { ...state, zoomOut: false };
    default:
      return state;
  }
};

export default visibilitySettings;
