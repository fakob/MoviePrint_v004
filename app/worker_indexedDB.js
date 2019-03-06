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
// const objectUrlQueue = Queue.bind(this);

// objectUrlQueue = objectUrlQueueUnbound.bind(this);
console.log(objectUrlQueue);
console.log(typeof objectUrlQueue);

setInterval(() => {
  const size = objectUrlQueue.size();
  const arrayOfObjectUrls = objectUrlQueue.data;
  console.log(`the queue size is: ${size}`);
  console.log(arrayOfObjectUrls);
  if (size !== 0) {
    ipcRenderer.send(
      'message-from-indexedDBWorkerWindow-to-mainWindow',
      'send-arrayOfObjectUrls',
      arrayOfObjectUrls
    );
    objectUrlQueue.clear();
  }
}, 1000);

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

ipcRenderer.on('send-base64-frame', (event, frameId, fileId, frameNumber, isPosterFrame, outBase64, onlyReplace = false) => {
  log.debug('indexedDBWorkerWindow | on send-base64-frame');
  if (onlyReplace) {
    const fastTrack = onlyReplace; // make this one use fastTrack so it gets updated right away
    updateFrameInIndexedDB(frameId, outBase64, objectUrlQueue, fastTrack);
  } else {
    addFrameToIndexedDB(frameId, fileId, frameNumber, isPosterFrame, outBase64, objectUrlQueue);
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

render(
  <div>
    <h1>I am the IndexedDB worker window.</h1>
  </div>,
  document.getElementById('worker_indexedDB')
);
