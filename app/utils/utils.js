import html2canvas from 'html2canvas';
import pathR from 'path';
import fsR from 'fs';
import imageDB from './db';

const randomColor = require('randomcolor');

const { ipcRenderer } = require('electron');
const { app } = require('electron').remote;

const ensureDirectoryExistence = (filePath, isDirectory = true) => {
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
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const saveBlob = (blob, fileName) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (reader.readyState === 2) {
      const buffer = Buffer.from(reader.result);
      ipcRenderer.send('send-save-file', fileName, buffer);
      console.log(`Saving ${JSON.stringify({ fileName, size: blob.size })}`);
    }
  };
  reader.readAsArrayBuffer(blob);
};

export const saveThumb = (fileName, frameNumber, frameId, saveToFolder = '', overwrite = false) => {
  // save thumbs in folder with the same name as moviePrint
  let newFolderName = app.getPath('desktop');
  if (saveToFolder) {
    newFolderName = saveToFolder;
    ensureDirectoryExistence(newFolderName);
  }

  const newFilePathObject = getFilePathObject(fileName, `-frame${pad(frameNumber, 6)}`, 'png', newFolderName, overwrite);
  const newFilePathAndName = pathR.join(
    newFilePathObject.dir,
    newFilePathObject.base
  );

  return imageDB.frameList.where('frameId').equals(frameId).toArray().then((frames) => {
    console.log(frames[0]);
    const reader = new FileReader();

    // This event is triggered each time the reading operation is successfully completed.
    reader.onload = () => {
      if (reader.readyState === 2) {
        const buffer = Buffer.from(reader.result);
        ipcRenderer.send('send-save-file', newFilePathAndName, buffer);
        console.log(`Saving ${JSON.stringify({ newFilePathAndName, size: frames[0].data.size })}`);
      }
    };

    reader.readAsArrayBuffer(frames[0].data);
    return true;
  });
};

function getMimeType(outputFormat) {
  switch (outputFormat) {
    case 'png':
      return 'image/png';
    case 'jpg':
      return 'image/jpeg';
    default:
      return 'image/png';
  }
}

export const getMoviePrintColor = (count) => {

  // old static colours
  // const colorArray = [
  //   '#FF5006',
  //   '#FFb709',
  //   '#FF9365',
  //   '#FFa883',
  //   '#FFd3c1',
  // ];

  console.log(`creating new newColorArray[${count}]`);

  const newColorArray = randomColor({
    count,
    hue: '#FF5006',
  });
  return newColorArray;
};

const getFilePathObject = (
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

export const saveMoviePrint = (elementId, exportPath, file, scale, outputFormat, overwrite, saveIndividualThumbs = false, thumbs) => {
  console.log(file);
  const node = document.getElementById(elementId);

  const newFilePathObject = getFilePathObject(file.name, '_MoviePrint', outputFormat, exportPath, overwrite);
  const newFilePathAndName = pathR.join(
    newFilePathObject.dir,
    newFilePathObject.base
  );

  const qualityArgument = 0.8; // only applicable for jpg

  // console.log(newFilePathAndName);
  // console.log(node);

  html2canvas(node, {
    backgroundColor: null,
    allowTaint: true,
    scale,
  }).then((canvas) => {
    canvas.toBlob((blob) => {
      saveBlob(blob, newFilePathAndName);
    }, getMimeType(outputFormat), qualityArgument);
  });

  const newFilePathAndNameWithoutExtension = pathR.join(
    newFilePathObject.dir,
    newFilePathObject.name
  );

  if (saveIndividualThumbs) {
    thumbs.map(thumb => {
      saveThumb(newFilePathObject.name, thumb.frameNumber, thumb.frameId, newFilePathAndNameWithoutExtension, overwrite);
    });
  }
};

export const getLowestFrame = (thumbs) => {
  return thumbs.reduce(
    (min, p) => (p.frameNumber < min ? p.frameNumber : min),
    thumbs[0].frameNumber
  );
};

export const getHighestFrame = (thumbs) => {
  return thumbs.reduce(
    (max, p) => (p.frameNumber > max ? p.frameNumber : max),
    thumbs[0].frameNumber
  );
};

export const getChangeThumbStep = (index) => {
  const changeThumbStep = [1, 10, 100];
  return changeThumbStep[index];
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
