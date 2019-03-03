import log from 'electron-log';
import {
  VISIBILITY_FILTER,
  SHOW_MOVIELIST,
  SHOW_SETTINGS,
  DEFAULT_VIEW,
  DEFAULT_SHEETVIEW,
  DEFAULT_SHEET_TYPE,
  DEFAULT_SHEET_FIT,
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
  DEFAULT_SHOW_PATH_IN_HEADER,
  DEFAULT_SHOW_DETAILS_IN_HEADER,
  DEFAULT_SHOW_TIMELINE_IN_HEADER,
  DEFAULT_ROUNDED_CORNERS,
  DEFAULT_THUMB_INFO,
  DEFAULT_THUMB_INFO_RATIO,
  // DEFAULT_OUTPUT_PATH,
  DEFAULT_OUTPUT_PATH_FROM_MOVIE,
  DEFAULT_OUTPUT_FORMAT,
  DEFAULT_SAVE_OPTION_OVERWRITE,
  DEFAULT_SAVE_OPTION_INCLUDE_INDIVIDUAL,
  DEFAULT_VIDEO_PLAYER_HEIGHT,
  DEFAULT_VIDEO_PLAYER_WIDTH,
  DEFAULT_VIDEO_PLAYER_CONTROLLER_HEIGHT,
  DEFAULT_BORDER_MARGIN,
  DEFAULT_SHOW_PAPER_PREVIEW,
  DEFAULT_PAPER_ASPECTRATIOINV,
  DEFAULT_DETECT_INOUTPOINT,
  DEFAULT_SCRUB_WINDOW_HEIGHTRATIO,
  DEFAULT_SCRUB_WINDOW_MINIMUM_HEIGHT,
  DEFAULT_SCRUB_WINDOW_MARGIN,
  DEFAULT_SCRUB_CONTAINER_MAXHEIGHTRATIO,
  DEFAULT_SCRUB_WINDOW_WIDTHRATIO,
  DEFAULT_SCENE_DETECTION_THRESHOLD,
  DEFAULT_TIMELINEVIEW_SECONDS_PER_ROW,
  DEFAULT_TIMELINEVIEW_MIN_DISPLAY_SCENE_LENGTH_IN_FRAMES,
  DEFAULT_TIMELINEVIEW_WIDTH_SCALE,
  DEFAULT_TIMELINEVIEW_FLOW,
  DEFAULT_CACHED_FRAMES_SIZE,
} from '../utils/constants';

const { app } = require('electron').remote;

// needs to have the same file structure as in combineReducers
const initialStateJSON = {
  visibilitySettings: {
    visibilityFilter: VISIBILITY_FILTER,
    showMovielist: SHOW_MOVIELIST,
    showSettings: SHOW_SETTINGS,
    defaultView: DEFAULT_VIEW,
    defaultSheetView: DEFAULT_SHEETVIEW,
    defaultSheetFit: DEFAULT_SHEET_FIT,
  },
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
      defaultSheetType: DEFAULT_SHEET_TYPE,
      defaultShowHeader: DEFAULT_SHOW_HEADER,
      defaultShowPathInHeader: DEFAULT_SHOW_PATH_IN_HEADER,
      defaultShowDetailsInHeader: DEFAULT_SHOW_DETAILS_IN_HEADER,
      defaultShowTimelineInHeader: DEFAULT_SHOW_TIMELINE_IN_HEADER,
      defaultRoundedCorners: DEFAULT_ROUNDED_CORNERS,
      defaultThumbInfo: DEFAULT_THUMB_INFO,
      defaultThumbInfoRatio: DEFAULT_THUMB_INFO_RATIO,
      defaultOutputPath: app.getPath('desktop'),
      defaultOutputPathFromMovie: DEFAULT_OUTPUT_PATH_FROM_MOVIE,
      defaultOutputFormat: DEFAULT_OUTPUT_FORMAT,
      defaultSaveOptionOverwrite: DEFAULT_SAVE_OPTION_OVERWRITE,
      defaultSaveOptionIncludeIndividual: DEFAULT_SAVE_OPTION_INCLUDE_INDIVIDUAL,
      defaultVideoPlayerHeight: DEFAULT_VIDEO_PLAYER_HEIGHT,
      defaultVideoPlayerWidth: DEFAULT_VIDEO_PLAYER_WIDTH,
      defaultVideoPlayerControllerHeight: DEFAULT_VIDEO_PLAYER_CONTROLLER_HEIGHT,
      defaultBorderMargin: DEFAULT_BORDER_MARGIN,
      defaultShowPaperPreview: DEFAULT_SHOW_PAPER_PREVIEW,
      defaultPaperAspectRatioInv: DEFAULT_PAPER_ASPECTRATIOINV,
      defaultDetectInOutPoint: DEFAULT_DETECT_INOUTPOINT,
      defaultScrubContainerMaxHeightRatio: DEFAULT_SCRUB_CONTAINER_MAXHEIGHTRATIO,
      defaultScrubWindowWidthRatio: DEFAULT_SCRUB_WINDOW_WIDTHRATIO,
      defaultScrubWindowHeightRatio: DEFAULT_SCRUB_WINDOW_HEIGHTRATIO,
      defaultScrubWindowMargin: DEFAULT_SCRUB_WINDOW_MARGIN,
      defaultSceneDetectionThreshold: DEFAULT_SCENE_DETECTION_THRESHOLD,
      defaultTimelineViewSecondsPerRow: DEFAULT_TIMELINEVIEW_SECONDS_PER_ROW,
      defaultTimelineViewMinDisplaySceneLengthInFrames: DEFAULT_TIMELINEVIEW_MIN_DISPLAY_SCENE_LENGTH_IN_FRAMES,
      defaultTimelineViewWidthScale: DEFAULT_TIMELINEVIEW_WIDTH_SCALE,
      defaultTimelineViewFlow: DEFAULT_TIMELINEVIEW_FLOW,
      defaultCachedFramesSize: DEFAULT_CACHED_FRAMES_SIZE,
      emailAddress: '',
    },
    sheetsByFileId: {},
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
    log.error('localStorage.js - error in loadState')
    return undefined;
  }
};

export const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('state', serializedState);
  } catch (err) {
    log.error('localStorage.js - error in saveState')
    // Ignore write errors
  }
};
