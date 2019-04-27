import uuidV4 from 'uuid/v4';
import pathR from 'path';
import fsR from 'fs';
import extract from 'png-chunks-extract';
import encode from 'png-chunks-encode';
import text from 'png-chunk-text';
import log from 'electron-log';
import VideoCaptureProperties from './videoCaptureProperties';
import sheetNames from '../img/listOfNames.json'

const randomColor = require('randomcolor');
const { ipcRenderer } = require('electron');
const { app } = require('electron').remote;

export const getFileStatsObject = (filename) => {
  if (!fsR.existsSync(filename)) {
    return undefined;
  }
  const stats = fsR.statSync(filename);
  const { mtime, size } = stats;
  return {
    size,
    lastModified: Date.parse(mtime),
  };
}

export const ensureDirectoryExistence = (filePath, isDirectory = true) => {
  let dirname;
  if (isDirectory) {
    dirname = filePath;
  } else {
    dirname = pathR.dirname(filePath);
  }
  // log.debug(dirname);
  if (fsR.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname, false);
  fsR.mkdirSync(dirname);
};

// prevent typeerrors when accessing nested props of a none-existing object
// usage getObjectProperty(() => objectA.propertyB)
export const getObjectProperty = (fn) => {
  let value;
  try {
    value = fn();
    return value;
  } catch (e) {
    value = undefined;
    return value;
  }
};

export const mapRange = (value, low1, high1, low2, high2, returnInt = true) => {
  // special case, prevent division by 0
  if ((high1 - low1) === 0) {
    return 0;
  }
  // * 1.0 added to force float division
  let newValue = low2 + ((high2 - low2) * (((value - low1) * 1.0) / (high1 - low1)));
  newValue = Math.round((newValue * 1000) + Number.EPSILON) / 1000; // rounds the number with 3 decimals
  let limitedNewValue = Math.min(Math.max(newValue, low2), high2);
  if (returnInt) {
    limitedNewValue = Math.round(limitedNewValue);
  }
  return limitedNewValue;
};

export const limitRange = (value, lowerLimit, upperLimit) =>
  // value || 0 makes sure that NaN s are turned into a number to work with
  Math.min(Math.max(value || 0, lowerLimit || 0), upperLimit || 0);

export const truncate = (n, len) => {
  const ext = n.substring(n.lastIndexOf('.') + 1, n.length).toLowerCase();
  let filename = n.substring(0, n.lastIndexOf('.'));
  if (filename.length <= len) {
    return n;
  }
  filename = filename.substr(0, len) + (n.length > len ? '...' : '');
  return `${filename}.${ext}`;
};

export const truncatePath = (n, len) => {
  // check if length of string is actually longer than truncate length
  // if not return the original string without truncation
  // value of 3 compensates for ... (the 3 dots)
  if ((n.length - 3) > len) {
    const front = n.slice(0, (len / 2) - 1); // compensate for dots
    const back = n.slice((-len / 2) - 2); // compensate for dots
    return `${front}...${back}`;
  }
  return n;
};


export const pad = (num, size) => {
  if (size !== undefined) {
    let s = (num !== undefined) ? num.toString() : '';
    while (s.length < size) s = `${(num !== undefined) ? '0' : '–'}${s}`;
    return s;
  }
  return undefined;
};

export const secondsToFrameCount = (seconds = 0, fps = 25) => {
  const frames = Math.round(seconds * fps * 1.0);
  return frames;
};

export const frameCountToSeconds = (frames, fps = 25) => {
  const seconds = (frames !== undefined ? ((frames * 1.0) / fps) : 0);
  return seconds;
};

export const frameCountToMinutes = (frames, fps = 25) => {
  const seconds = (frames !== undefined ? ((frames * 1.0) / (fps * 60)) : 0);
  return seconds;
};

export const frameCountToTimeCode = (frames, fps = 25) => {
  // fps = (fps !== undefined ? fps : 30);
  if (frames !== undefined) {
    const paddedValue = (input) => ((input < 10) ? `0${input}` : input);
    const seconds = (frames !== undefined ? frames / fps : 0);
    return [
      paddedValue(Math.floor(seconds / 3600)),
      paddedValue(Math.floor((seconds % 3600) / 60)),
      paddedValue(Math.floor(seconds % 60)),
      paddedValue(Math.floor(frames % fps))
    ].join(':');
  }
  return '––:––:––:––';
};

export const secondsToTimeCode = (seconds = 0, fps = 25) => {
  const pad = (input) => ((input < 10) ? `0${input}` : input);

  return [
    pad(Math.floor(seconds / 3600)),
    pad(Math.floor((seconds % 3600) / 60)),
    pad(Math.floor(seconds % 60)),
    pad(Math.floor((seconds * fps) % fps))
    // pad(Math.floor((seconds - Math.floor(seconds)) * 1000), 3, '0')
  ].join(':');
};

export const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals || 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  return `${parseFloat((bytes / (k ** i)).toFixed(dm))} ${sizes[i]}`;
};

export const saveBlob = (blob, sheetId, fileName, dataToEmbed = undefined) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (reader.readyState === 2) {
      const buffer = Buffer.from(reader.result);
      let chunkBuffer = buffer;

      // if there is data to embed, create chunks and add them in the end
      if (dataToEmbed !== undefined) {
        const { filePath, transformObject, columnCount, frameNumberArray} = dataToEmbed;
        // Create chunks
        const version = text.encode('version', app.getVersion());
        const filePathChunk = text.encode('filePath', filePath);
        const transformObjectChunk = text.encode('transformObject', JSON.stringify(transformObject));
        const columnCountChunk = text.encode('columnCount', columnCount);
        const frameNumberArrayChunk = text.encode('frameNumberArray', JSON.stringify(frameNumberArray));

        const chunks = extract(buffer)

        // Add new chunks before the IEND chunk
        chunks.splice(-1, 0, version);
        chunks.splice(-1, 0, filePathChunk);
        chunks.splice(-1, 0, transformObjectChunk);
        chunks.splice(-1, 0, columnCountChunk);
        chunks.splice(-1, 0, frameNumberArrayChunk);

        chunkBuffer = Buffer.from(encode(chunks));
      }

      ipcRenderer.send('send-save-file', sheetId, fileName, chunkBuffer, true);
      log.debug(`Saving ${JSON.stringify({ fileName, size: blob.size })}`);
    }
  };
  try {
    reader.readAsArrayBuffer(blob);
  } catch (e) {
    ipcRenderer.send('send-save-file-error', true);
  }
};

export const getMimeType = (outputFormat) => {
  switch (outputFormat) {
    case 'png':
      return 'image/png';
    case 'jpg':
      return 'image/jpeg';
    default:
      return 'image/png';
  }
};

export const getMoviePrintColor = (count) => {
  // log.debug(`creating new newColorArray[${count}]`);
  const newColorArray = randomColor({
    count,
    hue: '#FF5006',
  });
  return newColorArray;
};

export const getFilePathObject = (
  fileName,
  postfix = '',
  outputFormat,
  // exportPath = '',
  exportPath = app.getPath('desktop'),
  overwrite = false
) => {
  // in case there is no file loaded give standard name
  let newFileName = fileName !== undefined ? `${fileName}${postfix}.${outputFormat}` :
    `MoviePrint.${outputFormat}`;
  let newFilePathAndName = pathR.join(exportPath, newFileName);

  if (!overwrite) {
    if (fsR.existsSync(newFilePathAndName)) {
      for (let i = 1; i < 1000; i += 1) {
        newFileName = fileName !== undefined ? `${fileName}${postfix} edit ${i}.${outputFormat}` :
          `MoviePrint edit ${i}.${outputFormat}`;
        newFilePathAndName = pathR.join(exportPath, newFileName);
        if (!fsR.existsSync(newFilePathAndName)) {
          break;
        }
      }
    }
  }
  return pathR.parse(newFilePathAndName);
};

export const getThumbInfoValue = (type, frames, framesPerSecond) => {
  switch (type) {
    case 'frames':
      return pad(frames, 4);
    case 'timecode':
      return frameCountToTimeCode(frames, framesPerSecond);
    case 'hideInfo':
      return undefined;
    default:
      return undefined;
  }
};

export const getLowestFrame = (thumbs) => {
  if (thumbs && (thumbs.length > 0)) {
    return thumbs.reduce(
      (min, p) => (p.frameNumber < min ? p.frameNumber : min),
      thumbs[0].frameNumber
    );
  }
  return undefined;
};

export const getHighestFrame = (thumbs) => {
  if (thumbs && (thumbs.length > 0)) {
    return thumbs.reduce(
      (max, p) => (p.frameNumber > max ? p.frameNumber : max),
      thumbs[0].frameNumber
    );
  }
  return undefined;
};

export const getAllFrameNumbers = (thumbs) => {
  if (thumbs && (thumbs.length > 0)) {
    return thumbs.map(
      thumb => thumb.frameNumber
    );
  }
  return [];
};

export const getPreviousThumbs = (thumbs, thumbId) => {
  if (thumbs) {
    if (thumbId) {
      const currentIndex = thumbs.find((thumb) => thumb.thumbId === thumbId).index;
      return thumbs.filter((thumb) => ((thumb.hidden === false) &&
        (thumb.index < currentIndex)));
    }
    return thumbs; // return last item if no thumbId provided
  }
  return undefined; // return undefined if no thumbs provided
};

export const getNextThumbs = (thumbs, thumbId) => {
  if (thumbs) {
    if (thumbId) {
      const currentIndex = thumbs.find((thumb) => thumb.thumbId === thumbId).index;
      return thumbs.filter((thumb) => ((thumb.hidden === false) &&
        (thumb.index > currentIndex)));
    }
    return thumbs; // return last item if no thumbId provided
  }
  return undefined; // return undefined if no thumbs provided
};

export const getPreviousThumb = (thumbs, thumbId) => {
  if (thumbs) {
    if (thumbId) {
      const currentIndex = thumbs.find((thumb) => thumb.thumbId === thumbId).index;
      const newIndex = ((currentIndex - 1) >= 0) ? (currentIndex - 1) : (thumbs.length - 1);
      // log.debug(thumbs[newIndex]);
      return thumbs[newIndex];
    }
    return thumbs[thumbs.length - 1]; // return last item if no thumbId provided
  }
  return undefined; // return undefined if no thumbs provided
};

export const getNextThumb = (thumbs, thumbId) => {
  if (thumbs) {
    if (thumbId) {
      const currentIndex = thumbs.find((thumb) => thumb.thumbId === thumbId).index;
      const newIndex = ((currentIndex + 1) < thumbs.length) ? (currentIndex + 1) : 0;
      // log.debug(thumbs[newIndex]);
      return thumbs[newIndex];
    }
    return thumbs[0]; // return first item if no thumbId provided
  }
  return undefined; // return undefined if no thumbs provided
};

export const getVisibleThumbs = (thumbs, filter) => {
  if (thumbs === undefined) {
    return thumbs;
  }
  switch (filter) {
    case 'SHOW_ALL':
      return thumbs;
    case 'SHOW_HIDDEN':
      return thumbs.filter(t => t.hidden);
    case 'SHOW_VISIBLE':
      return thumbs.filter(t => !t.hidden);
    default:
      return thumbs;
  }
};

export const getAspectRatio = (file) => {
  if (file === undefined || file.width === undefined || file.height === undefined) {
    return (16 * 1.0) / 9; // default 16:9
  }
  return ((file.width * 1.0) / file.height);
};

export const getRandomSheetName = () => {
  // return random name from sheetNames array
  const randomNameObject = sheetNames[Math.floor(Math.random()*sheetNames.length)];
  return randomNameObject.fullName;
};

export const getNewSheetName = (sheetCount = 0) => {
  // return random name from sheetNames array
  const sheetName = `MoviePrint-${sheetCount + 1}`;
  return sheetName;
};

export const getSheetId = (sheetsByFileId, fileId) => {
  if (sheetsByFileId[fileId] === undefined) {
    // there is no file yet, so return undefined
    return undefined;
  }
  const sheetIdArray = Object.getOwnPropertyNames(sheetsByFileId[fileId]);
  if (sheetIdArray.length === 0) {
    // there are no sheetIds yet, so return undefined
    return undefined;
  }
  // return first sheetId in array
  return sheetIdArray[0];
};

export const getFramenumbers = (sheet, visibilityFilter) => {
  if (sheet.thumbsArray === undefined) {
    return undefined;
  }
  const { thumbsArray } = sheet;
  if (visibilityFilter === 'SHOW_VISIBLE') {
    const frameNumberArray = thumbsArray
      .filter(thumb => thumb.hidden === false)
      .map(thumb => thumb.frameNumber);
    return frameNumberArray;
  }
  return thumbsArray.map(thumb => thumb.frameNumber);
};

export const getFramenumbersOfSheet = (sheetsByFileId, fileId, sheetId, visibilitySettings) => {
  if (sheetsByFileId[fileId] === undefined ||
    fileId === undefined ||
    sheetId === undefined ||
    sheetsByFileId[fileId][sheetId] === undefined ||
    sheetsByFileId[fileId][sheetId].thumbsArray === undefined) {
    return undefined;
  }
  const { thumbsArray } = sheetsByFileId[fileId][sheetId];
  if (visibilitySettings.visibilityFilter === 'SHOW_VISIBLE') {
    const frameNumberArray = thumbsArray
      .filter(thumb => thumb.hidden === false)
      .map(thumb => thumb.frameNumber);
    return frameNumberArray;
  }
  return thumbsArray.map(thumb => thumb.frameNumber);
};

export const getSheetCount = (files, fileId) => {
  const file = files.find(file2 => file2.id === fileId);
  console.log(file);
  if (file === undefined) {
    // there is no file yet, so return undefined
    return 0;
  }
  return file.sheetCounter;
};

export const getFileName = (files, fileId) => {
  const file = files.find(file2 => file2.id === fileId);
  // console.log(file);
  if (file === undefined) {
    // there is no file yet, so return undefined
    return 0;
  }
  return file.name;
};

export const getFilePath = (files, fileId) => {
  const file = files.find(file2 => file2.id === fileId);
  // console.log(file);
  if (file === undefined) {
    // there is no file yet, so return undefined
    return 0;
  }
  return file.path;
};

export const getFileTransformObject = (files, fileId) => {
  const file = files.find(file2 => file2.id === fileId);
  // console.log(file);
  if (file === undefined) {
    // there is no file yet, so return undefined
    return 0;
  }
  return file.transformObject;
};

export const getSheetIdArray = (sheetsByFileId, fileId) => {
  if (sheetsByFileId[fileId] === undefined) {
    // there is no file yet, so return undefined
    return undefined;
  }
  const sheetIdArray = Object.getOwnPropertyNames(sheetsByFileId[fileId]);
  if (sheetIdArray.length === 0) {
    // there are no sheetIds yet, so return undefined
    return undefined;
  }
  // return first sheetId in array
  return sheetIdArray;
};

export const getSheetName = (sheetsByFileId, fileId, sheetId) => {
  if (sheetsByFileId === undefined ||
    sheetsByFileId[fileId] === undefined ||
    sheetsByFileId[fileId][sheetId] === undefined ||
    sheetsByFileId[fileId][sheetId].name === undefined) {
    return 'MoviePrint';
  }
  return sheetsByFileId[fileId][sheetId].name;
};

export const getSheetView = (sheetsByFileId, fileId, sheetId, visibilitySettings) => {
  if (sheetsByFileId === undefined ||
    sheetsByFileId[fileId] === undefined ||
    sheetsByFileId[fileId][sheetId] === undefined ||
    sheetsByFileId[fileId][sheetId].sheetView === undefined) {
    return visibilitySettings.defaultSheetView;
  }
  return sheetsByFileId[fileId][sheetId].sheetView;
};

export const getSheetType = (sheetsByFileId, fileId, sheetId, settings) => {
  if (sheetsByFileId === undefined ||
    sheetsByFileId[fileId] === undefined ||
    sheetsByFileId[fileId][sheetId] === undefined ||
    sheetsByFileId[fileId][sheetId].type === undefined) {
    return settings.defaultSheetType;
  }
  return sheetsByFileId[fileId][sheetId].type;
};

export const getColumnCount = (sheetsByFileId, fileId, sheetId, settings) => {
  if (sheetsByFileId === undefined ||
    sheetsByFileId[fileId] === undefined ||
    sheetsByFileId[fileId][sheetId] === undefined ||
    sheetsByFileId[fileId][sheetId].columnCount === undefined) {
    return settings.defaultColumnCount;
  }
  return sheetsByFileId[fileId][sheetId].columnCount;
};

export const getSecondsPerRow = (sheetsByFileId, fileId, sheetId, settings) => {
  if (sheetsByFileId === undefined ||
    sheetsByFileId[fileId] === undefined ||
    sheetsByFileId[fileId][sheetId] === undefined ||
    sheetsByFileId[fileId][sheetId].secondsPerRow === undefined) {
    return settings.defaultTimelineViewSecondsPerRow;
  }
  return sheetsByFileId[fileId][sheetId].secondsPerRow;
};

export const getThumbsCount = (file, sheetsByFileId, settings, visibilitySettings) => {
  if (file === undefined ||
    file.id === undefined ||
    sheetsByFileId[file.id] === undefined ||
    settings.currentSheetId === undefined ||
    sheetsByFileId[file.id][settings.currentSheetId] === undefined ||
    sheetsByFileId[file.id][settings.currentSheetId].thumbsArray === undefined) {
    return settings.defaultThumbCount;
  }
  if (visibilitySettings.visibilityFilter === 'SHOW_VISIBLE') {
    return sheetsByFileId[file.id][settings.currentSheetId].thumbsArray
      .filter(thumb => thumb.hidden === false).length;
  }
  return sheetsByFileId[file.id][settings.currentSheetId].thumbsArray.length;
};

export const setPosition = (vid, frameNumberToCapture, useRatio) => {
  if (useRatio) {
    const positionRatio =
      frameNumberToCapture *
      1.0 /
      (vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1);
    // log.debug(`using positionRatio: ${positionRatio}`);
    vid.set(VideoCaptureProperties.CAP_PROP_POS_AVI_RATIO, positionRatio);
  } else {
    vid.set(VideoCaptureProperties.CAP_PROP_POS_FRAMES, frameNumberToCapture);
  }
};

export const renderImage = (img, canvas, cv) => {
  const matRGBA = img.channels === 1 ? img.cvtColor(cv.COLOR_GRAY2RGBA) : img.cvtColor(cv.COLOR_BGR2RGBA);

  canvas.height = img.rows;
  canvas.width = img.cols;
  const imgData = new ImageData(
    new Uint8ClampedArray(matRGBA.getData()),
    img.cols,
    img.rows
  );
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imgData, 0, 0);
}

export const getScrubFrameNumber = (
  mouseX,
  keyObject,
  scaleValueObject,
  frameCount,
  scrubThumb,
  scrubThumbLeft,
  scrubThumbRight
) => {
  let scrubFrameNumber;

  // depending on if scrubbing over ScrubMovie change mapping range
  // scrubbing over ScrubMovie scrubbs over scene, scrubbing left or right of it scrubs over whole movie
  // depending on if add before (shift) or after (alt) changing the mapping range
  const tempLeftFrameNumber = keyObject.altKey ? scrubThumb.frameNumber : scrubThumbLeft.frameNumber
  const tempRightFrameNumber = keyObject.shiftKey ? scrubThumb.frameNumber : scrubThumbRight.frameNumber
  const leftOfScrubMovie = (scaleValueObject.scrubInnerContainerWidth - scaleValueObject.scrubMovieWidth) / 2;
  const rightOfScrubMovie = leftOfScrubMovie + scaleValueObject.scrubMovieWidth;
  if (mouseX < leftOfScrubMovie) {
    scrubFrameNumber = mapRange(mouseX, 0, leftOfScrubMovie, 0, tempLeftFrameNumber);
  } else if (mouseX > rightOfScrubMovie) {
    scrubFrameNumber = mapRange(mouseX, rightOfScrubMovie, scaleValueObject.containerWidth, tempRightFrameNumber, frameCount - 1);
  } else {
    scrubFrameNumber = mapRange(mouseX, leftOfScrubMovie, rightOfScrubMovie, tempLeftFrameNumber, tempRightFrameNumber);
  }
  return scrubFrameNumber;
}

export const deleteProperty = ({[key]: _, ...newObj}, key) => newObj;

export const isEquivalent = (a, b) => {
    // Create arrays of property names
    const aProps = Object.getOwnPropertyNames(a);
    const bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length !== bProps.length) {
        return false;
    }

    for (let i = 0; i < aProps.length; i += 1) {
        const propName = aProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}

export const fourccToString = (fourcc) =>
  `${String.fromCharCode(fourcc & 0XFF)}${String.fromCharCode((fourcc & 0XFF00) >> 8)}${String.fromCharCode((fourcc & 0XFF0000) >> 16)}${String.fromCharCode((fourcc & 0XFF000000) >> 24)}`

export const roundNumber = (number, decimals = 2) =>
  Math.round((number * (10 ** decimals)) + Number.EPSILON) / (10 ** decimals); // rounds the number with 3 decimals

export const getTextWidth = (text, font) => {
    // re-use canvas object for better performance
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

export const limitFrameNumberWithinMovieRange = (file, frameNumber) => {
    const limitedFrameNumber = Math.min((file.frameCount - 1), Math.max(0, frameNumber)); // limit it on lower and on upper end
    return limitedFrameNumber;
}

export const arrayToObject = (array, keyField) => {
  if (array === undefined) {
    return {}
  }
  return array.reduce((obj, item) => {
     obj[item[keyField]] = item
     return obj
   }, {})
 }

export const getScenesInRows = (sceneArray, secondsPerRow) => {
  // get scenes in rows
  if (sceneArray.length === 0) {
    return [];
  }
  const framesPerRow = secondsPerRow * 25;
  // console.log(framesPerRow);
  const sceneLengthsInRowArray = [];
  // sceneLengthsInRowArray.push(sceneArray[0].length);
  const rowArray = [];
  let previousSceneOutPoint = sceneArray[0].start; // get first sceneStart
  // console.log(sceneArray);
  sceneArray.map((scene, index) => {
    // console.log(`${scene.start}, ${scene.length}, ${index}`);
    const sceneOutPoint = previousSceneOutPoint + scene.length;
    sceneLengthsInRowArray.push(scene.length);
    if (sceneLengthsInRowArray.reduce((a, b) => a + b, 0) > framesPerRow) {
      if (sceneLengthsInRowArray.length === 1) { // if only 1 scene
        rowArray.push({
          index,
          sceneOutPoint,
          rowItemCount: sceneLengthsInRowArray.length, // get length
          rowLength: sceneLengthsInRowArray.reduce((a, b) => a + b, 0), // get sum of all lengths
          sceneLengthsInRow: sceneLengthsInRowArray.slice(), // pass copy of array
        });
        sceneLengthsInRowArray.length = 0; // clear array
      } else { // if more than 1 scene
        rowArray.push({
          index: index - 1,
          sceneOutPoint: previousSceneOutPoint,
          rowItemCount: sceneLengthsInRowArray.slice(0,-1).length, // remove last and get length
          rowLength: sceneLengthsInRowArray.slice(0,-1).reduce((a, b) => a + b, 0), // remove last and get sum of all lengths
          sceneLengthsInRow: sceneLengthsInRowArray.slice(0,-1), // remove last and pass copy of array
        });
        sceneLengthsInRowArray.splice(0,sceneLengthsInRowArray.length - 1); // only keep last
      }
    }
    if (sceneArray.length === index + 1) { // last scene
      rowArray.push({
        index,
        sceneOutPoint,
        rowItemCount: sceneLengthsInRowArray.length,
        rowLength: sceneLengthsInRowArray.reduce((a, b) => a + b, 0), // sum of all lengths
        sceneLengthsInRow: sceneLengthsInRowArray.slice(), // pass copy of array
      });
    }
    previousSceneOutPoint = sceneOutPoint;
    return undefined;
  })
  // console.log(rowArray);
  return rowArray;
}

export const getWidthOfSingleRow = (scenes, thumbMargin, pixelPerFrameRatio, minSceneLength) => {
  const sceneLengthArray = scenes.map(scene => Math.max(scene.length, minSceneLength));
  const sumSceneLengths = sceneLengthArray.reduce((a, b) => a + b, 0);
  const widthOfSingleRow = sumSceneLengths * pixelPerFrameRatio + scenes.length * thumbMargin * 2;
  return widthOfSingleRow;
}

// export const getWidthOfLongestRow = (rowArray, thumbMargin, pixelPerFrameRatio, minSceneLengthInFrames) => {
//   // calculate width through getting longest row
//   // console.log(rowArray);
//   // console.log(thumbMargin);
//   // console.log(pixelPerFrameRatio);
//   if (rowArray.length === 0) {
//     return undefined;
//   }
//   const rowLengthArray = [];
//   rowArray.map((row) => {
//     // console.log(row.sceneLengthsInRow);
//     // calculate width
//     let rowWidth = 0;
//     row.sceneLengthsInRow.map((sceneLength) => {
//       // const widthOfScene = Math.max(sceneLength, minSceneLengthInFrames) * pixelPerFrameRatio + thumbMargin * 2;
//       const widthOfScene = Math.max(sceneLength, minSceneLengthInFrames) * pixelPerFrameRatio + thumbMargin * 2 * pixelPerFrameRatio;
//       rowWidth += widthOfScene;
//       // console.log(widthOfScene);
//       return undefined;
//     });
//     rowLengthArray.push(Math.ceil(rowWidth));
//     return undefined;
//   })
//   const maxWidth = Math.max(...rowLengthArray);
//   // console.log(rowLengthArray);
//   // console.log(maxWidth);
//   return maxWidth
// }

export const getPixelPerFrameRatio = (rowArray, thumbMargin, width, minSceneLengthInFrames) => {
  // calculate width through getting longest row
  // console.log(rowArray);
  // console.log(thumbMargin);
  // console.log(width);
  if (rowArray.length === 0) {
    return undefined;
  }
  const pixelPerFrameRatioArray = [];
  rowArray.map((row) => {
    const numOfScenesInRow = row.sceneLengthsInRow.length;
    const minScenesArray = row.sceneLengthsInRow.filter(item => item <=  minSceneLengthInFrames);
    const numOfMinScenes = minScenesArray.length;
    const lengthOfMinScenes = minScenesArray.reduce((a, b) => a + b, 0);
    const lengthOfAllScenes = row.rowLength;
    const lengthOfOtherScenes = lengthOfAllScenes - lengthOfMinScenes;
    // console.log(numOfScenesInRow);
    // console.log(numOfMinScenes);
    // console.log(lengthOfOtherScenes);
    // console.log(lengthOfAllScenes);
    // calculate pixelPerFrameRatio
    const pixelPerFrameRatio = (width - numOfScenesInRow * thumbMargin * 2) /
      ( + numOfMinScenes * minSceneLengthInFrames + lengthOfOtherScenes);
    // console.log(pixelPerFrameRatio);
    pixelPerFrameRatioArray.push(pixelPerFrameRatio);
    return undefined;
  })
  const minPixelPerFrameRatio = Math.min(...pixelPerFrameRatioArray);
  // console.log(pixelPerFrameRatioArray);
  // console.log(minPixelPerFrameRatio);
  return minPixelPerFrameRatio;
}

export const createSceneArray = (sheetsByFileId, fileId, sheetId) => {
  if (sheetsByFileId[fileId] !== undefined &&
    sheetsByFileId[fileId][sheetId] !== undefined &&
    sheetsByFileId[fileId][sheetId].thumbsArray !== undefined) {
    const { thumbsArray } = sheetsByFileId[fileId][sheetId];
    if (thumbsArray.length > 0) {
      const visibleThumbsArray = getVisibleThumbs(thumbsArray, 'SHOW_VISIBLE');
      visibleThumbsArray.sort((t1,t2) => t1.frameNumber - t2.frameNumber);
      console.log(visibleThumbsArray);
      const sceneArray = [];
      let sceneStart = visibleThumbsArray[0].frameNumber; // first sceneStart value
      let sceneLength = Math.floor((visibleThumbsArray[1].frameNumber - visibleThumbsArray[0].frameNumber) / 2); // first sceneLength value
      visibleThumbsArray.map((thumb, index, array) => {
        if (index !== 0) { // everything except the first thumb
          sceneStart = sceneStart + sceneLength + 1;
          if (index < array.length - 1) { // then until second to last
            const nextThumb = array[index + 1];
            sceneLength = (Math.floor((nextThumb.frameNumber - thumb.frameNumber) / 2) + thumb.frameNumber) - sceneStart;
          } else { // last thumb
            sceneLength = thumb.frameNumber - sceneStart;
          }
        }
        sceneArray.push({
          sceneId: thumb.thumbId,
          fileId,
          sheetId,
          start: sceneStart,
          length: sceneLength,
          colorArray: [40,40,40],
        })
        return undefined;
      });
      console.log(sceneArray);
      return sceneArray;
    }
    return [];
  }
  return [];
}

export const getSliceWidthArrayForScrub = (vid, sliceArraySize = 19, sliceWidthOutsideMin = 20) => {
  const width = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH);
  // const height = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT);
  const sliceWidthInMiddle = width;
  const sliceWidthArray = [];
  const halfArraySize = Math.ceil(sliceArraySize / 2);
  for (let i = 0; i < sliceArraySize; i += 1) {
    const factor = i < halfArraySize ? halfArraySize - (i + 1) : (i + 1) - halfArraySize
    const sliceWidth = Math.floor(sliceWidthInMiddle / (2 ** factor));
    sliceWidthArray.push(Math.max(sliceWidth, sliceWidthOutsideMin));
  }
  return sliceWidthArray;
};

export const getSliceWidthArrayForCut = (canvasWidth, sliceArraySize = 20, sliceGap = 1, cutGap = 8) => {
  const halfArraySize = Math.ceil(sliceArraySize / 2);
  const newCanvasWidth = canvasWidth - cutGap - sliceGap * sliceArraySize;
  const sliceWidthInMiddle = Math.floor(newCanvasWidth / 4);
  const sliceWidthArray = [];
  for (let i = 0; i < sliceArraySize; i += 1) {
    const factor = i < halfArraySize ? halfArraySize - (i + 1) : i - halfArraySize;
    const sliceWidth = Math.floor(sliceWidthInMiddle / (2 ** factor));
    sliceWidthArray.push(Math.max(sliceWidth, 1)); // keep minimum of 4px
  }
  return sliceWidthArray;
};

export const getSceneFromFrameNumber = (scenes, frameNumber) => {
  const scene = scenes.find(scene1 => (scene1.start <= frameNumber && (scene1.start + scene1.length) > frameNumber));
  return scene;
}

export const getAdjacentSceneIndicesFromCut = (scenes, frameNumber) => {
  // return an array of 2 adjacent scenes if the frameNumber is the cut in between
  // else return undefined
  const sceneIndex = scenes.findIndex(scene1 => (scene1.start === frameNumber));
  console.log(frameNumber);
  console.log(scenes);
  if (sceneIndex <= 0) {
    return undefined;
  }
  const adjacentSceneIndicesArray = [
    sceneIndex - 1,
    sceneIndex
  ];
  console.log(adjacentSceneIndicesArray);
  return adjacentSceneIndicesArray;
}
