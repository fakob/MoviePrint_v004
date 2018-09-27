import pathR from 'path';
import log from 'electron-log';
import imageDB from './db';
import { ensureDirectoryExistence, getFilePathObject, pad } from './utils';

const { ipcRenderer } = require('electron');
const { app } = require('electron').remote;

const saveThumb = (fileName, frameNumber, frameId = undefined, saveToFolder = '', overwrite = false) => {
  // save thumbs in folder with the same name as moviePrint
  let newFolderName = app.getPath('desktop');
  if (saveToFolder) {
    newFolderName = saveToFolder;
    ensureDirectoryExistence(newFolderName);
  }

  const newFilePathObject = getFilePathObject(fileName, `-frame${pad(frameNumber, 6)}`, 'jpg', newFolderName, overwrite);
  const newFilePathAndName = pathR.join(
    newFilePathObject.dir,
    newFilePathObject.base
  );

  return imageDB.frameList.where('frameId').equals(frameId).toArray().then((frames) => {
    log.debug(frames[0]);
    const reader = new FileReader();

    // This event is triggered each time the reading operation is successfully completed.
    reader.onload = () => {
      if (reader.readyState === 2) {
        const buffer = Buffer.from(reader.result);
        ipcRenderer.send('send-save-file', frameId, newFilePathAndName, buffer);
        log.debug(`Saving ${JSON.stringify({ newFilePathAndName, size: frames[0].data.size })}`);
      }
    };

    reader.readAsArrayBuffer(frames[0].data);
    return true;
  });
};

export default saveThumb;
