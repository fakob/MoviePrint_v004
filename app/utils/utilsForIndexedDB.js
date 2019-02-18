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

export const deleteTableFramelist = () =>
  imageDB.frameList.clear().catch((err) => {
    log.error(`Failed to delete all objects in frameList: ${  err.stack || err}`);
  })

export const addFrameToIndexedDB = (frameId, fileId, frameNumber, isPosterFrame, outBase64) => {
  const url = `data:image/jpg;base64,${outBase64}`;
  fetch(url)
  .then(res => res.blob())
  .then(blob =>
    imageDB.transaction('rw', imageDB.frameList, async ()=>{
      await imageDB.frameList.put({
        frameId,
        fileId,
        frameNumber,
        isPosterFrame: isPosterFrame ? 1 : 0, // 0 and 1 is used as dexie/indexDB can not use boolean values
        data: blob
      });
      const key = await imageDB.frameList.get(frameId);
      console.log(key);
      return key;
    })
  )
  .then(frame => {
    console.log(frame);
    const objectUrl = window.URL.createObjectURL(frame.data);
    ipcRenderer.send(
      'message-from-indexedDBWorkerWindow-to-mainWindow',
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

export const updateFrameInIndexedDB = (frameId, outBase64) => {
  if (outBase64 === '') {
    return undefined;
  }
  try {
    const url = `data:image/jpg;base64,${outBase64}`;
    fetch(url)
    .then(res => res.blob())
    .then(blob =>
      imageDB.transaction('rw', imageDB.frameList, async ()=>{
        await imageDB.frameList.where('frameId').equals(frameId).modify({
          data: blob
        });
        const key = await imageDB.frameList.get(frameId);
        console.log(key);
        return key;
      })
    )
    .then(frame => {
      console.log(frame);
      const objectUrl = window.URL.createObjectURL(frame.data);
      ipcRenderer.send(
        'message-from-indexedDBWorkerWindow-to-mainWindow',
        'update-objectUrl',
        frameId,
        objectUrl,
      );
      return objectUrl
    })
    .catch(e => {
      log.error(e.stack || e);
    });
  } catch (e) {
    log.error(e);
  }
}

export const getObjectUrlsFromFramelist = () => {
  imageDB.transaction('r', imageDB.frameList, async ()=>{
    const array = await imageDB.frameList.toArray();
    if (array.length === 0) {
      return [];
    }
    const arrayOfObjectUrls = [];
    array.map((frame) => {
      const objectUrl = window.URL.createObjectURL(frame.data);
      if (objectUrl !== undefined) {
        arrayOfObjectUrls.push({
          frameId: frame.frameId,
          objectUrl: window.URL.createObjectURL(frame.data),
        })
      }
      return undefined;
    });
    ipcRenderer.send(
      'message-from-indexedDBWorkerWindow-to-mainWindow',
      'send-arrayOfObjectUrls',
      arrayOfObjectUrls,
    );
    return undefined;
  })
}
