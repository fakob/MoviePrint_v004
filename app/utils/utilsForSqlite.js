import Database from 'better-sqlite3';
import log from 'electron-log';
import {
  FRAMESDB_PATH,
} from './constants';

// latest database version
const moviePrintDBVersion = 1;

const moviePrintDB = new Database(FRAMESDB_PATH, { verbose: log.debug });
moviePrintDB.pragma('journal_mode = WAL');

// get users database version
const moviePrintDBUserVersion = moviePrintDB.pragma('user_version', { simple: true });
log.debug(`Users database version: ${moviePrintDBUserVersion}`);

// check if migration is necessary
if (moviePrintDBUserVersion === 0) {
  log.info(`Database migration necessary - users database version: ${moviePrintDBUserVersion} - latest database version: ${moviePrintDBVersion}`);
  // run migration script
  migrationFrom0To1();
}

// create redux store table
export const createTableReduxState = () => {
  const stmt = moviePrintDB.prepare('CREATE TABLE IF NOT EXISTS reduxstate(stateId TEXT PRIMARY KEY, timeStamp TEXT, state TEXT)');
  stmt.run();
}

// delete redux state table
export const deleteTableReduxState = () => {
  const stmt = moviePrintDB.prepare('DROP TABLE IF EXISTS reduxstate');
  stmt.run();
}

// update redux state
export const updateReduxState = moviePrintDB.transaction((item) => {
  const insert = moviePrintDB.prepare('REPLACE INTO reduxstate (stateId, timeStamp, state) VALUES (@stateId, @timeStamp, @state)');
  insert.run(item)
});

// get redux state
export const getReduxState = (stateId) => {
  const stmt = moviePrintDB.prepare(`SELECT stateId, timeStamp, state FROM reduxstate WHERE stateId = ?`);
  return stmt.get(stateId);
}

// movies table actions
// create movies table
export const createTableMovielist = () => {
  const stmt = moviePrintDB.prepare('CREATE TABLE IF NOT EXISTS movielist(id TEXT, lastModified INTEGER, name TEXT, path TEXT, size INTEGER, type TEXT, posterFrameId TEXT)');
  stmt.run();
}

// delete movies table
export const deleteTableMovielist = () => {
  const stmt = moviePrintDB.prepare('DROP TABLE IF EXISTS movielist');
  stmt.run();
}

// insert movie
export const insertMovie = moviePrintDB.transaction((item) => {
  const insert = moviePrintDB.prepare('INSERT INTO movielist (id, lastModified, name, path, size, type, posterFrameId) VALUES (@id, @lastModified, @name, @path, @size, @type, @posterFrameId)');
  insert.run(item)
});

// framescan table actions
// create frames table
export const createTableFrameScanList = () => {
  const stmt = moviePrintDB.prepare('CREATE TABLE IF NOT EXISTS frameScanList(fileId TEXT, frameNumber INTEGER, differenceValue REAL, meanColor TEXT)');
  stmt.run();
}

// delete frames table
export const deleteTableFrameScanList = () => {
  const stmt = moviePrintDB.prepare('DROP TABLE IF EXISTS frameScanList');
  stmt.run();
}

// insert frame
export const insertFrameScan = moviePrintDB.transaction((item) => {
  const insert = moviePrintDB.prepare('INSERT INTO frameScanList (fileId, frameNumber, differenceValue, meanColor) VALUES (@fileId, @frameNumber, @differenceValue, @meanColor)');
  insert.run(item)
});

// insert multiple frames
export const insertFrameScanArray = moviePrintDB.transaction((array) => {
  const insert = moviePrintDB.prepare('INSERT INTO frameScanList (fileId, frameNumber, differenceValue, meanColor) VALUES (@fileId, @frameNumber, @differenceValue, @meanColor)');
  for (const item of array) insert.run(item);
});

// get all frames by fileId
export const getFrameScanByFileId = (fileId) => {
  const stmt = moviePrintDB.prepare(`SELECT frameNumber, differenceValue, meanColor FROM frameScanList WHERE fileId = ? ORDER BY frameNumber ASC`);
  return stmt.all(fileId);
}

// delete rows with fileId from table
export const deleteFileIdFromFrameScanList = (fileId) => {
  const stmt = moviePrintDB.prepare('DELETE FROM frameScanList WHERE fileId = ?');
  return stmt.run(fileId);
}

// clear table
export const clearTableFrameScanList = () => {
  const stmt = moviePrintDB.prepare('DELETE FROM frameScanList');
  return stmt.run();
}

// migration scripts
// from 0 to 1
function migrationFrom0To1 () {
  const tableName = 'frameScanList';
  const oldColumnName = 'meanValue';
  const newColumnName = 'differenceValue';
  try {
    // check if old or new column already exists
    const tableInfo = moviePrintDB.pragma(`table_info = ${tableName}`);
    const oldColumnExists = tableInfo.findIndex(column => column.name === oldColumnName) > -1;
    const newColumnExists = tableInfo.findIndex(column => column.name === newColumnName) > -1;

    // migrate if it is still the old column name
    if (oldColumnExists) {
        moviePrintDB.exec(`ALTER TABLE "${tableName}" RENAME COLUMN "${oldColumnName}" TO "${newColumnName}"`);
        // set user_version to 1 after database has been migrated
        moviePrintDB.pragma('user_version = 1');
        log.info(`Database migration successful - users database version is now: ${moviePrintDB.pragma('user_version', { simple: true })}`);
    }
    // only update user_version if column name was already update, but user_version had not been updated
    if (newColumnExists) {
      // set user_version to 1 after database has been migrated
      moviePrintDB.pragma('user_version = 1');
      log.info(`Database was already migrated, but user_version had not been updated - users database version is now: ${moviePrintDB.pragma('user_version', { simple: true })}`);
    }
  } catch (err) {
    log.error(err);
  }
}
