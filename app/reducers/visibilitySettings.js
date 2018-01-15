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
    case 'TOGGLE_RIGHT_SIDEBAR':
      return { ...state, showRightSidebar: !state.showRightSidebar };
    default:
      return state;
  }
};

export default visibilitySettings;
