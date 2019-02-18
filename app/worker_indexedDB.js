import React from 'react';
import { render } from 'react-dom';
import log from 'electron-log';
import {
  addFrameToIndexedDB,
  getObjectUrlsFromFramelist,
  openDBConnection,
  updateFrameInIndexedDB,
} from './utils/utilsForIndexedDB';

const unhandled = require('electron-unhandled');
// const assert = require('assert');

unhandled();
const { ipcRenderer } = require('electron');

log.debug('I am the indexedDBWorkerWindow - responsible for storing things in indexedDB');

// openDB if not already open
// to avoid errors as Chrome sometimes closes the connection after a while
openDBConnection();

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

ipcRenderer.on('send-base64-frame', (event, frameId, fileId, frameNumber, isPosterFrame, outBase64) => {
  log.debug('indexedDBWorkerWindow | on send-base64-frame');
  addFrameToIndexedDB(frameId, fileId, frameNumber, isPosterFrame, outBase64);
});

ipcRenderer.on('update-base64-frame', (event, frameId, outBase64) => {
  log.debug('indexedDBWorkerWindow | on update-base64-frame');
  updateFrameInIndexedDB(frameId, outBase64);
});

ipcRenderer.on('get-arrayOfObjectUrls', (event) => {
  log.debug('indexedDBWorkerWindow | on get-arrayOfObjectUrls');
  getObjectUrlsFromFramelist();
});

render(
  <div>
    <h1>I am the IndexedDB worker window.</h1>
  </div>,
  document.getElementById('worker_indexedDB')
);
