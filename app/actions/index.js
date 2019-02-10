import uuidV4 from 'uuid/v4';
import log from 'electron-log';
import imageDB from '../utils/db';
import { mapRange, limitRange } from '../utils/utils';
import {
  DEFAULT_SHEET_SCENES,
} from '../utils/constants';
import {
  clearTableFramelist,
  clearTableFrameScanList,
  createTableFramelist,
  createTableFrameScanList,
  createTableMovielist,
  getFrameByFileIdAndFrameNumber,
  getFrameByFrameId,
  getFramesByFileIdAndFrameNumberArray,
  getFramesByIsPosterFrame,
  getFrameScanByFileId,
  insertMovie,
} from '../utils/utilsForSqlite';

const { ipcRenderer } = require('electron');

createTableFramelist(); // create table if not exist
createTableMovielist(); // create table if not exist
createTableFrameScanList(); // create table if not exist

// visibilitySettings
export const setVisibilityFilter = (filter) => {
  log.debug(`action: setVisibilityFilter - ${filter}`);
  return {
    type: 'SET_VISIBILITY_FILTER',
    filter
  };
};

export const toggleMovielist = () => {
  log.debug('action: toggleMovielist');
  return {
    type: 'TOGGLE_MOVIELIST'
  };
};

export const showMovielist = () => {
  log.debug('action: showMovielist');
  return {
    type: 'SHOW_MOVIELIST'
  };
};

export const hideMovielist = () => {
  log.debug('action: hideMovielist');
  return {
    type: 'HIDE_MOVIELIST'
  };
};

export const toggleSettings = () => {
  log.debug('action: toggleSettings');
  return {
    type: 'TOGGLE_SETTINGS'
  };
};

export const showSettings = () => {
  log.debug('action: showSettings');
  return {
    type: 'SHOW_SETTINGS'
  };
};

export const hideSettings = () => {
  log.debug('action: hideSettings');
  return {
    type: 'HIDE_SETTINGS'
  };
};

export const setSheet = (defaultSheet) => {
  log.debug(`action: setSheet - ${defaultSheet}`);
  return {
    type: 'SET_SHEET',
    defaultSheet
  };
};

export const setView = (defaultView) => {
  log.debug(`action: setView - ${defaultView}`);
  return {
    type: 'SET_VIEW',
    defaultView
  };
};

export const setSheetFit = (defaultSheetFit) => {
  log.debug(`action: setSheetFitView - ${defaultSheetFit}`);
  return {
    type: 'SET_SHEET_FIT',
    defaultSheetFit
  };
};

// settings

export const setCurrentFileId = (fileId) => {
  log.debug(`action: setCurrentFileId - ${fileId}`);
  return {
    type: 'SET_CURRENT_FILEID',
    fileId
  };
};

export const setDefaultThumbCount = (defaultThumbCount) => {
  log.debug(`action: setDefaultThumbCount - ${defaultThumbCount}`);
  return {
    type: 'SET_DEFAULT_THUMB_COUNT',
    defaultThumbCount
  };
};

export const setDefaultColumnCount = (defaultColumnCount) => {
  log.debug(`action: setDefaultColumnCount - ${defaultColumnCount}`);
  return {
    type: 'SET_DEFAULT_COLUMN_COUNT',
    defaultColumnCount
  };
};

export const setDefaultThumbnailScale = (defaultThumbnailScale) => {
  log.debug(`action: setDefaultThumbnailScale - ${defaultThumbnailScale}`);
  return {
    type: 'SET_DEFAULT_THUMBNAIL_SCALE',
    defaultThumbnailScale
  };
};

export const setDefaultMoviePrintWidth = (defaultMoviePrintWidth) => {
  log.debug(`action: setDefaultMoviePrintWidth - ${defaultMoviePrintWidth}`);
  return {
    type: 'SET_DEFAULT_MOVIEPRINT_WIDTH',
    defaultMoviePrintWidth
  };
};

export const setDefaultMarginRatio = (defaultMarginRatio) => {
  log.debug(`action: setDefaultMarginRatio - ${defaultMarginRatio}`);
  return {
    type: 'SET_DEFAULT_MARGIN',
    defaultMarginRatio
  };
};

export const setDefaultShowHeader = (defaultShowHeader) => {
  log.debug(`action: setDefaultShowHeader - ${defaultShowHeader}`);
  return {
    type: 'SET_DEFAULT_SHOW_HEADER',
    defaultShowHeader
  };
};

export const setDefaultShowPathInHeader = (defaultShowPathInHeader) => {
  log.debug(`action: setDefaultShowPathInHeader - ${defaultShowPathInHeader}`);
  return {
    type: 'SET_DEFAULT_PATH_IN_HEADER',
    defaultShowPathInHeader
  };
};

export const setDefaultShowDetailsInHeader = (defaultShowDetailsInHeader) => {
  log.debug(`action: setDefaultShowDetailsInHeader - ${defaultShowDetailsInHeader}`);
  return {
    type: 'SET_DEFAULT_DETAILS_IN_HEADER',
    defaultShowDetailsInHeader
  };
};

export const setDefaultShowTimelineInHeader = (defaultShowTimelineInHeader) => {
  log.debug(`action: setDefaultShowTimelineInHeader - ${defaultShowTimelineInHeader}`);
  return {
    type: 'SET_DEFAULT_TIMELINE_IN_HEADER',
    defaultShowTimelineInHeader
  };
};

export const setDefaultRoundedCorners = (defaultRoundedCorners) => {
  log.debug(`action: setDefaultRoundedCorners - ${defaultRoundedCorners}`);
  return {
    type: 'SET_DEFAULT_ROUNDED_CORNERS',
    defaultRoundedCorners
  };
};

export const setDefaultThumbInfo = (defaultThumbInfo) => {
  log.debug(`action: setDefaultThumbInfo - ${defaultThumbInfo}`);
  return {
    type: 'SET_DEFAULT_THUMB_INFO',
    defaultThumbInfo
  };
};

export const setDefaultOutputPath = (defaultOutputPath) => {
  log.debug(`action: setDefaultOutputPath - ${defaultOutputPath}`);
  return {
    type: 'SET_DEFAULT_OUTPUT_PATH',
    defaultOutputPath
  };
};

export const setDefaultOutputFormat = (defaultOutputFormat) => {
  log.debug(`action: setDefaultOutputFormat - ${defaultOutputFormat}`);
  return {
    type: 'SET_DEFAULT_OUTPUT_FORMAT',
    defaultOutputFormat
  };
};

export const setDefaultCachedFramesSize = (defaultCachedFramesSize) => {
  log.debug(`action: setDefaultCachedFramesSize - ${defaultCachedFramesSize}`);
  return {
    type: 'SET_DEFAULT_CACHED_FRAMES_SIZE',
    defaultCachedFramesSize
  };
};

export const setDefaultSaveOptionOverwrite = (defaultSaveOptionOverwrite) => {
  log.debug(`action: setDefaultSaveOptionOverwrite - ${defaultSaveOptionOverwrite}`);
  return {
    type: 'SET_DEFAULT_SAVE_OPTION_OVERWRITE',
    defaultSaveOptionOverwrite
  };
};

export const setDefaultSaveOptionIncludeIndividual = (defaultSaveOptionIncludeIndividual) => {
  log.debug(`action: setDefaultSaveOptionIncludeIndividual - ${defaultSaveOptionIncludeIndividual}`);
  return {
    type: 'SET_DEFAULT_SAVE_OPTION_INCLUDE_INDIVIDUAL',
    defaultSaveOptionIncludeIndividual
  };
};

export const setDefaultShowPaperPreview = (defaultShowPaperPreview) => {
  log.debug(`action: setDefaultShowPaperPreview - ${defaultShowPaperPreview}`);
  return {
    type: 'SET_DEFAULT_SHOW_PAPER_PREVIEW',
    defaultShowPaperPreview
  };
};

export const setDefaultPaperAspectRatioInv = (defaultPaperAspectRatioInv) => {
  log.debug(`action: setDefaultPaperAspectRatioInv - ${defaultPaperAspectRatioInv}`);
  return {
    type: 'SET_DEFAULT_PAPER_ASPECT_RATIO_INV',
    defaultPaperAspectRatioInv
  };
};

export const setDefaultDetectInOutPoint = (defaultDetectInOutPoint) => {
  log.debug(`action: setDefaultDetectInOutPoint - ${defaultDetectInOutPoint}`);
  return {
    type: 'SET_DEFAULT_DETECT_INOUTPOINT',
    defaultDetectInOutPoint
  };
};

export const setEmailAddress = (emailAddress) => {
  log.debug(`action: setEmailAddress - ${emailAddress}`);
  return {
    type: 'SET_EMAIL_ADDRESS',
    emailAddress
  };
};

export const setDefaultSceneDetectionThreshold = (defaultSceneDetectionThreshold) => {
  log.debug(`action: setDefaultSceneDetectionThreshold - ${defaultSceneDetectionThreshold}`);
  return {
    type: 'SET_DEFAULT_SCENE_DETECTION_THRESHOLD',
    defaultSceneDetectionThreshold
  };
};

export const setDefaultTimelineViewSecondsPerRow = (defaultTimelineViewSecondsPerRow) => {
  log.debug(`action: setDefaultTimelineViewSecondsPerRow - ${defaultTimelineViewSecondsPerRow}`);
  return {
    type: 'SET_DEFAULT_TIMELINEVIEW_SECONDS_PER_ROW',
    defaultTimelineViewSecondsPerRow
  };
};

export const setDefaultTimelineViewMinDisplaySceneLengthInFrames = (defaultTimelineViewMinDisplaySceneLengthInFrames) => {
  log.debug(`action: setDefaultTimelineViewMinDisplaySceneLengthInFrames - ${defaultTimelineViewMinDisplaySceneLengthInFrames}`);
  return {
    type: 'SET_DEFAULT_TIMELINEVIEW_MIN_DISPLAY_SCENE_LENGTH_IN_FRAMES',
    defaultTimelineViewMinDisplaySceneLengthInFrames
  };
};

export const setDefaultTimelineViewWidthScale = (defaultTimelineViewWidthScale) => {
  log.debug(`action: setDefaultTimelineViewWidthScale - ${defaultTimelineViewWidthScale}`);
  return {
    type: 'SET_DEFAULT_TIMELINEVIEW_PIXEL_PER_FRAME_RATIO',
    defaultTimelineViewWidthScale
  };
};

export const setDefaultTimelineViewFlow = (defaultTimelineViewFlow) => {
  log.debug(`action: setDefaultTimelineViewFlow - ${defaultTimelineViewFlow}`);
  return {
    type: 'SET_DEFAULT_TIMELINEVIEW_FLOW',
    defaultTimelineViewFlow
  };
};

export const setDefaultOutputPathFromMovie = (defaultOutputPathFromMovie) => {
  log.debug(`action: setDefaultOutputPathFromMovie - ${defaultOutputPathFromMovie}`);
  return {
    type: 'SET_DEFAULT_OUTPUT_PATH_FROM_MOVIE',
    defaultOutputPathFromMovie
  };
};

// scenesByFileId

export const clearScenes = (fileId) => {
  log.debug('action: clearScenes');
  return {
    type: 'CLEAR_SCENES',
    payload: {
      fileId,
    }
  };
};

export const addScene = (fileId, start, length, colorArray, sceneId = uuidV4()) => {
  return (dispatch) => {
    log.debug('action: addScene');
    log.debug('dispatch: ADD_SCENE');
    dispatch({
      type: 'ADD_SCENE',
      payload: {
        sceneId,
        fileId,
        start,
        length,
        colorArray,
      }
    });
  };
};

export const addScenes = (file, sceneList, clearOldScenes = false, frameSize) => {
  return (dispatch) => {
    log.debug('action: addScenes');
    if (clearOldScenes) {
      dispatch(clearScenes(file.id));
      dispatch(clearThumbs(file.id, DEFAULT_SHEET_SCENES));
    }
    sceneList.map((scene, index) => {
      const sceneId = uuidV4();
      const thumbId = uuidV4();
      dispatch(addThumb(file, DEFAULT_SHEET_SCENES, scene.start + Math.floor(scene.length / 2), index, thumbId, sceneId, frameSize));
      return dispatch(addScene(file.id, scene.start, scene.length, scene.colorArray, sceneId));
    })
  };
};

export const toggleScene = (currentFileId, sheet, sceneId) => {
  log.debug(`action: toggleScene - ${sceneId}`);
  return {
    type: 'TOGGLE_SCENE',
    payload: {
      fileId: currentFileId,
      sheet,
      sceneId
    },
  };
};

// thumbs

export const addThumb = (file, sheet, frameNumber, index, thumbId = uuidV4(), sceneId = undefined, frameSize = 0) => {
  return (dispatch) => {
    log.debug('action: addThumb');
    const frameId = uuidV4();
    // let thumbId;
    // if (presetThumbId) {
    //   thumbId = presetThumbId;
    // } else {
    //   thumbId = uuidV4();
    // }
    const newFrameNumberWithinBoundaries = limitRange(frameNumber, 0, file.frameCount - 1);
    const frame = getFrameByFileIdAndFrameNumber(file.id, newFrameNumberWithinBoundaries);
    // imageDB.frameList.where('[fileId+frameNumber]').equals([file.id, newFrameNumberWithinBoundaries]).toArray().then((frames) => {
      // log.debug(frames.length);
      if (frame === undefined) {
        log.debug(`frame number: ${frameNumber} not yet in database - need(s) to be captured`);
        ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-thumbs', file.id, file.path, sheet, [thumbId], [frameId], [newFrameNumberWithinBoundaries], file.useRatio, frameSize);
        log.debug('dispatch: ADD_THUMB');
        return dispatch({
          type: 'ADD_THUMB',
          payload: {
            sheet,
            thumbId,
            frameId,
            frameNumber,
            fileId: file.id,
            index,
            hidden: false,
            sceneId,
          }
        });
      }
      log.debug(`frame number: ${frameNumber} already in database`);
      log.debug('dispatch: ADD_THUMB');
      dispatch({
        type: 'ADD_THUMB',
        payload: {
          sheet,
          thumbId,
          frameId: frame.frameId,
          frameNumber,
          fileId: file.id,
          index,
          hidden: false,
          sceneId,
        }
      });
    // })
    // .catch(error => {
    //   log.error(`There has been a problem with your fetch operation: ${error.message}`);
    // });
  };
};

export const toggleThumb = (currentFileId, sheet, thumbId) => {
  log.debug(`action: toggleThumb - ${thumbId}`);
  return {
    type: 'TOGGLE_THUMB',
    payload: {
      fileId: currentFileId,
      sheet,
      thumbId
    },
  };
};

export const updateOrder = (currentFileId, sheet, array) => {
  log.debug('action: updateOrder');
  return {
    type: 'UPDATE_ORDER',
    payload: {
      fileId: currentFileId,
      sheet,
      array
    },
  };
};

export const removeThumb = (currentFileId, sheet, thumbId) => {
  log.debug(`action: removeThumb - ${thumbId}`);
  return {
    type: 'REMOVE_THUMB',
    payload: {
      fileId: currentFileId,
      sheet,
      thumbId
    },
  };
};

export const updateFrameNumber = (fileId, sheet, thumbId, frameNumber) => {
  log.debug('action: updateFrameNumber');
  return {
    type: 'UPDATE_FRAMENUMBER_OF_THUMB',
    payload: {
      fileId,
      sheet,
      thumbId,
      frameNumber
    }
  };
};

export const clearThumbs = (fileId = '', sheet = '') => {
  log.debug('action: clearThumbs');
  return {
    type: 'CLEAR_THUMBS',
    payload: {
      fileId,
      sheet,
    }
  };
};

export const addDefaultThumbs = (file, sheet, amount = 20, start = 10, stop = file.frameCount - 1, frameSize) => {
  return (dispatch) => {
    log.debug('action: addDefaultThumbs');

    // amount should not be more than the frameCount
    // stop - start should be at least amount
    let newStart = start;
    let newStop = stop;
    const difference = stop - start;
    let newAmount = Math.min(amount, file.frameCount - 1);
    if (difference < amount) {
      newStop = start + amount;
      if (newStop > file.frameCount - 1) {
        newStart = Math.max(0, (file.frameCount - 1) - amount);
        newStop = newStart + amount;
      }
    }
    // log.debug(`${amount} : ${newAmount} : ${start} : ${newStart} : ${stop} : ${newStop} : `)

    const startWithBoundaries = limitRange(newStart, 0, file.frameCount - 1);
    const stopWithBoundaries = limitRange(newStop, 0, file.frameCount - 1);
    const frameNumberArray = Array.from(Array(newAmount).keys())
      .map(x => mapRange(x, 0, newAmount - 1, startWithBoundaries, stopWithBoundaries, true));
    // log.debug(frameNumberArray);
    dispatch(clearThumbs(file.id, sheet));
    return dispatch(addThumbs(file, sheet, frameNumberArray, frameSize));
  };
};

export const addThumbs = (file, sheet, frameNumberArray, frameSize = 0) => {
  return (dispatch) => {
    log.debug('action: addThumbs');

    const frames = getFramesByFileIdAndFrameNumberArray(file.id, frameNumberArray);
      // log.debug(frames.length);
      // log.debug(frames);

      // remove duplicates in case there are already some in imageDB
      const uniqueFrames = frames.filter((item, index, self) =>
        index === self.findIndex((t) => (
          t.frameNumber === item.frameNumber
        ))
      );

      // extract frameNumbers and frameIds into separate arrays
      const alreadyExistingFrameNumbersArray = uniqueFrames.map((item) => item.frameNumber);
      const alreadyExistingFrameIdsArray = uniqueFrames.map((item) => item.frameId);

      // remove the already existing frameNumbers
      // log.debug(frameNumberArray);
      // log.debug(alreadyExistingFrameNumbersArray);
      const filteredArray = frameNumberArray.filter(
        value => alreadyExistingFrameNumbersArray.indexOf(value) < 0
      );
      // log.debug(filteredArray);

      // if all thumbs already exist skip capturing
      if (filteredArray.length !== 0) {
        log.debug(`${filteredArray.length} frame(s) are not yet in database - need(s) to be captured`);
        // add new thumbs
        const frameIdArray = filteredArray.map(() => uuidV4());
        const thumbIdArray = filteredArray.map(() => uuidV4());
        ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-thumbs', file.id, file.path, sheet, thumbIdArray, frameIdArray, filteredArray, file.useRatio, frameSize);
        log.debug('dispatch: ADD_THUMBS');
        dispatch({
          type: 'ADD_THUMBS',
          payload: {
            sheet,
            thumbIdArray,
            frameIdArray,
            frameNumberArray: filteredArray,
            fileId: file.id,
            width: file.width,
            height: file.height,
          }
        });
      }

      // add thumbs with existing frames in imageDB
      // if no thumbs with existing frames exist, skip this step
      if (alreadyExistingFrameIdsArray.length !== 0) {
        const thumbIdArray2 = alreadyExistingFrameIdsArray.map(() => uuidV4());
        log.debug(`${alreadyExistingFrameIdsArray.length} frame(s) are already in database`);
        log.debug('dispatch: ADD_THUMBS');
        dispatch({
          type: 'ADD_THUMBS',
          payload: {
            sheet,
            thumbIdArray: thumbIdArray2,
            frameIdArray: alreadyExistingFrameIdsArray,
            frameNumberArray: alreadyExistingFrameNumbersArray,
            fileId: file.id,
            width: file.width,
            height: file.height,
          }
        });
      }
      return Promise.resolve(frames);
    // }).catch((err) => {
    //   log.error(err);
    // });
  };
};

export const changeThumb = (sheet, file, thumbId, newFrameNumber, frameSize = 0) => {
  return (dispatch) => {
    log.debug(`action: changeThumb - ${newFrameNumber}`);
    const newFrameId = uuidV4();
    const newFrameNumberWithinBoundaries = limitRange(newFrameNumber, 0, file.frameCount - 1);

    const frame = getFrameByFileIdAndFrameNumber(file.id, newFrameNumberWithinBoundaries);
    // imageDB.frameList.where('[fileId+frameNumber]').equals([file.id, newFrameNumberWithinBoundaries]).toArray().then((frames) => {
      if (frame === undefined) {
        log.debug(`frame number: ${newFrameNumber} not yet in database - need(s) to be captured`);
        ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-thumbs', file.id, file.path, sheet, [thumbId], [newFrameId], [newFrameNumberWithinBoundaries], file.useRatio, frameSize);
        log.debug('dispatch: CHANGE_THUMB');
        return dispatch({
          type: 'CHANGE_THUMB',
          payload: {
            sheet,
            newFrameId,
            thumbId,
            newFrameNumber: newFrameNumberWithinBoundaries,
            fileId: file.id,
          }
        });
      }
      log.debug(`frame number: ${newFrameNumber} already in database`);
      log.debug('dispatch: CHANGE_THUMB');
      return dispatch({
        type: 'CHANGE_THUMB',
        payload: {
          sheet,
          newFrameId: frame.frameId,
          thumbId,
          newFrameNumber: frame.frameNumber,
          fileId: file.id,
        }
      });
    // })
    // .catch((err) => {
    //   log.error(err);
    // });
  };
};

// export const updateAllFrameData = (sheet, file, frameSize = 0) => {
//   return (dispatch) => {
//     log.debug(`action: updateAllFrameData`);
//     const newFrameId = uuidV4();
//     const newFrameNumberWithinBoundaries = limitRange(newFrameNumber, 0, file.frameCount - 1);
//
//     const frame = getFrameByFileIdAndFrameNumber(file.id, newFrameNumberWithinBoundaries);
//     ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-thumbs', file.id, file.path, sheet, thumbIdArray, frameIdArray, filteredArray, file.useRatio, frameSize);
//
//   };
// };

export const deleteSceneSheets = (fileId) => {
  log.debug('action: deleteSceneSheets');
  return {
    type: 'DELETE_SCENE_SHEETS',
    payload: {
      fileId,
    }
  };
};

// files
export const removeMovieListItem = (fileId) => {
  return (dispatch) => {
    log.debug(`action: removeMovieListItem - ${fileId}`);
    dispatch({
      type: 'REMOVE_MOVIE_LIST_ITEM',
      payload: {
        fileId
      }
    });
  };
};

export const updateFileColumnCount = (fileId, columnCount) => {
  return (dispatch) => {
    log.debug(`action: updateFileColumnCount - ${columnCount}`);
    dispatch({
      type: 'UPDATE_COLUMNCOUNT_OF_MOVIE_LIST_ITEM',
      payload: {
        fileId,
        columnCount,
      }
    });
  };
};

export const updateFileDetailUseRatio = (fileId, useRatio) => {
  return (dispatch) => {
    log.debug('action: updateFileDetailUseRatio');
    dispatch({
      type: 'UPDATE_MOVIE_LIST_ITEM_USERATIO',
      payload: {
        fileId,
        useRatio
      }
    });
  };
};

export const updateFileDetails = (fileId, frameCount, width, height, fps, fourCC) => {
  return (dispatch) => {
    log.debug('action: updateFileDetails');
    dispatch({
      type: 'UPDATE_MOVIE_LIST_ITEM',
      payload: {
        fileId,
        frameCount,
        width,
        height,
        fps,
        fourCC
      }
    });
  };
};

export const updateInOutPoint = (fileId, fadeInPoint, fadeOutPoint) => {
  return (dispatch) => {
    log.debug('action: updateInOutPoint');
    dispatch({
      type: 'UPDATE_IN_OUT_POINT',
      payload: {
        fileId,
        fadeInPoint,
        fadeOutPoint
      }
    });
  };
};

export const setMovieList = (files) => {
  log.debug('action: setMovieList');
  return {
    type: 'SET_MOVIE_LIST',
    files
  };
};

export const setNewMovieList = (files, settings) => {
  return (dispatch, getState) => {
    log.debug('action: setNewMovieList');
    const newFiles = [];
    Object.keys(files).map((key) => {
      // file match need(s) to be in sync with onDrop() and accept in App.js !!!
      if (files[key].type.match('video.*') ||
        files[key].name.match(/.divx|.mkv|.ogg|.VOB/i)) {
        const id = uuidV4();
        const posterFrameId = uuidV4();
        const fileToAdd = {
          id,
          lastModified: files[key].lastModified,
          // lastModifiedDate: files[key].lastModifiedDate.toDateString(),
          name: files[key].name,
          path: files[key].path,
          size: files[key].size,
          type: files[key].type,
          posterFrameId,
        };
        insertMovie(fileToAdd);
        newFiles.push(fileToAdd);
      }
      // return a copy of the array
      return newFiles.slice();
    });
    dispatch({
      type: 'CLEAR_CURRENT_FILEID',
    });
    log.debug('dispatch: CLEAR_CURRENT_FILEID');
    dispatch({
      type: 'CLEAR_MOVIE_LIST',
    });
    log.debug('dispatch: CLEAR_MOVIE_LIST');
    clearTableFramelist();
    clearTableFrameScanList();
    log.debug('dispatch: LOAD_MOVIE_LIST_FROM_DROP');
    log.debug(newFiles);
    dispatch({
      type: 'LOAD_MOVIE_LIST_FROM_DROP',
      payload: newFiles,
    });
    return Promise.resolve(newFiles);
  };
};

export const updateObjectUrlsFromPosterFrame = () => {
  return (dispatch, getState) => {
    // log.debug('action: updateObjectUrlsFromPosterFrame');
    const frames = getFramesByIsPosterFrame(1);
    // return imageDB.frameList.where('isPosterFrame').equals(1).toArray() // 1 for true is used as dexie/indexDB can not use boolean values
    //   .then((frames) => {
        log.debug(frames);
        return dispatch({
          type: 'UPDATE_OBJECTURLS_FROM_POSTERFRAME',
          payload: {
            files: getState().undoGroup.present.files,
            frames
          },
        });
      // });
  };
};

// thumbsObjUrls
export const clearObjectUrls = () => {
  return (dispatch) => {
    log.debug('action: clearObjectUrls');
    log.debug('dispatch: CLEAR_OBJECTURLS');
    dispatch({
      type: 'CLEAR_OBJECTURLS',
    });
  };
};

  export const returnObjectUrlsFromFrameList = () => {
    return (dispatch, getState) => {
      log.debug('action: returnObjectUrlsFromFrameList');
      // const frames = getFramesByIsPosterFrame(0);
      // return imageDB.frameList.where('isPosterFrame').equals(isPosterFrameValue).toArray() // get all frames which are not posterframes
      return imageDB.frameList.toArray() // get all frames which are not posterframes
        .then((frames) => {
          log.debug(frames);
          if (frames.length === 0) {
            return Promise.resolve([]);
          }
          const frameArray = [];
          frames.map((frame) => {
            const objectUrl = window.URL.createObjectURL(frame.data);
            if (objectUrl !== undefined) {
              frameArray.push({
                frameId: frame.frameId,
                objectUrl: window.URL.createObjectURL(frame.data),
              })
            }
            return undefined;
          });
          return Promise.resolve(frameArray);
        })
        .catch((err) => {
          log.error(err);
        });
    };
  };
