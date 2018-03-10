import Dexie from 'dexie';

const FileObject = Dexie.defineClass({
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

FileObject.prototype.getObjectUrl = function () {
  if (this.objectUrl !== '' && !this.disposed) {
    return this.objectUrl;
  } else if (!this.disposed) {
    this.objectUrl = window.URL.createObjectURL(this.data);
    return this.objectUrl;
  }
  console.log('File disposed!');
  throw 'File disposed!';
};

FileObject.prototype.revokeObjectURL = function () {
  URL.revokeObjectURL(this.objectUrl);
  this.objectUrl = '';
};

FileObject.prototype.disposed = false;

FileObject.prototype.disposeData = function () {
  URL.revokeObjectURL(this.objectUrl);
  this.objectUrl = '';
  this.data = null;
  this.disposed = true;
};

export default FileObject;
