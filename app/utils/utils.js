import pathR from 'path';
import fsR from 'fs';
import {
  DEFAULT_THUMB_COUNT, DEFAULT_COLUMN_COUNT, DEFAULT_MOVIE_WIDTH, DEFAULT_MOVIE_HEIGHT,
  SHOW_PAPER_ADJUSTMENT_SCALE
} from './constants';

const randomColor = require('randomcolor');
const { ipcRenderer } = require('electron');

export const ensureDirectoryExistence = (filePath, isDirectory = true) => {
  let dirname;
  if (isDirectory) {
    dirname = filePath;
  } else {
    dirname = pathR.dirname(filePath);
  }
  console.log(dirname);
  if (fsR.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname, false);
  fsR.mkdirSync(dirname);
};

export const clearCache = (win) => {
  win.webContents.session.getCacheSize((cacheSizeBefore) => {
    console.log(`cacheSize before: ${cacheSizeBefore}`);
    // clear HTTP cache
    win.webContents.session.clearCache(() => {
      // then clear data of web storages
      win.webContents.session.clearStorageData(() => {
        // then print cacheSize
        win.webContents.session.getCacheSize((cacheSizeAfter) => {
          console.log(`cacheSize after: ${cacheSizeAfter}`);
          // and reload to use initialStateJSON
          win.webContents.reload();
        });
      });
    });
  });
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
  // * 1.0 added to force float division
  let newValue = low2 + ((high2 - low2) * (((value - low1) * 1.0) / (high1 - low1)));
  newValue = Math.round((newValue * 1000) + Number.EPSILON) / 1000; // rounds the number with 3 decimals
  if (returnInt) {
    newValue = Math.round(newValue);
  }
  return Math.min(Math.max(newValue, low2), high2);
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
  const front = n.slice(0, len / 2);
  const back = n.slice(-len / 2);
  return `${front}...${back}`;
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

export const formatBytes = (bytes, decimals) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals || 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  return `${parseFloat((bytes / (k ** i)).toFixed(dm))} ${sizes[i]}`;
};

export const saveBlob = (blob, fileName) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (reader.readyState === 2) {
      const buffer = Buffer.from(reader.result);
      ipcRenderer.send('send-save-file', fileName, buffer, true);
      console.log(`Saving ${JSON.stringify({ fileName, size: blob.size })}`);
    }
  };
  reader.readAsArrayBuffer(blob);
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
  console.log(`creating new newColorArray[${count}]`);
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
        newFileName = fileName !== undefined ? `${fileName}${postfix} copy ${i}.${outputFormat}` :
          `MoviePrint copy ${i}.${outputFormat}`;
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
  if (thumbs) {
    return thumbs.reduce(
      (min, p) => (p.frameNumber < min ? p.frameNumber : min),
      thumbs[0].frameNumber
    );
  }
};

export const getHighestFrame = (thumbs) => {
  if (thumbs) {
    return thumbs.reduce(
      (max, p) => (p.frameNumber > max ? p.frameNumber : max),
      thumbs[0].frameNumber
    );
  }
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
      // console.log(thumbs[newIndex]);
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
      // console.log(thumbs[newIndex]);
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

export const getColumnCount = (file, settings) => {
  if (file === undefined || file.columnCount === undefined) {
    return settings.defaultColumnCount;
  }
  return file.columnCount;
};

export const getThumbsCount = (file, thumbsByFileId, settings, visibilityFilter) => {
  if (file === undefined || file.id === undefined ||
    thumbsByFileId[file.id] === undefined) {
    return settings.defaultThumbCount;
  }
  if (visibilityFilter === 'SHOW_VISIBLE') {
    return thumbsByFileId[file.id].thumbs
      .filter(thumb => thumb.hidden === false).length;
  }
  return thumbsByFileId[file.id].thumbs.length;
};

export const getScaleValueObject = (
  file,
  settings,
  columnCount = DEFAULT_COLUMN_COUNT,
  thumbCount = DEFAULT_THUMB_COUNT,
  containerWidth,
  containerHeight = 99999, // very high value so it is not taken into account when not set
  showMoviePrintView,
  zoomScale,
  showPaperPreview = false
) => {
  const movieWidth = (file !== undefined && file.width !== undefined ? file.width : DEFAULT_MOVIE_WIDTH);
  const movieHeight = (file !== undefined && file.height !== undefined ? file.height : DEFAULT_MOVIE_HEIGHT);
  const movieAspectRatioInv = (movieHeight * 1.0) / movieWidth;
  const rowCount = Math.ceil(thumbCount / columnCount);
  const headerHeight = settings.defaultShowHeader ? movieHeight *
    settings.defaultHeaderHeightRatio * settings.defaultThumbnailScale : 0;
  const thumbWidth = movieWidth * settings.defaultThumbnailScale;
  const thumbMargin = movieWidth * settings.defaultMarginRatio * settings.defaultThumbnailScale;
  const borderRadius = settings.defaultRoundedCorners ? movieWidth *
    settings.defaultBorderRadiusRatio * settings.defaultThumbnailScale : 0;
  const thumbnailWidthPlusMargin = thumbWidth + (thumbMargin * 2);
  const thumbnailHeightPlusMargin = (thumbWidth * movieAspectRatioInv) + (thumbMargin * 2);
  const moviePrintWidth = columnCount * thumbnailWidthPlusMargin;
  const moviePrintHeightBody = rowCount * thumbnailHeightPlusMargin;
  const moviePrintHeight = headerHeight + (thumbMargin * 2) + moviePrintHeightBody;
  const moviePrintAspectRatioInv = (moviePrintHeight * 1.0) / moviePrintWidth;
  const containerAspectRatioInv = (containerHeight * 1.0) / containerWidth;

  // for thumbView
  const videoHeight = ((containerHeight * 2) / 3) - settings.defaultVideoPlayerControllerHeight;
  const videoWidth = videoHeight / movieAspectRatioInv;
  let videoPlayerHeight = videoHeight + settings.defaultVideoPlayerControllerHeight;
  let videoPlayerWidth = videoWidth;
  if (videoWidth > containerWidth) {
    videoPlayerWidth = containerWidth - (settings.defaultBorderMargin * 2);
    videoPlayerHeight = (videoPlayerWidth * movieAspectRatioInv) +
      settings.defaultVideoPlayerControllerHeight;
  }
  const thumbnailHeightForThumbView =
    ((videoPlayerHeight / 2) - (settings.defaultBorderMargin * 3));
  const thumbnailWidthForThumbView = thumbnailHeightForThumbView / movieAspectRatioInv;
  const borderRadiusForThumbView = thumbnailWidthForThumbView * settings.defaultBorderRadiusRatio;
  const thumbMarginForThumbView = Math.max(2, thumbnailWidthForThumbView * settings.defaultMarginRatio);
  const thumbnailWidthPlusMarginForThumbView =
    thumbnailWidthForThumbView + (thumbMarginForThumbView * 2);
  const moviePrintWidthForThumbView =
    (thumbCount * thumbnailWidthPlusMarginForThumbView) + (thumbnailWidthForThumbView / 2); // only one row
    // for thumbView

  // let newContainerWidth = containerWidth;
  // let newContainerHeight = containerHeight;
  let paperMoviePrintWidth = moviePrintWidth;
  let paperMoviePrintHeight = moviePrintHeight;
  let showPaperAdjustmentScale = 1;
  console.log(`settings.defaultPaperAspectRatioInv|moviePrintAspectRatioInv ${settings.defaultPaperAspectRatioInv}|${moviePrintAspectRatioInv}`);
  if (showPaperPreview) {
    showPaperAdjustmentScale = SHOW_PAPER_ADJUSTMENT_SCALE;
    if (settings.defaultPaperAspectRatioInv < moviePrintAspectRatioInv) {
      // paperMoviePrintHeight = paperMoviePrintWidth * moviePrintAspectRatioInv;
      paperMoviePrintWidth = paperMoviePrintHeight / settings.defaultPaperAspectRatioInv;
      console.log(`calculate new paperMoviePrintWidth ${paperMoviePrintWidth}`);
    } else {
      paperMoviePrintHeight = paperMoviePrintWidth * settings.defaultPaperAspectRatioInv;
      console.log(`calculate new paperMoviePrintHeight ${paperMoviePrintHeight}`);
    }
  }

  const scaleValueWidth = containerWidth / (showPaperPreview ? paperMoviePrintWidth : moviePrintWidth);
  const scaleValueHeight = containerHeight / (showPaperPreview ? paperMoviePrintHeight : moviePrintHeight);

  const scaleValue = Math.min(scaleValueWidth, scaleValueHeight) * zoomScale * showPaperAdjustmentScale;

  const newMoviePrintWidth =
    showMoviePrintView ? moviePrintWidth * scaleValue : moviePrintWidthForThumbView;
  const newMoviePrintHeight = showMoviePrintView ? (newMoviePrintWidth * moviePrintAspectRatioInv) : moviePrintHeight;
  // const newMoviePrintHeight = showMoviePrintView ? moviePrintHeight * scaleValue : moviePrintHeight;
  const newMoviePrintAspectRatioInv = (newMoviePrintHeight * 1.0) / newMoviePrintWidth;
  const newThumbMargin = showMoviePrintView ? thumbMargin * scaleValue : thumbMarginForThumbView;
  const newThumbWidth = showMoviePrintView ? thumbWidth * scaleValue : thumbnailWidthForThumbView;
  const newBorderRadius = showMoviePrintView ? borderRadius * scaleValue : borderRadiusForThumbView;
  const newHeaderHeight = showMoviePrintView ? headerHeight * scaleValue : headerHeight;
  const newScaleValue = showMoviePrintView ? settings.defaultThumbnailScale * scaleValue :
    settings.defaultThumbnailScale;
  console.log(`moviePrintAspectRatioInv|newMoviePrintAspectRatioInv ${moviePrintAspectRatioInv}|${newMoviePrintAspectRatioInv}`);

  const scaleValueObject = {
    aspectRatioInv: movieAspectRatioInv,
    newMoviePrintWidth,
    newMoviePrintHeight,
    newMoviePrintAspectRatioInv,
    newThumbMargin,
    newThumbWidth,
    newBorderRadius,
    newHeaderHeight,
    newScaleValue,
    videoPlayerHeight,
    videoPlayerWidth,
  };
  console.log(scaleValueObject);
  return scaleValueObject;
};
