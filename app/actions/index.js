import uuidV4 from 'uuid/v4';
import imageDB from './../utils/db';
import { mapRange, limitRange } from './../utils/utils';

const { ipcRenderer } = require('electron');

// visibilitySettings
export const setVisibilityFilter = (filter) => {
  return {
    type: 'SET_VISIBILITY_FILTER',
    filter
  };
};

export const toggleMovielist = () => {
  return {
    type: 'TOGGLE_MOVIELIST'
  };
};

export const showMovielist = () => {
  return {
    type: 'SHOW_MOVIELIST'
  };
};

export const hideMovielist = () => {
  return {
    type: 'HIDE_MOVIELIST'
  };
};

export const toggleSettings = () => {
  return {
    type: 'TOGGLE_SETTINGS'
  };
};

export const showSettings = () => {
  return {
    type: 'SHOW_SETTINGS'
  };
};

export const hideSettings = () => {
  return {
    type: 'HIDE_SETTINGS'
  };
};

export const showMoviePrintView = () => {
  return {
    type: 'SHOW_MOVIEPRINT_VIEW'
  };
};

export const showThumbView = () => {
  return {
    type: 'SHOW_THUMB_VIEW'
  };
};

// export const toggleZoomOut = () => {
//   return {
//     type: 'TOGGLE_ZOOM_OUT'
//   };
// };

// export const zoomOut = () => {
//   return {
//     type: 'ZOOM_OUT'
//   };
// };

// export const zoomIn = () => {
//   return {
//     type: 'ZOOM_IN'
//   };
// };

// settings

export const setCurrentFileId = (fileId) => {
  return {
    type: 'SET_CURRENT_FILEID',
    fileId
  };
};

export const setDefaultThumbCount = (defaultThumbCount) => {
  return {
    type: 'SET_DEFAULT_THUMB_COUNT',
    defaultThumbCount
  };
};

export const setDefaultColumnCount = (defaultColumnCount) => {
  return {
    type: 'SET_DEFAULT_COLUMN_COUNT',
    defaultColumnCount
  };
};

export const setDefaultThumbnailScale = (defaultThumbnailScale) => {
  return {
    type: 'SET_DEFAULT_THUMBNAIL_SCALE',
    defaultThumbnailScale
  };
};

export const setDefaultMoviePrintWidth = (defaultMoviePrintWidth) => {
  return {
    type: 'SET_DEFAULT_MOVIEPRINT_WIDTH',
    defaultMoviePrintWidth
  };
};

export const setDefaultMarginRatio = (defaultMarginRatio) => {
  return {
    type: 'SET_DEFAULT_MARGIN',
    defaultMarginRatio
  };
};

export const setDefaultShowHeader = (defaultShowHeader) => {
  return {
    type: 'SET_DEFAULT_SHOW_HEADER',
    defaultShowHeader
  };
};

export const setDefaultRoundedCorners = (defaultRoundedCorners) => {
  return {
    type: 'SET_DEFAULT_ROUNDED_CORNERS',
    defaultRoundedCorners
  };
};

export const setDefaultThumbInfo = (defaultThumbInfo) => {
  return {
    type: 'SET_DEFAULT_THUMB_INFO',
    defaultThumbInfo
  };
};

export const setDefaultOutputPath = (defaultOutputPath) => {
  return {
    type: 'SET_DEFAULT_OUTPUT_PATH',
    defaultOutputPath
  };
};

export const setDefaultOutputFormat = (defaultOutputFormat) => {
  return {
    type: 'SET_DEFAULT_OUTPUT_FORMAT',
    defaultOutputFormat
  };
};

export const setDefaultSaveOptionOverwrite = (defaultSaveOptionOverwrite) => {
  return {
    type: 'SET_DEFAULT_SAVE_OPTION_OVERWRITE',
    defaultSaveOptionOverwrite
  };
};

export const setDefaultSaveOptionIncludeIndividual = (defaultSaveOptionIncludeIndividual) => {
  return {
    type: 'SET_DEFAULT_SAVE_OPTION_INCLUDE_INDIVIDUAL',
    defaultSaveOptionIncludeIndividual
  };
};

export const setDefaultShowPaperPreview = (defaultShowPaperPreview) => {
  return {
    type: 'SET_DEFAULT_SHOW_PAPER_PREVIEW',
    defaultShowPaperPreview
  };
};

export const setDefaultPaperAspectRatioInv = (defaultPaperAspectRatioInv) => {
  return {
    type: 'SET_DEFAULT_PAPER_ASPECT_RATIO_INV',
    defaultPaperAspectRatioInv
  };
};


// thumbs

export const addThumb = (file, frameNumber, index, thumbId = uuidV4()) => {
  return (dispatch) => {
    console.log('inside addThumb');
    const frameId = uuidV4();
    // let thumbId;
    // if (presetThumbId) {
    //   thumbId = presetThumbId;
    // } else {
    //   thumbId = uuidV4();
    // }
    const newFrameNumberWithinBoundaries = limitRange(frameNumber, 0, file.frameCount - 1);

    imageDB.frameList.where('[fileId+frameNumber]').equals([file.id, newFrameNumberWithinBoundaries]).toArray().then((frames) => {
      console.log(frames.length);
      if (frames.length === 0) {
        ipcRenderer.send('send-get-thumbs', file.id, file.path, [thumbId], [frameId], [newFrameNumberWithinBoundaries], file.useRatio);
        return dispatch({
          type: 'ADD_THUMB',
          payload: {
            thumbId,
            frameId,
            frameNumber,
            fileId: file.id,
            index,
            hidden: false,
          }
        });
      }
      dispatch({
        type: 'ADD_THUMB',
        payload: {
          thumbId,
          frameId: frames[0].frameId,
          frameNumber,
          fileId: file.id,
          index,
          hidden: false,
        }
      });
      return dispatch(updateThumbObjectUrlFromDB(file.id, thumbId, frames[0].frameId, false));
    });
  };
};

export const toggleThumb = (currentFileId, thumbId) => {
  return {
    type: 'TOGGLE_THUMB',
    payload: {
      fileId: currentFileId,
      thumbId
    },
  };
};

export const updateOrder = (currentFileId, array) => {
  return {
    type: 'UPDATE_ORDER',
    payload: {
      fileId: currentFileId,
      array
    },
  };
};

export const removeThumb = (currentFileId, thumbId) => {
  return {
    type: 'REMOVE_THUMB',
    payload: {
      fileId: currentFileId,
      thumbId
    },
  };
};

export const updateFileColumnCount = (fileId, columnCount) => {
  return (dispatch) => {
    console.log('inside updateFileColumnCount');
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
    console.log('inside updateFileDetailUseRatio');
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
    console.log('inside updateFileDetails');
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
    console.log('inside updateInOutPoint');
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

export const updateFrameNumber = (fileId, thumbId, frameNumber) => {
  console.log('inside updateFrameNumber');
  return {
    type: 'UPDATE_FRAMENUMBER_OF_THUMB',
    payload: {
      fileId,
      thumbId,
      frameNumber
    }
  };
};

export const updateThumbImage = (fileId, thumbId, frameId, base64, frameNumber, isPosterFrame = 0) =>
  ((dispatch, getState) => {
    console.log(`inside updateThumbImage frameNumber=${frameNumber}`);
    if (base64 === '') {
      console.log('base64 empty');
    } else {
      fetch(`data:image/png;base64,${base64}`)
        .then(response => {
          if (response.ok) {
            return response.blob();
          }
          throw new Error('fetch base64 to blob was not ok.');
        })
        .then(blob =>
          imageDB.frameList.put({
            frameId,
            fileId,
            frameNumber,
            isPosterFrame,
            data: blob
          }))
        .then(() =>
          dispatch(updateThumbObjectUrlFromDB(fileId, thumbId, frameId, isPosterFrame)))
        .catch(error => {
          console.log(`There has been a problem with your fetch operation: ${error.message}`);
        });
      // only update frameNumber if not posterframe and different
      if (!isPosterFrame &&
        getState().undoGroup.present.thumbsByFileId[fileId].thumbs.find((thumb) =>
          thumb.thumbId === thumbId).frameNumber !== frameNumber) {
        dispatch(updateFrameNumber(fileId, thumbId, frameNumber));
      }
    }
  });

export const updateThumbObjectUrlFromDB = (fileId, thumbId, frameId, isPosterFrame = 0) =>
  (dispatch) => {
    console.log('inside updateThumbObjectUrlFromDB');
    console.log(frameId);
    return imageDB.frameList.where('frameId').equals(frameId).toArray().then((frames) => {
      // console.log(frames[0]);
      if (isPosterFrame) {
        return dispatch({
          type: 'UPDATE_OBJECTURL_FROM_POSTERFRAME',
          payload: {
            frameId,
            frames
          },
        });
      }
      return dispatch({
        type: 'UPDATE_OBJECTURL_FROM_THUMBLIST',
        payload: {
          fileId,
          frameId,
          frames
        },
      });
    });
  };

export const updateObjectUrlsFromThumbList = (fileId, frameIdArray) => {
  return (dispatch) => {
    console.log('inside updateObjectUrlsFromThumbList');
    imageDB.frameList.where('frameId').anyOf(frameIdArray).toArray().then((frames) => {
      console.log(frames.length);
      if (frames.length !== 0) {
        dispatch({
          type: 'UPDATE_OBJECTURLS_FROM_THUMBLIST',
          payload: {
            fileId,
            frames
          },
        });
      }
    });
  };
};

export const clearThumbs = () => {
  return {
    type: 'CLEAR_THUMBS'
  };
};

export const addDefaultThumbs = (file, amount = 20, start = 10, stop = file.frameCount - 1) => {
  return (dispatch) => {
    console.log('inside addDefaultThumbs');
    console.log(start);
    console.log(stop);
    // const start = 10;
    // const stop = file.frameCount - 1;
    const startWithBoundaries = limitRange(start, 0, file.frameCount - 1);
    const stopWithBoundaries = limitRange(stop, 0, file.frameCount - 1);
    const frameNumberArray = Array.from(Array(amount).keys())
      .map(x => mapRange(x, 0, amount - 1, startWithBoundaries, stopWithBoundaries));
    console.log(frameNumberArray);
    const frameIdArray = frameNumberArray.map(() => uuidV4());
    const thumbIdArray = frameNumberArray.map(() => uuidV4());

    // maybe add check if thumb is already in imageDB
    // imageDB.frameList.where('fileId').equals(file.id).toArray().then((frames) => {
    // });

    ipcRenderer.send('send-get-thumbs', file.id, file.path, thumbIdArray, frameIdArray, frameNumberArray, file.useRatio);
    // ipcRenderer.send('send-get-thumbs', file.id, file.path, frameIdArray, frameNumberArray);
    dispatch({
      type: 'ADD_DEFAULT_THUMBS',
      thumbIdArray,
      frameIdArray,
      frameNumberArray,
      fileId: file.id,
      width: file.width,
      height: file.height,
    });
  };
};

export const changeThumb = (file, thumbId, newFrameNumber) => {
  return (dispatch) => {
    console.log('inside changeThumb');
    const newFrameId = uuidV4();
    const newFrameNumberWithinBoundaries = limitRange(newFrameNumber, 0, file.frameCount - 1);

    imageDB.frameList.where('[fileId+frameNumber]').equals([file.id, newFrameNumberWithinBoundaries]).toArray().then((frames) => {
      console.log(frames.length);
      if (frames.length === 0) {
        ipcRenderer.send('send-get-thumbs', file.id, file.path, [thumbId], [newFrameId], [newFrameNumberWithinBoundaries], file.useRatio);
        return dispatch({
          type: 'CHANGE_THUMB',
          payload: {
            newFrameId,
            thumbId,
            newFrameNumber: newFrameNumberWithinBoundaries,
            fileId: file.id,
          }
        });
      }
      dispatch({
        type: 'CHANGE_THUMB',
        payload: {
          newFrameId: frames[0].frameId,
          thumbId,
          newFrameNumber: frames[0].frameNumber,
          fileId: file.id,
        }
      });
      return dispatch(updateThumbObjectUrlFromDB(file.id, thumbId, frames[0].frameId, false));
    });
  };
};

// export const addThumbWithDetectFace = (file, index) => {
//   return (dispatch) => {
//     console.log('inside detectFace');
//     const tempId = uuidV4();
//     const frameNumberArray = [1, 10, 20, 30, 40, 50, 60, 70, 23];
//     ipcRenderer.send('send-face-detect', file.id, file.path, tempId, frameNumberArray);
//     dispatch({
//       type: 'ADD_THUMB_WITH_DETECT_FACE',
//       id: tempId,
//       index,
//       objectUrl: file.objectUrl
//     });
//   };
// };

// files

export const setMovieList = (files) => {
  return {
    type: 'SET_MOVIE_LIST',
    files
  };
};

export const setNewMovieList = (files, settings) => {
  return (dispatch, getState) => {
    console.log('inside setNewMovieList');
    const newFiles = [];
    Object.keys(files).map((key) => {
      // file match needs to be in sync with onDrop() and accept in App.js !!!
      if (files[key].type.match('video.*') ||
        files[key].name.match(/.divx|.mkv|.ogg|.VOB/i)) {
        const tempId = uuidV4();
        const fileToAdd = {
          id: tempId,
          lastModified: files[key].lastModified,
          lastModifiedDate: files[key].lastModifiedDate.toDateString(),
          name: files[key].name,
          path: files[key].path,
          size: files[key].size,
          type: files[key].type,
          webkitRelativePath: files[key].webkitRelativePath,
          posterFrameId: uuidV4(),
          columnCount: settings.defaultColumnCount,
        };
        newFiles.push(fileToAdd);
      }
      return newFiles;
    });
    dispatch({
      type: 'CLEAR_CURRENT_FILEID',
    });
    dispatch({
      type: 'CLEAR_MOVIE_LIST',
    });
    return imageDB.frameList.clear()
      .then(() => {
        dispatch({
          type: 'LOAD_MOVIE_LIST_FROM_DROP',
          payload: newFiles,
        });
        const newFilesLength = newFiles.length;
        let firstItem = true;
        newFiles.map((file, index) => {
          console.log(`${newFilesLength} : ${index}`);
          ipcRenderer.send('send-get-file-details', file.id, file.path, file.posterFrameId, firstItem);
          firstItem = false;
        });
      });
  };
};

export const updateObjectUrlsFromPosterFrame = () => {
  return (dispatch, getState) => {
    console.log('inside updateObjectUrlsFromPosterFrame');
    return imageDB.frameList.where('isPosterFrame').equals(1).toArray()
      .then((frames) => {
        console.log(frames);
        return dispatch({
          type: 'UPDATE_OBJECTURLS_FROM_POSTERFRAME',
          payload: {
            files: getState().undoGroup.present.files,
            frames
          },
        });
      });
  };
};
