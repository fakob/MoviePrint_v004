const { app } = require('electron').remote;

// needs to have the same file structure as in combineReducers
const initialStateJSON = {
  visibilitySettings: {
    visibilityFilter: 'SHOW_VISIBLE',
    showMovielist: false,
    showSettings: false,
    showMoviePrintView: true,
  },
  thumbsObjUrls: {},
  undoGroup: {
    settings: {
      defaultThumbCountMax: 400,
      defaultThumbCount: 16,
      defaultColumnCount: 4,
      defaultThumbnailScale: 0.25,
      defaultMarginRatio: 0.02,
      defaultMarginSliderFactor: 200.0,
      defaultBorderRadiusRatio: 0.04,
      defaultHeaderHeightRatio: 0.25,
      defaultShowHeader: false,
      defaultRoundedCorners: true,
      defaultThumbInfo: 'hideInfo',
      defaultThumbInfoRatio: 0.075,
      defaultOutputPath: app.getPath('desktop'),
      defaultOutputFormat: 'png',
      defaultSaveOptionOverwrite: false,
      defaultSaveOptionIncludeIndividual: false,
      defaultVideoPlayerHeight: 360,
      defaultVideoPlayerWidth: 640,
      defaultVideoPlayerControllerHeight: 64,
      defaultBorderMargin: 24,
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
