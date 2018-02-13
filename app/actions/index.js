import uuidV4 from 'uuid/v4';
import fs from 'fs';
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

export const startIsManipulating = () => {
  return {
    type: 'START_ISMANIPULATING',
  };
};

export const stopIsManipulating = () => {
  return {
    type: 'STOP_ISMANIPULATING',
  };
};

export const toggleLeftSidebar = () => {
  return {
    type: 'TOGGLE_LEFT_SIDEBAR'
  };
};

export const showLeftSidebar = () => {
  return {
    type: 'SHOW_LEFT_SIDEBAR'
  };
};

export const hideLeftSidebar = () => {
  return {
    type: 'HIDE_LEFT_SIDEBAR'
  };
};

export const toggleRightSidebar = () => {
  return {
    type: 'TOGGLE_RIGHT_SIDEBAR'
  };
};

export const showRightSidebar = () => {
  return {
    type: 'SHOW_RIGHT_SIDEBAR'
  };
};

export const hideRightSidebar = () => {
  return {
    type: 'HIDE_RIGHT_SIDEBAR'
  };
};

// settings

export const setCurrentFileId = (fileId) => {
  return {
    type: 'SET_CURRENT_FILEID',
    fileId
  };
};

export const setDefaultRowCount = (defaultRowCount) => {
  return {
    type: 'SET_DEFAULT_ROW_COUNT',
    defaultRowCount
  };
};

export const setDefaultColumnCount = (defaultColumnCount) => {
  return {
    type: 'SET_DEFAULT_COLUMN_COUNT',
    defaultColumnCount
  };
};

// thumbs

export const addThumb = (text, index) => {
  return {
    type: 'ADD_THUMB',
    id: uuidV4(),
    text: text + ' ' + index,
    index
  };
};

export const toggleThumb = (currentFileId, id) => {
  return {
    type: 'TOGGLE_THUMB',
    payload: {
      fileId: currentFileId,
      id
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

export const removeThumb = (currentFileId, id) => {
  return {
    type: 'REMOVE_THUMB',
    payload: {
      fileId: currentFileId,
      id
    },
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

export const updateFrameNumber = (fileId, id, frameNumber) => {
  console.log('inside updateFrameNumber');
  return {
    type: 'UPDATE_FRAMENUMBER_OF_THUMB',
    payload: {
      fileId,
      id,
      frameNumber
    }
  };
};

export const updateThumbImage = (fileId, id, base64, frameNumber, isPosterFrame = 0) =>
  ((dispatch, getState) => {
    console.log('inside updateThumbImage');
    fetch(`data:image/png;base64,${base64}`)
      .then(response => {
        if (response.ok) {
          return response.blob();
        }
        throw new Error('fetch base64 to blob was not ok.');
      })
      .then(blob =>
        imageDB.thumbList.put({
          id,
          fileId,
          isPosterFrame,
          data: blob
        }))
      .then(() =>
        dispatch(updateThumbObjectUrlFromDB(fileId, id, isPosterFrame)))
      .catch(error => {
        console.log(`There has been a problem with your fetch operation: ${error.message}`);
      });
    // only update frameNumber if not posterframe and different
    if (!isPosterFrame &&
      getState().undoGroup.present.thumbsByFileId[fileId].thumbs.find((thumb) =>
        thumb.id === id).frameNumber !== frameNumber) {
      dispatch(updateFrameNumber(fileId, id, frameNumber));
    }
  });

export const updateThumbObjectUrlFromDB = (fileId, id, isPosterFrame = 0) =>
  (dispatch) => {
    console.log('inside updateThumbObjectUrlFromDB');
    return imageDB.thumbList.where('id').equals(id).toArray().then((thumb) => {
      console.log(thumb[0]);
      if (isPosterFrame) {
        return dispatch({
          type: 'UPDATE_OBJECTURL_FROM_POSTERFRAME',
          payload: {
            id,
            thumb
          },
        });
      }
      return dispatch({
        type: 'UPDATE_OBJECTURL_FROM_THUMBLIST',
        payload: {
          fileId,
          id,
          thumb
        },
      });
    });
  };

export const updateObjectUrlsFromThumbList = (fileId, keyArray) => {
  return (dispatch) => {
    console.log('inside updateObjectUrlsFromThumbList');
    imageDB.thumbList.where('id').anyOf(keyArray).toArray().then((thumbs) => {
      console.log(thumbs.length);
      if (thumbs.length !== 0) {
        dispatch({
          type: 'UPDATE_OBJECTURLS_FROM_THUMBLIST',
          payload: {
            fileId,
            thumbs
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
    let frameNumberArray;
    const noFrameCount = (typeof file.frameCount === 'undefined');
    if (noFrameCount) {
      frameNumberArray = Array.from(Array(amount).keys())
        .map(x => mapRange(x, 0, amount - 1, 0.01, 0.99, false)); // if no length then use relative value (float)
      console.log(frameNumberArray);
    } else {
      frameNumberArray = Array.from(Array(amount).keys())
        .map(x => mapRange(x, 0, amount - 1, startWithBoundaries, stopWithBoundaries));
      console.log(frameNumberArray);
    }
    console.log(noFrameCount);
    const idArray = frameNumberArray.map(() => uuidV4());
    ipcRenderer.send('send-get-thumbs', file.id, file.path, idArray, frameNumberArray, noFrameCount);
    // ipcRenderer.send('send-get-thumbs', file.id, file.path, idArray, frameNumberArray);
    dispatch({
      type: 'ADD_DEFAULT_THUMBS',
      idArray,
      frameNumberArray,
      fileId: file.id,
      width: file.width,
      height: file.height,
      text: file.name,
    });
  };
};

export const changeThumb = (file, oldThumbId, newFrameNumber) => {
  return (dispatch) => {
    console.log('inside changeThumb');
    const newThumbId = uuidV4();
    const newFrameNumberWithinBoundaries = limitRange(newFrameNumber, 0, file.frameCount - 1);
    ipcRenderer.send('send-get-thumbs', file.id, file.path, [newThumbId], [newFrameNumberWithinBoundaries]);
    dispatch({
      type: 'CHANGE_THUMB',
      payload: {
        newThumbId,
        oldThumbId,
        newFrameNumber: newFrameNumberWithinBoundaries,
        fileId: file.id,
      }
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
//       text: file.name + ' ' + index,
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
    dispatch(startIsManipulating());
    const newFiles = [];
    Object.keys(files).map((key) => {
      if (files[key].type.match('video.*')) {
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
          posterThumbId: uuidV4(),
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
    return imageDB.thumbList.clear()
      .then(() => {
        dispatch({
          type: 'LOAD_MOVIE_LIST_FROM_DROP',
          payload: newFiles,
        });
        newFiles.map((file) =>
          ipcRenderer.send('send-get-poster-thumb', file.id, file.path, file.posterThumbId));
        dispatch(setCurrentFileId(getState().undoGroup.present.files[0].id));
        dispatch(clearThumbs());
        dispatch(addDefaultThumbs(
          getState().undoGroup.present.files[0],
          getState().undoGroup.present.settings.defaultRowCount *
          getState().undoGroup.present.settings.defaultColumnCount
        ));
        return dispatch(stopIsManipulating());
      });
  };
};

export const updateObjectUrlsFromPosterFrame = () => {
  return (dispatch, getState) => {
    console.log('inside updateObjectUrlsFromPosterFrame');
    return imageDB.thumbList.where('isPosterFrame').equals(1).toArray()
    .then((thumbs) => {
      console.log(thumbs);
      return dispatch({
        type: 'UPDATE_OBJECTURLS_FROM_POSTERFRAME',
        payload: {
          files: getState().undoGroup.present.files,
          thumbs
        },
      });
    });
  };
};
