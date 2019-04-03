import pathR from 'path';
import log from 'electron-log';
import { ensureDirectoryExistence, getFilePathObject, pad } from './utils';
import { getBase64Object } from './utilsForOpencv';

const { ipcRenderer } = require('electron');
const { app } = require('electron').remote;

const saveThumb = (filePath, fileUseRatio, fileName, frameNumber, frameId, saveToFolder = '', overwrite = false, transformObject) => {
  // save thumbs in folder with the same name as moviePrint
  let newFolderName = app.getPath('desktop');
  if (saveToFolder) {
    newFolderName = saveToFolder;
    ensureDirectoryExistence(newFolderName);
  }

  const frameSize = 0 // save frame in original size

  const newFilePathObject = getFilePathObject(fileName, `-frame${pad(frameNumber, 6)}`, 'jpg', newFolderName, overwrite);
  const newFilePathAndName = pathR.join(
    newFilePathObject.dir,
    newFilePathObject.base
  );

  const base64Object = getBase64Object(
    filePath,
    fileUseRatio,
    [
      {
      frameId,
      frameNumber,
      }
    ],
    frameSize,
    transformObject
  );
  const base64 = base64Object[frameId];
  const buf = Buffer.from(base64, 'base64');

  ipcRenderer.send('send-save-file', frameId, newFilePathAndName, buf);
  log.debug(`Saving ${JSON.stringify({ newFilePathAndName, size: buf.length })}`);

};

export default saveThumb;
