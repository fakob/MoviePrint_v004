import pathR from 'path';
import log from 'electron-log';
import { DEFAULT_THUMB_JPG_QUALITY, DEFAULT_THUMB_FORMAT } from './constants';
import { ensureDirectoryExistence, getFilePathObject } from './utils';
import { getBase64Object } from './utilsForOpencv';

const { ipcRenderer } = require('electron');
const { app } = require('electron').remote;

const saveThumb = (
  filePath,
  fileUseRatio,
  movieFileName,
  sheetName,
  frameNumber,
  fileNameTemplate,
  frameId,
  transformObject,
  saveToFolder = '',
  overwrite = false,
  defaultThumbFormat = DEFAULT_THUMB_FORMAT,
  defaultThumbJpgQuality = DEFAULT_THUMB_JPG_QUALITY,
  fps = 25,
) => {
  // save thumbs in folder with the same name as moviePrint
  let newFolderName = app.getPath('desktop');
  if (saveToFolder) {
    newFolderName = saveToFolder;
    ensureDirectoryExistence(newFolderName);
  }

  const frameSize = 0; // save frame in original size

  const newFilePathObject = getFilePathObject(
    movieFileName,
    sheetName,
    frameNumber,
    fileNameTemplate,
    defaultThumbFormat,
    newFolderName,
    overwrite,
    fps,
  );
  const newFilePathAndName = pathR.join(newFilePathObject.dir, newFilePathObject.base);

  const thumbFormatObject = {
    defaultThumbFormat,
    defaultThumbJpgQuality,
  };

  const base64Object = getBase64Object(
    filePath,
    fileUseRatio,
    [
      {
        frameId,
        frameNumber,
      },
    ],
    frameSize,
    transformObject,
    thumbFormatObject,
    true,
  );
  const base64 = base64Object[frameId];

  if (base64 === '') {
    ipcRenderer.send('message-from-workerWindow-to-mainWindow', 'received-saved-file-error', 'Frame is empty');
  } else {
    const buf = Buffer.from(base64, 'base64');

    ipcRenderer.send('send-save-file', frameId, newFilePathAndName, buf);
    log.debug(`Saving ${JSON.stringify({ newFilePathAndName, size: buf.length })}`);
  }
};

export default saveThumb;
