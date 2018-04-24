import Dexie from 'dexie';
import FileObject from './fileObject';

// Force debug mode to get async stacks from exceptions.
if (process.env.NODE_ENV === 'production') {
  Dexie.debug = false;
} else {
  Dexie.debug = true; // In production, set to false to increase performance a little.
}
const imageDB = new Dexie('ImageDatabase');
imageDB.version(1).stores({
  frameList: '&frameId, fileId, frameNumber, isPosterFrame, [fileId+frameNumber]'
});
imageDB.frameList.mapToClass(FileObject);

export default imageDB;
