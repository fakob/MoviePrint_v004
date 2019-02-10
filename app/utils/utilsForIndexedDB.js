import log from 'electron-log';
import imageDB from './db';

const { ipcRenderer } = require('electron');

export const openDBConnection = () => {
  // dexie documentation:
  // Even though open() is asynchronous,
  // you can already now start interact with the database.
  // The operations will be pending until open() completes.
  // If open() succeeds, the operations below will resume.
  // If open() fails, the below operations below will fail and
  if (!imageDB.isOpen()) {
    imageDB.open().catch((err) => {
      log.error(`Failed to open imageDB: ${  err.stack || err}`);
    });
  }
}

export const addFrameToIndexedDB = (frameId, fileId, frameNumber, isPosterFrame, outBase64) => {
  const url = `data:image/jpg;base64,${outBase64}`;
  fetch(url)
  .then(res => res.blob())
  .then(blob =>
    imageDB.frameList.put({
      frameId,
      fileId,
      frameNumber,
      isPosterFrame: isPosterFrame ? 1 : 0, // 0 and 1 is used as dexie/indexDB can not use boolean values
      data: blob
    })
  )
  .then(key => {
    console.log(key);
    return imageDB.frameList.get(key);
  })
  .then(frame => {
    console.log(frame);
    const objectUrl = window.URL.createObjectURL(frame.data);
    ipcRenderer.send(
      'message-from-opencvWorkerWindow-to-mainWindow',
      'update-objectUrl',
      frameId,
      objectUrl,
    );
    return objectUrl
  })
  .catch(e => {
    log.error(e.stack || e);
  });
}
