const { app } = require('electron').remote

// needs to have the same file structure as in combineReducers
const initialStateJSON = {
  visibilitySettings: {
    visibilityFilter: 'SHOW_VISIBLE',
    showLeftSidebar: false,
    showRightSidebar: false,
    zoomOut: false,
  },
  thumbsObjUrls: {},
  undoGroup: {
    settings: {
      defaultThumbCountMax: 400,
      defaultThumbCount: 9,
      defaultColumnCount: 3,
      defaultThumbnailScale: 0.25,
      defaultMarginRatio: 0.1,
      defaultBorderRadiusRatio: 0.08,
      defaultHeaderHeightRatio: 0.16,
      defaultShowHeader: true,
      defaultRoundedCorners: true,
      defaultThumbInfo: 'frames',
      defaultOutputScaleCompensator: 1,
      defaultOutputPath: app.getPath('desktop'),
      defaultOutputFormat: 'png',
      defaultSaveOptionOverwrite: true,
      defaultSaveOptionSaveIndividual: true,
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
