import Dexie from 'dexie';
import FileObject from '../utils/fileObject';

// Force debug mode to get async stacks from exceptions.
Dexie.debug = true; // In production, set to false to increase performance a little.
const imageDB = new Dexie('ImageDatabase');
imageDB.version(1).stores({
  thumbList: '&id, fileId, isPosterFrame'
});
imageDB.thumbList.mapToClass(FileObject);

export default imageDB;
