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

let setIntervalForImagesHandle;

window.addEventListener('error', event => {
  log.error(event);
  ipcRenderer.send(
    'message-from-opencvWorkerWindow-to-mainWindow',
    'progressMessage',
    'error',
    `There has been an error while loading the IndexedDB Worker. Please contact us for support: ${event.message}`,
    false,
  );
  event.preventDefault();
});

window.addEventListener('uncaughtException', event => {
  log.error(event);
  ipcRenderer.send(
    'message-from-opencvWorkerWindow-to-mainWindow',
    'progressMessage',
    'error',
    `There has been an uncaughtException while loading the IndexedDB Worker. Please contact us for support: ${event.message}`,
    false,
  );
  event.preventDefault();
});

window.addEventListener('unhandledrejection', event => {
  log.error(event);
  ipcRenderer.send(
    'message-from-opencvWorkerWindow-to-mainWindow',
    'progressMessage',
    'error',
    `There has been an unhandledrejection while loading the IndexedDB Worker. Please contact us for support: ${event.message}`,
    false,
  );
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
  log.debug('now I am running pullImagesFromOpencvWorker');
  ipcRenderer.send(
    'message-from-indexedDBWorkerWindow-to-opencvWorkerWindow',
    'get-some-images-from-imageQueue',
    1000, // amount
  );
};

setInterval(() => {
  // objectUrlQueue
  // console.log(objectUrlQueue.size())
  const size = objectUrlQueue.size();
  if (size !== 0) {
    log.debug(`the objectUrlQueue size is: ${size}`);
    // start requestIdleCallback in mainWindow for objectUrlQueue
    ipcRenderer.send('message-from-opencvWorkerWindow-to-mainWindow', 'start-requestIdleCallback-for-objectUrlQueue');
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

ipcRenderer.on('get-arrayOfObjectUrls', () => {
  log.debug('indexedDBWorkerWindow | on get-arrayOfObjectUrls');
  getObjectUrlsFromFramelist(objectUrlQueue);
});

ipcRenderer.on('get-some-objectUrls-from-objectUrlQueue', () => {
  log.debug('indexedDBWorkerWindow | on get-some-objectUrls-from-objectUrlQueue');

  const arrayOfObjectUrls = objectUrlQueue.data;
  log.debug(arrayOfObjectUrls);
  // start requestIdleCallback in mainWindow for objectUrlQueue
  ipcRenderer.send('message-from-indexedDBWorkerWindow-to-mainWindow', 'send-arrayOfObjectUrls', arrayOfObjectUrls);
  objectUrlQueue.clear();
});

ipcRenderer.on('start-setIntervalForImages-for-imageQueue', () => {
  log.debug('indexedDBWorkerWindow | on start-setIntervalForImages-for-imageQueue');

  // start setIntervalForImages until it is cancelled
  if (setIntervalForImagesHandle === undefined) {
    // start interval to pull images from the opencvWorkerWindow
    setIntervalForImagesHandle = window.setInterval(() => {
      pullImagesFromOpencvWorker();
    }, 1000);
    log.debug('now I start setIntervalForImages');
  } else {
    log.debug('setIntervalForImages already running. no new setIntervalForImages will be started.');
  }
});

ipcRenderer.on('receive-some-images-from-imageQueue', (event, someImages) => {
  log.debug(`indexedDBWorkerWindow | on receive-some-images-from-imageQueue: ${someImages.length}`);
  if (someImages.length > 0) {
    // add images in reveres as they are stored inverse in the queue
    someImages.reverse().map(async image => {
      // log.debug(image.frameNumber);
      return addFrameToIndexedDB(image.frameId, image.fileId, image.frameNumber, image.outBase64, objectUrlQueue);
    });
  }
  log.debug('now I cancel setIntervalForImages');
  setIntervalForImagesHandle = window.clearInterval(setIntervalForImagesHandle);
});

render(
  <div>
    <h1>I am the IndexedDB worker window.</h1>
  </div>,
  document.getElementById('worker_indexedDB'),
);
