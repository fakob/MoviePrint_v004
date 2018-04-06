const visibilitySettings = (state = {}, action) => {
  switch (action.type) {
    case 'SET_VISIBILITY_FILTER':
      return { ...state, visibilityFilter: action.filter };
    case 'TOGGLE_LEFT_SIDEBAR':
      return { ...state, showLeftSidebar: !state.showLeftSidebar };
    case 'SHOW_LEFT_SIDEBAR':
      return { ...state, showLeftSidebar: true };
    case 'HIDE_LEFT_SIDEBAR':
      return { ...state, showLeftSidebar: false };
    case 'TOGGLE_RIGHT_SIDEBAR':
      return { ...state, showRightSidebar: !state.showRightSidebar };
    case 'SHOW_RIGHT_SIDEBAR':
      return { ...state, showRightSidebar: true };
    case 'HIDE_RIGHT_SIDEBAR':
      return { ...state, showRightSidebar: false };
    case 'TOGGLE_PLAYBAR':
      return { ...state, showPlaybar: !state.showPlaybar };
    case 'SHOW_PLAYBAR':
      return { ...state, showPlaybar: true };
    case 'HIDE_PLAYBAR':
      return { ...state, showPlaybar: false };
    case 'TOGGLE_ZOOM_OUT':
      return { ...state, zoomOut: !state.zoomOut };
    case 'ZOOM_OUT':
      return { ...state, zoomOut: true };
    case 'ZOOM_IN':
      return { ...state, zoomOut: false };
    default:
      return state;
  }
};

export default visibilitySettings;
