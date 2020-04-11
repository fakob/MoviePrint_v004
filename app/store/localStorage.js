import log from 'electron-log';
import {
  // DEFAULT_OUTPUT_PATH,
  DEFAULT_ALLTHUMBS_NAME,
  DEFAULT_BORDER_MARGIN,
  DEFAULT_BORDER_RADIUS_RATIO,
  DEFAULT_CACHED_FRAMES_SIZE,
  DEFAULT_COLUMN_COUNT,
  DEFAULT_DETECT_INOUTPOINT,
  DEFAULT_EMBED_FILEPATH,
  DEFAULT_EMBED_FRAMENUMBERS,
  DEFAULT_FRAMEINFO_BACKGROUND_COLOR,
  DEFAULT_FRAMEINFO_COLOR,
  DEFAULT_FRAMEINFO_MARGIN,
  DEFAULT_FRAMEINFO_POSITION,
  DEFAULT_FRAMEINFO_SCALE,
  DEFAULT_HEADER_HEIGHT_RATIO,
  DEFAULT_MARGIN_RATIO,
  DEFAULT_MARGIN_SLIDER_FACTOR,
  DEFAULT_MOVIEPRINT_BACKGROUND_COLOR,
  DEFAULT_MOVIEPRINT_NAME,
  DEFAULT_MOVIEPRINT_WIDTH,
  DEFAULT_OUTPUT_FORMAT,
  DEFAULT_OUTPUT_PATH_FROM_MOVIE,
  DEFAULT_PAPER_ASPECTRATIOINV,
  DEFAULT_ROUNDED_CORNERS,
  DEFAULT_SAVE_OPTION_INCLUDE_INDIVIDUAL,
  DEFAULT_SAVE_OPTION_OVERWRITE,
  DEFAULT_SCENE_DETECTION_THRESHOLD,
  DEFAULT_SCRUB_CONTAINER_MAXHEIGHTRATIO,
  DEFAULT_SCRUB_WINDOW_HEIGHTRATIO,
  DEFAULT_SCRUB_WINDOW_MARGIN,
  DEFAULT_SCRUB_WINDOW_WIDTHRATIO,
  DEFAULT_OUTPUT_JPG_QUALITY,
  DEFAULT_THUMB_FORMAT,
  DEFAULT_THUMB_JPG_QUALITY,
  DEFAULT_SHEET_TYPE,
  DEFAULT_SHEETVIEW,
  DEFAULT_SHOW_DETAILS_IN_HEADER,
  DEFAULT_SHOW_FACERECT,
  DEFAULT_SHOW_HEADER,
  DEFAULT_SHOW_IMAGES,
  DEFAULT_SHOW_PAPER_PREVIEW,
  DEFAULT_SHOW_PATH_IN_HEADER,
  DEFAULT_SHOW_TIMELINE_IN_HEADER,
  DEFAULT_SINGLETHUMB_NAME,
  DEFAULT_THUMB_COUNT,
  DEFAULT_THUMB_INFO_RATIO,
  DEFAULT_THUMB_INFO,
  DEFAULT_THUMBNAIL_SCALE,
  DEFAULT_TIMELINEVIEW_FLOW,
  DEFAULT_TIMELINEVIEW_MIN_DISPLAY_SCENE_LENGTH_IN_FRAMES,
  DEFAULT_TIMELINEVIEW_SECONDS_PER_ROW,
  DEFAULT_TIMELINEVIEW_WIDTH_SCALE,
  DEFAULT_VIDEO_PLAYER_HEIGHT,
  DEFAULT_VIDEO_PLAYER_WIDTH,
  DEFAULT_VIEW,
  FACE_UNIQUENESS_THRESHOLD,
  SHOT_DETECTION_METHOD,
  SHOW_MOVIELIST,
  SHOW_SETTINGS,
  STATEID,
  VISIBILITY_FILTER,
  ZOOM_SCALE,
} from '../utils/constants';
import { createTableReduxState, updateReduxState, getReduxState } from '../utils/utilsForSqlite';
import { getSizeOfString } from '../utils/utils';

const { app } = require('electron').remote;

createTableReduxState(); // create table if not exist

// needs to have the same file structure as in combineReducers
const initialStateJSON = {
  visibilitySettings: {
    visibilityFilter: VISIBILITY_FILTER,
    showMovielist: SHOW_MOVIELIST,
    showSettings: SHOW_SETTINGS,
    defaultView: DEFAULT_VIEW,
    defaultSheetView: DEFAULT_SHEETVIEW,
    defaultZoomLevel: ZOOM_SCALE,
  },
  undoGroup: {
    settings: {
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
      defaultShowImages: DEFAULT_SHOW_IMAGES,
      defaultShowPathInHeader: DEFAULT_SHOW_PATH_IN_HEADER,
      defaultShowDetailsInHeader: DEFAULT_SHOW_DETAILS_IN_HEADER,
      defaultShowTimelineInHeader: DEFAULT_SHOW_TIMELINE_IN_HEADER,
      defaultRoundedCorners: DEFAULT_ROUNDED_CORNERS,
      defaultThumbInfo: DEFAULT_THUMB_INFO,
      defaultThumbInfoRatio: DEFAULT_THUMB_INFO_RATIO,
      defaultOutputPath: app.getPath('desktop'),
      defaultOutputPathFromMovie: DEFAULT_OUTPUT_PATH_FROM_MOVIE,
      defaultOutputFormat: DEFAULT_OUTPUT_FORMAT,
      defaultOutputJpgQuality: DEFAULT_OUTPUT_JPG_QUALITY,
      defaultThumbFormat: DEFAULT_THUMB_FORMAT,
      defaultThumbJpgQuality: DEFAULT_THUMB_JPG_QUALITY,
      defaultSaveOptionOverwrite: DEFAULT_SAVE_OPTION_OVERWRITE,
      defaultSaveOptionIncludeIndividual: DEFAULT_SAVE_OPTION_INCLUDE_INDIVIDUAL,
      defaultVideoPlayerHeight: DEFAULT_VIDEO_PLAYER_HEIGHT,
      defaultVideoPlayerWidth: DEFAULT_VIDEO_PLAYER_WIDTH,
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
      defaultEmbedFrameNumbers: DEFAULT_EMBED_FRAMENUMBERS,
      defaultEmbedFilePath: DEFAULT_EMBED_FILEPATH,
      defaultShotDetectionMethod: SHOT_DETECTION_METHOD.MEAN,
      defaultMoviePrintBackgroundColor: DEFAULT_MOVIEPRINT_BACKGROUND_COLOR,
      defaultFrameinfoBackgroundColor: DEFAULT_FRAMEINFO_BACKGROUND_COLOR,
      defaultFrameinfoColor: DEFAULT_FRAMEINFO_COLOR,
      defaultFrameinfoPosition: DEFAULT_FRAMEINFO_POSITION,
      defaultFrameinfoScale: DEFAULT_FRAMEINFO_SCALE,
      defaultFrameinfoMargin: DEFAULT_FRAMEINFO_MARGIN,
      defaultMoviePrintName: DEFAULT_MOVIEPRINT_NAME,
      defaultSingleThumbName: DEFAULT_SINGLETHUMB_NAME,
      defaultAllThumbsName: DEFAULT_ALLTHUMBS_NAME,
      defaultShowFaceRect: DEFAULT_SHOW_FACERECT,
      defaultFaceUniquenessThreshold: FACE_UNIQUENESS_THRESHOLD,
      emailAddress: '',
    },
    sheetsByFileId: {},
    files: [],
  },
};

export const loadState = () => {
  try {
    const row = getReduxState(STATEID);
    if (row === undefined || row.state === undefined || row.state === null) {
      // return undefined;
      return initialStateJSON;
    }
    log.debug(`load state from ${row.timeStamp}`);
    const serializedState = row.state;
    // console.log(row);
    // console.log(row.timeStamp);
    // console.log(row.stateId);
    // console.log(serializedState);
    return JSON.parse(serializedState);
  } catch (err) {
    log.error('localStorage.js - error in loadState');
    log.error(err);
  }
};

export const saveState = state => {
  try {
    const serializedState = JSON.stringify(state);
    const timeStamp = Date();
    updateReduxState({
      stateId: STATEID,
      timeStamp,
      state: serializedState,
    });
    const timeBeforeUnix = new Date(timeStamp);
    const timeAfter = new Date();
    const timeAfterUnix = timeAfter.getTime();
    log.debug(`Size of reduxstate: ${getSizeOfString(serializedState)}`);
    log.debug(`Saving reduxstate in sqlite3 took ${timeAfterUnix - timeBeforeUnix} milliseconds`);
    // localStorage.setItem('state', serializedState);
  } catch (err) {
    log.error('localStorage.js - error in saveState');
    log.error(err);
    // Ignore write errors
  }
};
