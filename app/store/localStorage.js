import {
  VISIBILITY_FILTER,
  SHOW_MOVIELIST,
  SHOW_SETTINGS,
  SHOW_MOVIE_PRINT_VIEW,
  DEFAULT_THUMB_COUNT_MAX,
  DEFAULT_THUMB_COUNT,
  DEFAULT_COLUMN_COUNT,
  DEFAULT_THUMBNAIL_SCALE,
  DEFAULT_MOVIEPRINT_WIDTH,
  DEFAULT_MARGIN_RATIO,
  DEFAULT_MARGIN_SLIDER_FACTOR,
  DEFAULT_BORDER_RADIUS_RATIO,
  DEFAULT_HEADER_HEIGHT_RATIO,
  DEFAULT_SHOW_HEADER,
  DEFAULT_ROUNDED_CORNERS,
  DEFAULT_THUMB_INFO,
  DEFAULT_THUMB_INFO_RATIO,
  // DEFAULT_OUTPUT_PATH,
  DEFAULT_OUTPUT_FORMAT,
  DEFAULT_SAVE_OPTION_OVERWRITE,
  DEFAULT_SAVE_OPTION_INCLUDE_INDIVIDUAL,
  DEFAULT_VIDEO_PLAYER_HEIGHT,
  DEFAULT_VIDEO_PLAYER_WIDTH,
  DEFAULT_VIDEO_PLAYER_CONTROLLER_HEIGHT,
  DEFAULT_BORDER_MARGIN,
  DEFAULT_SHOW_PAPER_PREVIEW,
  DEFAULT_PAPER_ASPECTRATIOINV,
} from '../utils/constants';

const { app } = require('electron').remote;

// needs to have the same file structure as in combineReducers
const initialStateJSON = {
  visibilitySettings: {
    visibilityFilter: VISIBILITY_FILTER,
    showMovielist: SHOW_MOVIELIST,
    showSettings: SHOW_SETTINGS,
    showMoviePrintView: SHOW_MOVIE_PRINT_VIEW,
  },
  thumbsObjUrls: {},
  undoGroup: {
    settings: {
      defaultThumbCountMax: DEFAULT_THUMB_COUNT_MAX,
      defaultThumbCount: DEFAULT_THUMB_COUNT,
      defaultColumnCount: DEFAULT_COLUMN_COUNT,
      defaultThumbnailScale: DEFAULT_THUMBNAIL_SCALE,
      defaultMoviePrintWidth: DEFAULT_MOVIEPRINT_WIDTH,
      defaultMarginRatio: DEFAULT_MARGIN_RATIO,
      defaultMarginSliderFactor: DEFAULT_MARGIN_SLIDER_FACTOR,
      defaultBorderRadiusRatio: DEFAULT_BORDER_RADIUS_RATIO,
      defaultHeaderHeightRatio: DEFAULT_HEADER_HEIGHT_RATIO,
      defaultShowHeader: DEFAULT_SHOW_HEADER,
      defaultRoundedCorners: DEFAULT_ROUNDED_CORNERS,
      defaultThumbInfo: DEFAULT_THUMB_INFO,
      defaultThumbInfoRatio: DEFAULT_THUMB_INFO_RATIO,
      defaultOutputPath: app.getPath('desktop'),
      defaultOutputFormat: DEFAULT_OUTPUT_FORMAT,
      defaultSaveOptionOverwrite: DEFAULT_SAVE_OPTION_OVERWRITE,
      defaultSaveOptionIncludeIndividual: DEFAULT_SAVE_OPTION_INCLUDE_INDIVIDUAL,
      defaultVideoPlayerHeight: DEFAULT_VIDEO_PLAYER_HEIGHT,
      defaultVideoPlayerWidth: DEFAULT_VIDEO_PLAYER_WIDTH,
      defaultVideoPlayerControllerHeight: DEFAULT_VIDEO_PLAYER_CONTROLLER_HEIGHT,
      defaultBorderMargin: DEFAULT_BORDER_MARGIN,
      defaultShowPaperPreview: DEFAULT_SHOW_PAPER_PREVIEW,
      defaultPaperAspectRatioInv: DEFAULT_PAPER_ASPECTRATIOINV,
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
