// needs to have the same file structure as in combineReducers
const initialStateJSON = {
  visibilitySettings: {
    isManipulating: false,
    visibilityFilter: 'SHOW_VISIBLE',
    zoomOut: false,
  },
  thumbsObjUrls: {},
  undoGroup: {
    settings: {
      defaultThumbCount: 9,
      defaultColumnCount: 3,
      defaultThumbnailWidth: 270,
      defaultMargin: 4,
      defaultBorderRadius: 8,
      defaultHeaderHeight: 42,
    },
    thumbsByFileId: [],
    files: []
  }
};

export const loadState = () => {
  try {
    const serializedState = localStorage.getItem('state');
    if (serializedState === null) {
      // return undefined;
      return initialStateJSON;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

export const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('state', serializedState);
  } catch (err) {
    // Ignore write errors
  }
};
