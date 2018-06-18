const { ipcRenderer } = require('electron');

document.addEventListener( 'wpcf7mailsent', ( event ) => {
// document.addEventListener( 'wpcf7submit', ( event ) => {
  ipcRenderer.sendToHost('wpcf7mailsent', event.detail.inputs);
}, false );
