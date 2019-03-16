import Dexie from 'dexie';
import log from 'electron-log';
// import FileObject from './fileObject';

// Force debug mode to get async stacks from exceptions.
if (process.env.NODE_ENV === 'production') {
  Dexie.debug = false;
} else {
  Dexie.debug = true; // In production, set to false to increase performance a little.
}
const imageDB = new Dexie('ImageDatabase');
imageDB.version(1).stores({
  frameList: '&frameId, fileId, frameNumber, [fileId+frameNumber]',
  // fileScanList: '&fileId',
});

const FileObject = imageDB.frameList.defineClass({
  frameId: String,
  fileId: String,
  frameNumber: Number,
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

export default imageDB;
