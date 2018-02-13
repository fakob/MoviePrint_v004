const visibilitySettings = (state = {}, action) => {
  switch (action.type) {
    case 'SET_VISIBILITY_FILTER':
      return { ...state, visibilityFilter: action.filter };
    case 'START_ISMANIPULATING':
      return { ...state, isManipulating: true };
    case 'STOP_ISMANIPULATING':
      return { ...state, isManipulating: false };
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
    default:
      return state;
  }
};

export default visibilitySettings;
