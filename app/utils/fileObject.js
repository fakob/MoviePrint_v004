// import Dexie from 'dexie';
import log from 'electron-log';
import imageDB from './db';

const FileObject = imageDB.frameList.defineClass({
  frameId: String,
  lastModified: Number,
  lastModifiedDate: String,
  name: String,
  path: String,
  size: Number,
  frameNumber: Number,
  type: String,
  webkitRelativePath: String,
  base64: String,
  data: Blob
});

FileObject.prototype.objectUrl = '';

FileObject.prototype.getObjectUrl2 = () => {
  console.log(this);
  const objectUrl = window.URL.createObjectURL(this.data);
  return objectUrl;
};

FileObject.prototype.getObjectUrl = () => {
  if (this.objectUrl !== '' && !this.disposed) {
    return this.objectUrl;
  }
  if (!this.disposed) {
    this.objectUrl = window.URL.createObjectURL(this.data);
    return this.objectUrl;
  }
  log.warn('File disposed!');
  throw 'File disposed!';
};

FileObject.prototype.revokeObjectURL = () => {
  URL.revokeObjectURL(this.objectUrl);
  this.objectUrl = '';
};

FileObject.prototype.disposed = false;

FileObject.prototype.disposeData = () => {
  URL.revokeObjectURL(this.objectUrl);
  this.objectUrl = '';
  this.data = null;
  this.disposed = true;
};

export default FileObject;
