import uuidV4 from 'uuid/v4';
import log from 'electron-log';
import imageDB from '../utils/db';
import { mapRange, limitRange } from '../utils/utils';
import {
  DEFAULT_SHEET_SCENES,
} from '../utils/constants';
import {
  deleteTableFramelist,
} from '../utils/utilsForIndexedDB';
import {
  clearTableFrameScanList,
  createTableFrameScanList,
  deleteFileIdFromFrameScanList,
  // insertMovie,
} from '../utils/utilsForSqlite';

const { ipcRenderer } = require('electron');

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

export const setView = (defaultView) => {
  log.debug(`action: setView - ${defaultView}`);
  return {
    type: 'SET_VIEW',
    defaultView
  };
};

export const setDefaultSheetView = (defaultSheetView) => {
  log.debug(`action: setDefaultSheetView - ${defaultSheetView}`);
  return {
    type: 'SET_SHEETVIEW',
    defaultSheetView
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

export const setCurrentSheetId = (currentSheetId) => {
  log.debug(`action: setCurrentSheetId - ${currentSheetId}`);
  return {
    type: 'SET_CURRENT_SHEETID',
    currentSheetId
  };
};

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

export const setDefaultEmbedFrameNumbers = (defaultEmbedFrameNumbers) => {
  log.debug(`action: setDefaultEmbedFrameNumbers - ${defaultEmbedFrameNumbers}`);
  return {
    type: 'SET_DEFAULT_EMBED_FRAMENUMBERS',
    defaultEmbedFrameNumbers
  };
};

export const setDefaultEmbedFilePath = (defaultEmbedFilePath) => {
  log.debug(`action: setDefaultEmbedFilePath - ${defaultEmbedFilePath}`);
  return {
    type: 'SET_DEFAULT_EMBED_FILEPATH',
    defaultEmbedFilePath
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

// sheetsByFileId

export const clearScenes = (fileId, sheetId) => {
  log.debug('action: clearScenes');
  return {
    type: 'CLEAR_SCENES',
    payload: {
      fileId,
      sheetId,
    }
  };
};

export const addScene = (fileId, sheetId, start, length, colorArray, sceneId = uuidV4()) => {
  return (dispatch) => {
    log.debug('action: addScene');
    log.debug('dispatch: ADD_SCENE');
    dispatch({
      type: 'ADD_SCENE',
      payload: {
        sceneId,
        fileId,
        sheetId,
        start,
        length,
        colorArray,
      }
    });
  };
};

export const addScenes = (file, sceneList, clearOldScenes = false, frameSize, newSheetId) => {
  return (dispatch) => {
    log.debug('action: addScenes');
    if (clearOldScenes) {
      dispatch(clearScenes(file.id, newSheetId));
    }

    // add scenes
    const sceneArray = sceneList.map(scene => {
      scene.sceneId = uuidV4();
      scene.fileId = file.id;
      scene.sheetId = newSheetId;
      return scene;
    });
    log.debug('dispatch: ADD_SCENES');
    dispatch({
      type: 'ADD_SCENES',
      payload: {
        sceneArray,
        fileId: file.id,
        sheetId: newSheetId,
      }
    });

    // add thumbs
    const frameNumberArray = sceneList.map(scene => scene.start + Math.floor(scene.length / 2));
    dispatch(addThumbs(file, newSheetId, frameNumberArray, frameSize)).then(() => {
      // console.log(resolve);
      // add sceneId to thumbs after addThumbs returned
      const sceneIdArray = sceneArray.map(scene => scene.sceneId);
      // console.log(sceneIdArray);
      return dispatch({
        type: 'ADD_SCENEIDS_TO_THUMBS',
        payload: {
          sceneIdArray,
          frameNumberArray,
          fileId: file.id,
          sheetId: newSheetId,
        }
      });
    }).catch((err) => {
      log.error(err);
    });
  };
};

export const toggleScene = (fileId, sheetId, sceneId) => {
  log.debug(`action: toggleScene - ${sceneId}`);
  return {
    type: 'TOGGLE_SCENE',
    payload: {
      fileId,
      sheetId,
      sceneId,
    },
  };
};

export const updateSceneArray = (fileId, sheetId, sceneArray) => {
  log.debug(`action: updateSceneArray - ${sheetId}`);
  return {
    type: 'UPDATE_SCENEARRAY',
    payload: {
      fileId,
      sheetId,
      sceneArray,
    },
  };
};

export const insertScene = (fileId, sheetId, index, start, length, colorArray, newSceneId) => {
  log.debug(`action: insertScene - ${newSceneId}`);
  return {
    type: 'INSERT_SCENE',
    payload: {
      fileId,
      sheetId,
      index,
      start,
      length,
      colorArray,
      sceneId: newSceneId,
    },
  };
};

export const deleteScene = (fileId, sheetId, index) => {
  log.debug(`action: deleteScene - ${index}`);
  return {
    type: 'DELETE_SCENE',
    payload: {
      fileId,
      sheetId,
      index,
    },
  };
};

export const updateSceneLength = (fileId, sheetId, sceneId, length) => {
  log.debug(`action: updateSceneLength - ${sceneId}`);
  return {
    type: 'UPDATE_SCENE_LENGTH',
    payload: {
      fileId,
      sheetId,
      sceneId,
      length,
    },
  };
};

export const cutScene = (thumbs, allScenes, file, sheetId, scene, frameToCut) => {
  log.debug(`action: cutScene - ${scene.sceneId} - ${frameToCut}`);
  return (dispatch) => {

    // split one scene in 2
    const firstSceneSceneLength = frameToCut - scene.start;
    const firstSceneNewFrameNumber = scene.start + Math.floor(firstSceneSceneLength / 2)
    const firstSceneIndex = allScenes.findIndex(scene2 => scene2.sceneId === scene.sceneId);
    const nextSceneId = uuidV4();
    const nextSceneSceneStart = frameToCut;
    const nextSceneSceneLength = (scene.start + scene.length) - nextSceneSceneStart;
    const nextSceneNewFrameNumber = nextSceneSceneStart + Math.floor(nextSceneSceneLength / 2)
    dispatch(updateSceneLength(file.id, sheetId, scene.sceneId, firstSceneSceneLength));
    dispatch(insertScene(file.id, sheetId, firstSceneIndex + 1, nextSceneSceneStart, nextSceneSceneLength, scene.colorArray, nextSceneId));
    dispatch(changeThumb(sheetId, file, scene.sceneId, firstSceneNewFrameNumber));
    const firstThumbIndex = thumbs.findIndex(thumb => thumb.thumbId === scene.sceneId);
    dispatch(addThumb(file, sheetId, nextSceneNewFrameNumber, firstThumbIndex + 1, nextSceneId));
  }
};

export const mergeScenes = (thumbs, allScenes, file, sheetId, adjacentSceneIndicesArray) => {
  log.debug(`action: mergeScenes - ${adjacentSceneIndicesArray[0]} - ${adjacentSceneIndicesArray[1]}`);
  return (dispatch) => {

    // merge 2 scenes into 1
    const firstScene = allScenes[adjacentSceneIndicesArray[0]];
    const firstSceneId = firstScene.sceneId;
    const secondScene = allScenes[adjacentSceneIndicesArray[1]];
    const secondSceneId = secondScene.sceneId;
    const newSceneSceneLength = firstScene.length + secondScene.length;
    const newSceneNewFrameNumber = firstScene.start + Math.floor(newSceneSceneLength / 2)
    // change length of first scene
    dispatch(updateSceneLength(file.id, sheetId, firstSceneId, newSceneSceneLength));
    // delete second scene
    dispatch(deleteScene(file.id, sheetId, adjacentSceneIndicesArray[1]))
  	// delete second thumb
    const secondThumbIndex = thumbs.findIndex(thumb => thumb.thumbId === secondSceneId);
    dispatch(deleteThumb(file.id, sheetId, secondThumbIndex))
  	// change first thumb
    dispatch(changeThumb(sheetId, file, firstSceneId, newSceneNewFrameNumber));
  }
};

export const addThumb = (file, sheetId, frameNumber, index, thumbId = uuidV4(), frameSize = 0) => {
  return (dispatch) => {
    log.debug('action: addThumb');
    const frameId = uuidV4();

    const newFrameNumberWithinBoundaries = limitRange(frameNumber, 0, file.frameCount - 1);

    imageDB.frameList.where('[fileId+frameNumber]').equals([file.id, newFrameNumberWithinBoundaries]).toArray().then((frames) => {
      log.debug(frames.length);
      if (frames.length === 0) {
        log.debug(`frame number: ${frameNumber} not yet in database - need(s) to be captured`);
        ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-thumbs', file.id, file.path, sheetId, [thumbId], [frameId], [newFrameNumberWithinBoundaries], file.useRatio, frameSize, file.transformObject);
        log.debug('dispatch: ADD_THUMB');
        return dispatch({
          type: 'ADD_THUMB',
          payload: {
            sheetId,
            thumbId,
            frameId,
            frameNumber,
            fileId: file.id,
            index,
            hidden: false,
          }
        });
      }
      log.debug(`frame number: ${frameNumber} already in database`);
      log.debug('dispatch: ADD_THUMB');
      dispatch({
        type: 'ADD_THUMB',
        payload: {
          sheetId,
          thumbId,
          frameId: frames[0].frameId,
          frameNumber,
          fileId: file.id,
          index,
          hidden: false,
        }
      });
    })
    .catch(error => {
      log.error(`There has been a problem with your fetch operation: ${error.message}`);
    });
  };
};


export const deleteThumb = (fileId, sheetId, index) => {
  log.debug(`action: deleteThumb - ${index}`);
  return {
    type: 'DELETE_THUMB',
    payload: {
      fileId,
      sheetId,
      index,
    },
  };
};

export const toggleThumb = (currentFileId, sheetId, thumbId) => {
  log.debug(`action: toggleThumb - ${thumbId}`);
  return {
    type: 'TOGGLE_THUMB',
    payload: {
      fileId: currentFileId,
      sheetId,
      thumbId
    },
  };
};

export const updateOrder = (currentFileId, sheetId, array) => {
  log.debug('action: updateOrder');
  return {
    type: 'UPDATE_ORDER',
    payload: {
      fileId: currentFileId,
      sheetId,
      array
    },
  };
};

// export const updateSceneId = (fileId, sheetId, thumbId, sceneId) => {
//   log.debug('action: updateSceneId');
//   return {
//     type: 'UPDATE_SCENEID_OF_THUMB',
//     payload: {
//       fileId,
//       sheetId,
//       thumbId,
//       sceneId
//     }
//   };
// };

export const updateFrameNumber = (fileId, sheetId, thumbId, frameNumber) => {
  log.debug('action: updateFrameNumber');
  return {
    type: 'UPDATE_FRAMENUMBER_OF_THUMB',
    payload: {
      fileId,
      sheetId,
      thumbId,
      frameNumber
    }
  };
};

export const duplicateSheet = (fileId, sheetId, newSheetId) => {
  log.debug('action: duplicateSheet');
  return {
    type: 'DUPLICATE_SHEET',
    payload: {
      fileId,
      sheetId,
      newSheetId,
    }
  };
};

// export const deleteSceneSheets = (fileId) => {
//   log.debug('action: deleteSceneSheets');
//   return {
//     type: 'DELETE_SCENE_SHEETS',
//     payload: {
//       fileId,
//     }
//   };
// };

export const deleteSheets = (fileId = undefined, sheetId = undefined) => {
  log.debug('action: deleteSheets');
  return {
    type: 'DELETE_SHEETS',
    payload: {
      fileId,
      sheetId,
    }
  };
};

export const deleteThumbsArray = (fileId = undefined, sheetId = undefined) => {
  log.debug('action: deleteThumbsArray');
  if (fileId === undefined || sheetId === undefined) {
    return undefined;
  }
  return {
    type: 'DELETE_THUMBSARRAY',
    payload: {
      fileId,
      sheetId,
    }
  };
};

export const addIntervalSheet = (file, sheetId, amount = 20, start = 10, stop = file.frameCount - 1, frameSize) => {
  return (dispatch) => {
    log.debug('action: addIntervalSheet');

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
    dispatch(deleteThumbsArray(file.id, sheetId));
    return dispatch(addThumbs(file, sheetId, frameNumberArray, frameSize));
  };
};

export const addThumbs = (file, sheetId, frameNumberArray, frameSize = 0) => {
  return (dispatch) => {
    log.debug('action: addThumbs');

    // create compound array to search for both fileId and frameNumber
    // log.debug(frameNumberArray);
    const fileIdAndFrameNumberArray = frameNumberArray.map((item) => [file.id, item]);

    return imageDB.frameList.where('[fileId+frameNumber]').anyOf(fileIdAndFrameNumberArray).toArray().then((frames) => {
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
      const notExistingFrameNumberArray = frameNumberArray.filter(
        value => alreadyExistingFrameNumbersArray.indexOf(value) < 0
      );
      // log.debug(notExistingFrameNumberArray);

      let notExistingFrameIdArray = [];
      let notExistingThumbIdArray = [];
      // if all thumbs already exist skip capturing
      if (notExistingFrameNumberArray.length !== 0) {
        log.debug(`${notExistingFrameNumberArray.length} frame(s) are not yet in database - need(s) to be captured`);
        // add new thumbs
        notExistingFrameIdArray = notExistingFrameNumberArray.map(() => uuidV4());
        notExistingThumbIdArray = notExistingFrameNumberArray.map(() => uuidV4());
        ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-thumbs', file.id, file.path, sheetId, notExistingThumbIdArray, notExistingFrameIdArray, notExistingFrameNumberArray, file.useRatio, frameSize, file.transformObject);
      }

      let alreadyExistingThumbIdsArray = [];
      // add thumbs with existing frames in imageDB
      // if no thumbs with existing frames exist, skip this step
      if (alreadyExistingFrameIdsArray.length !== 0) {
        alreadyExistingThumbIdsArray = alreadyExistingFrameIdsArray.map(() => uuidV4());
        log.debug(`${alreadyExistingFrameIdsArray.length} frame(s) are already in database`);
      }

      const concatenatedFrameIdArray = notExistingFrameIdArray.concat(alreadyExistingFrameIdsArray);
      const concatenatedThumbIdArray = notExistingThumbIdArray.concat(alreadyExistingThumbIdsArray);
      const concatenatedFrameNumberArray = notExistingFrameNumberArray.concat(alreadyExistingFrameNumbersArray);

      log.debug('dispatch: ADD_THUMBS');
      dispatch({
        type: 'ADD_THUMBS',
        payload: {
          sheetId,
          thumbIdArray: concatenatedThumbIdArray,
          frameIdArray: concatenatedFrameIdArray,
          frameNumberArray: concatenatedFrameNumberArray,
          fileId: file.id,
          width: file.width,
          height: file.height,
        }
      });

      return Promise.resolve(frames);
    }).catch((err) => {
      log.error(err);
    });
  };
};

// adding new thumbs keeping the order, but not checking if frames already exist in indexedDB
export const addNewThumbsWithOrder = (file, sheetId, frameNumberArray, frameSize = 0) => {
  return (dispatch) => {
    log.debug('action: addNewThumbsWithOrder');

    // remove duplicates in case there are already some in imageDB
    const uniqueFrameNumberArray = frameNumberArray.filter((item, index, array) => array.indexOf(item) === index);

    const thumbIdArray = frameNumberArray.map(() => uuidV4());
    const uniqueFrameNumberAndFrameIdArray = uniqueFrameNumberArray.map(frameNumber => ({frameNumber, frameId: uuidV4()}));
    const frameIdArray = frameNumberArray.map(frameNumber =>
      uniqueFrameNumberAndFrameIdArray.find(item => item.frameNumber === frameNumber).frameId
    );

    ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-thumbs', file.id, file.path, sheetId, thumbIdArray, frameIdArray, frameNumberArray, file.useRatio, frameSize, file.transformObject);

    log.debug('dispatch: ADD_THUMBS');
    dispatch({
      type: 'ADD_THUMBS',
      payload: {
        sheetId,
        thumbIdArray,
        frameIdArray,
        frameNumberArray,
        fileId: file.id,
        width: file.width,
        height: file.height,
        noReorder: true,
      }
    });
  };
};

export const changeThumb = (sheetId, file, thumbId, newFrameNumber, frameSize = 0) => {
  return (dispatch) => {
    log.debug(`action: changeThumb - ${newFrameNumber}`);
    const newFrameId = uuidV4();
    const newFrameNumberWithinBoundaries = limitRange(newFrameNumber, 0, file.frameCount - 1);

    imageDB.frameList.where('[fileId+frameNumber]').equals([file.id, newFrameNumberWithinBoundaries]).toArray().then((frames) => {
      if (frames.length === 0) {
        log.debug(`frame number: ${newFrameNumber} not yet in database - need(s) to be captured`);
        ipcRenderer.send('message-from-mainWindow-to-opencvWorkerWindow', 'send-get-thumbs', file.id, file.path, sheetId, [thumbId], [newFrameId], [newFrameNumberWithinBoundaries], file.useRatio, frameSize, file.transformObject);
        log.debug('dispatch: CHANGE_THUMB');
        return dispatch({
          type: 'CHANGE_THUMB',
          payload: {
            sheetId,
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
          sheetId,
          newFrameId: frames[0].frameId,
          thumbId,
          newFrameNumber: frames[0].frameNumber,
          fileId: file.id,
        }
      });
    })
    .catch((err) => {
      log.error(err);
    });
  };
};

// files
export const removeMovieListItem = (fileId) => {
  return (dispatch) => {
    log.debug(`action: removeMovieListItem - ${fileId}`);

    // remove from file list
    dispatch({
      type: 'REMOVE_MOVIE_LIST_ITEM',
      payload: {
        fileId
      }
    });

    // remove fileId from sheetsByFileId
    dispatch({
      type: 'DELETE_SHEETS',
      payload: {
        fileId
      }
    });

    // remove entries from frameScanList sqlite3
    deleteFileIdFromFrameScanList(fileId);

    // remove frames from indexedDB
    imageDB.frameList.where('fileId').equals(fileId).delete()
    .then(deleteCount => {
      console.log(`Deleted ${deleteCount} objects`);
      return Promise.resolve(deleteCount);
    })
    .catch((err) => {
      log.error(err);
    });
  };
};

export const updateSheetSecondsPerRow = (fileId, sheetId, secondsPerRow) => {
  return (dispatch) => {
    log.debug(`action: updateSheetSecondsPerRow - ${secondsPerRow}`);
    dispatch({
      type: 'UPDATE_SHEET_SECONDSPERROW',
      payload: {
        fileId,
        sheetId,
        secondsPerRow,
      }
    });
  };
};

export const updateSheetColumnCount = (fileId, sheetId, columnCount) => {
  return (dispatch) => {
    log.debug(`action: updateSheetColumnCount - ${columnCount}`);
    dispatch({
      type: 'UPDATE_SHEET_COLUMNCOUNT',
      payload: {
        fileId,
        sheetId,
        columnCount,
      }
    });
  };
};

export const updateSheetName = (fileId, sheetId, name) => {
  return (dispatch) => {
    log.debug(`action: updateSheetName - ${name}`);
    dispatch({
      type: 'UPDATE_SHEET_NAME',
      payload: {
        fileId,
        sheetId,
        name,
      }
    });
  };
};

export const updateSheetView = (fileId, sheetId, sheetView) => {
  return (dispatch) => {
    log.debug(`action: updateSheetView - ${sheetView}`);
    dispatch({
      type: 'UPDATE_SHEET_VIEW',
      payload: {
        fileId,
        sheetId,
        sheetView,
      }
    });
  };
};

export const updateSheetType = (fileId, sheetId, type) => {
  return (dispatch) => {
    log.debug(`action: updateSheetType - ${type}`);
    dispatch({
      type: 'UPDATE_SHEET_TYPE',
      payload: {
        fileId,
        sheetId,
        type,
      }
    });
  };
};

export const updateFileScanStatus = (fileId, fileScanStatus) => {
  return (dispatch) => {
    log.debug('action: updateFileScanStatus');
    dispatch({
      type: 'UPDATE_FILESCAN_STATUS',
      payload: {
        fileId,
        fileScanStatus
      }
    });
  };
};

export const updateSheetCounter = (fileId, incrementValue = 1) => {
  return (dispatch) => {
    log.debug('action: updateSheetCounter');
    dispatch({
      type: 'UPDATE_SHEETCOUNTER',
      payload: {
        fileId,
        incrementValue,
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

export const replaceFileDetails = (fileId, path, name, size, lastModified) => {
  return (dispatch) => {
    log.debug('action: updateFileDetails');
    dispatch({
      type: 'REPLACE_MOVIE_LIST_ITEM',
      payload: {
        fileId,
        path,
        name,
        size,
        lastModified,
      }
    });
  };
};

export const setCropping = (fileId, cropTop, cropBottom, cropLeft, cropRight) => {
  return (dispatch) => {
    log.debug('action: setCropping');
    dispatch({
      type: 'SET_CROPPING',
      payload: {
        fileId,
        transformObject: {
          cropTop,
          cropBottom,
          cropLeft,
          cropRight
        }
      }
    });
  };
};

export const updateCropping = (fileId, cropTop, cropBottom, cropLeft, cropRight) => {
  return (dispatch) => {
    log.debug('action: updateCropping');
    dispatch({
      type: 'UPDATE_CROPPING',
      payload: {
        fileId,
        transformObject: {
          cropTop,
          cropBottom,
          cropLeft,
          cropRight
        }
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

export const addMoviesToList = (files, clearList) => {
  return (dispatch) => {
    log.debug('action: addMoviesToList');

    // create array with new files
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
        // insertMovie(fileToAdd);
        newFiles.push(fileToAdd);
      }
      // return a copy of the array
      return newFiles.slice();
    });
    if (clearList) {
      dispatch(clearMovieList());
    }

    dispatch({
      type: 'ADD_MOVIE_LIST_ITEMS',
      // type: 'LOAD_MOVIE_LIST_FROM_DROP',
      payload: newFiles,
    });
    return Promise.resolve(newFiles);
  };
};

export const clearMovieList = () => {
  return (dispatch) => {
    dispatch({
      type: 'CLEAR_CURRENT_FILEID',
    });
    log.debug('dispatch: CLEAR_CURRENT_FILEID');

    dispatch({
      type: 'CLEAR_MOVIE_LIST',
    });
    log.debug('dispatch: CLEAR_MOVIE_LIST');

    dispatch(deleteSheets());
    log.debug('dispatch: deleteSheets');

    clearTableFrameScanList();
    log.debug('clear fileId from frameScanList in sqlite3');

    deleteTableFramelist();
    log.debug('clear frameList in indexedDB');
  }
}
