import React from 'react';
import { render } from 'react-dom';
import log from 'electron-log';
import {
  addFrameToIndexedDB,
  getObjectUrlsFromFramelist,
  openDBConnection,
  updateFrameInIndexedDB,
} from './utils/utilsForIndexedDB';
import Queue from './utils/queue';

const unhandled = require('electron-unhandled');
// const assert = require('assert');

unhandled();
const { ipcRenderer } = require('electron');

log.debug('I am the indexedDBWorkerWindow - responsible for storing things in indexedDB');

// openDB if not already open
// to avoid errors as Chrome sometimes closes the connection after a while
openDBConnection();

// set up a queue and check it in a regular interval
const objectUrlQueue = new Queue();

let requestIdleCallbackForImagesHandle;
let cancelIdleCallbackForImagesNextTime = false;

window.addEventListener('error', event => {
  log.error(event.error);
  event.preventDefault();
});

window.addEventListener('uncaughtException', event => {
  log.error(event.error);
  event.preventDefault();
});

window.addEventListener('unhandledrejection', event => {
  log.error(event.error);
  event.preventDefault();
});

// handle crashes and kill events
process.on('uncaughtException', err => {
  // log the message and stack trace
  log.error(err);
  // fs.writeFileSync('crash.log', err + "\n" + err.stack);
});

// handle crashes and kill events
process.on('SIGTERM', err => {
  // log the message and stack trace
  log.error(err);
  // fs.writeFileSync('shutdown.log', 'Received SIGTERM signal');
});

const pullImagesFromOpencvWorker = () => {
  console.log('now I am not busy - requestIdleCallbackForImages');
  log.debug('now I am not busy - requestIdleCallbackForImages');
  ipcRenderer.send(
    'message-from-indexedDBWorkerWindow-to-opencvWorkerWindow',
    'get-some-images-from-imageQueue',
    100, // amount
  );
  // cancel handle and set to undefined
  requestIdleCallbackForImagesHandle = window.cancelIdleCallback(requestIdleCallbackForImagesHandle);
};

setInterval(() => {
  // objectUrlQueue
  console.log(objectUrlQueue.size())
  const size = objectUrlQueue.size();
  if (size !== 0) {
    log.debug(`the objectUrlQueue size is: ${size}`);
    // start requestIdleCallback for imageQueue
    ipcRenderer.send(
      'message-from-opencvWorkerWindow-to-mainWindow',
      'start-requestIdleCallback-for-objectUrlQueue',
    );
  }
}, 1000);

ipcRenderer.on('send-base64-frame', (event, frameId, fileId, frameNumber, outBase64, onlyReplace = false) => {
  log.debug('indexedDBWorkerWindow | on send-base64-frame');
  if (onlyReplace) {
    const fastTrack = onlyReplace; // make this one use fastTrack so it gets updated right away
    updateFrameInIndexedDB(frameId, outBase64, objectUrlQueue, fastTrack);
  } else {
    addFrameToIndexedDB(frameId, fileId, frameNumber, outBase64, objectUrlQueue);
  }
});

ipcRenderer.on('update-base64-frame', (event, frameId, outBase64) => {
  log.debug('indexedDBWorkerWindow | on update-base64-frame');
  updateFrameInIndexedDB(frameId, outBase64, objectUrlQueue);
});

ipcRenderer.on('get-arrayOfObjectUrls', (event) => {
  log.debug('indexedDBWorkerWindow | on get-arrayOfObjectUrls');
  getObjectUrlsFromFramelist(objectUrlQueue);
});

ipcRenderer.on('get-some-objectUrls-from-objectUrlQueue', (event) => {
  log.debug('indexedDBWorkerWindow | on get-some-objectUrls-from-objectUrlQueue');

  const arrayOfObjectUrls = objectUrlQueue.data;
  log.debug(arrayOfObjectUrls);
  // start requestIdleCallback for objectUrlQueue
  ipcRenderer.send(
    'message-from-indexedDBWorkerWindow-to-mainWindow',
    'send-arrayOfObjectUrls',
    arrayOfObjectUrls
  );
  objectUrlQueue.clear();
});

ipcRenderer.on('start-requestIdleCallback-for-imageQueue', (event) => {
  log.debug('indexedDBWorkerWindow | on start-requestIdleCallback-for-imageQueue');

  // start requestIdleCallbackForImages until it is cancelled
  if (requestIdleCallbackForImagesHandle === undefined) {
    // on windows it seems that requestIdleCallback does not work properly when the window is hidden
    // setting this in main.dev.js had no effect: indexedDBWorkerWindow = new BrowserWindow({ webPreferences: { backgroundThrottling: false }});
    // therefore for windows we set a timeout to enforce handling the request
    if (process.platform === 'win32') {
      requestIdleCallbackForImagesHandle = window.requestIdleCallback(pullImagesFromOpencvWorker, { timeout: 1000});
    } else {
      requestIdleCallbackForImagesHandle = window.requestIdleCallback(pullImagesFromOpencvWorker);
    }
    log.debug('now I requestIdleCallbackForImages');
  } else {
    log.debug('requestIdleCallbackForImages already running. no new requestIdleCallbackForImages will be started.');
  }
});

ipcRenderer.on('cancel-requestIdleCallback-for-imageQueue', (event) => {
  log.debug('indexedDBWorkerWindow | on cancel-requestIdleCallback-for-imageQueue');

  // cancel pullImagesFromOpencvWorker next time
  cancelIdleCallbackForImagesNextTime = true;

});

ipcRenderer.on('receive-some-images-from-imageQueue', (event, someImages) => {
  log.debug(`indexedDBWorkerWindow | on receive-some-images-from-imageQueue: ${someImages.length}`);
  if (someImages.length > 0) {
    // add images in reveres as they are stored inverse in the queue
    someImages.reverse().map(async (image) => {
      // log.debug(image.frameNumber);
      return addFrameToIndexedDB(image.frameId, image.fileId, image.frameNumber,image.outBase64, objectUrlQueue)
    });
  }

  // cancelIdleCallbackForImagesNextTime if true else start requestIdleCallbackForImages again
  if (cancelIdleCallbackForImagesNextTime) {
    requestIdleCallbackForImagesHandle = window.cancelIdleCallback(requestIdleCallbackForImagesHandle);
    log.debug('now I cancelIdleCallbackForImages');
    cancelIdleCallbackForImagesNextTime = false;
  } else {
    // on windows it seems that requestIdleCallback does not work properly when the window is hidden
    // setting this in main.dev.js had no effect: indexedDBWorkerWindow = new BrowserWindow({ webPreferences: { backgroundThrottling: false }});
    // therefore for windows we set a timeout to enforce handling the request
    if (process.platform === 'win32') {
      requestIdleCallbackForImagesHandle = window.requestIdleCallback(pullImagesFromOpencvWorker, { timeout: 1000});
    } else {
      requestIdleCallbackForImagesHandle = window.requestIdleCallback(pullImagesFromOpencvWorker);
    }
    log.debug('now I requestIdleCallbackForImages');
  }
});

render(
  <div>
    <h1>I am the IndexedDB worker window.</h1>
  </div>,
  document.getElementById('worker_indexedDB')
);
