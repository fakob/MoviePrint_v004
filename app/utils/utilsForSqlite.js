import Database from 'better-sqlite3';
import log from 'electron-log';
import {
  getFrameScanTableName,
} from './utils';
import {
  FRAMESDB_PATH,
} from './constants';

// latest database version
const moviePrintDBVersion = 2;

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
  migrationFrom1To2();
} else if (moviePrintDBUserVersion === 1) {
  log.info(`Database migration necessary - users database version: ${moviePrintDBUserVersion} - latest database version: ${moviePrintDBVersion}`);
  // run migration script
  migrationFrom1To2();
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
// create framescan table
export const createTableFrameScanList = (fileId) => {
  const tableName = getFrameScanTableName(fileId);
  const stmt = moviePrintDB.prepare(`CREATE TABLE IF NOT EXISTS ${tableName}(fileId TEXT, frameNumber INTEGER, differenceValue REAL, meanColor TEXT, faceObject TEXT)`);
  stmt.run();
}

// delete framescan table
export const deleteTableFrameScanList = (fileId = undefined) => {

  // delete all tables
  if (fileId === undefined) {

    // get tableNames
    const stmtToGetTableNames = moviePrintDB.prepare('SELECT name FROM sqlite_master WHERE type = "table" ORDER BY name');
    const arrayOfTables = stmtToGetTableNames.all();

    // run through all tableNames
    for (const item of arrayOfTables) {
      const tableName = item.name;
      // only delete frameScan tables
      if (tableName.startsWith('frameScan_')) {
        // prepare delete table statement
        const stmtToDeleteTable = moviePrintDB.prepare(`DROP TABLE IF EXISTS ${tableName}`);
        stmtToDeleteTable.run();
      }
    }
  } else {

    // delete single table
    const tableName = getFrameScanTableName(fileId);
    const stmt = moviePrintDB.prepare(`DROP TABLE IF EXISTS ${tableName}`);
    stmt.run();
  }
}

// // insert frame
// export const insertFrameScan = moviePrintDB.transaction((item) => {
//   const insert = moviePrintDB.prepare('INSERT INTO frameScanList (fileId, frameNumber, differenceValue, meanColor) VALUES (@fileId, @frameNumber, @differenceValue, @meanColor)');
//   insert.run(item)
// });

// insert multiple frames from frame scan
export const insertFrameScanArray = moviePrintDB.transaction((fileId, array) => {
  const tableName = getFrameScanTableName(fileId);
  const stmtToCheckForTable = moviePrintDB.prepare(`SELECT count(name) FROM sqlite_master WHERE type = "table" AND name="${tableName}"`);
  const doesTableExist = Object.values(stmtToCheckForTable.get())[0]; // turn resulting object into value
  // create table if it does not exist
  if (doesTableExist === 0) {
    createTableFrameScanList(fileId);
  }
  const insert = moviePrintDB.prepare(`INSERT INTO ${tableName} (fileId, frameNumber, differenceValue, meanColor) VALUES (@fileId, @frameNumber, @differenceValue, @meanColor)`);
  for (const item of array) insert.run(item);
});

// insert multiple frames from face scan
export const insertFaceScanArray = moviePrintDB.transaction((fileId, array) => {
  const tableName = getFrameScanTableName(fileId);
  const stmtToCheckForTable = moviePrintDB.prepare(`SELECT count(name) FROM sqlite_master WHERE type = "table" AND name="${tableName}"`);
  const doesTableExist = Object.values(stmtToCheckForTable.get())[0]; // turn resulting object into value
  // create table if it does not exist
  if (doesTableExist === 0) {
    createTableFrameScanList(fileId);
  }
  const insert = moviePrintDB.prepare(`UPDATE ${tableName} SET faceObject = @faceObject WHERE frameNumber = @frameNumber`);
  for (const item of array) {
    const frameNumber = item.frameNumber;
    delete item.frameNumber;
    const faceObject = JSON.stringify(item);
    insert.run({
      faceObject,
      frameNumber
    });
  }
});

// get all frames by fileId
export const getFrameScanByFileId = (fileId) => {
  const tableName = getFrameScanTableName(fileId);
  const stmtToCheckForTable = moviePrintDB.prepare(`SELECT count(name) FROM sqlite_master WHERE type = "table" AND name="${tableName}"`);
  const doesTableExist = Object.values(stmtToCheckForTable.get())[0]; // turn resulting object into value
  if (doesTableExist === 1) {
    const stmt = moviePrintDB.prepare(`SELECT frameNumber, differenceValue, meanColor FROM ${tableName} ORDER BY frameNumber ASC`);
    return stmt.all();
  }
  return []; // if table does not exist, return empty array
}

// migration scripts
// from 0 to 1
function migrationFrom0To1 () {
  log.debug('migrationFrom0To1');
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

// from 1 to 2
function migrationFrom1To2 () {
  log.debug('migrationFrom1To2');
  const tableName = 'frameScanList';
  try {
    // check if table exists
    const stmtToCheckForTable = moviePrintDB.prepare(`SELECT count(name) FROM sqlite_master WHERE type = "table" AND name="${tableName}"`);
    const doesTableExist = Object.values(stmtToCheckForTable.get())[0]; // turn resulting object into value
    log.debug(`doesTableExist: ${doesTableExist}`);
    if (doesTableExist === 1) {
      // split frameScanList into separate tables
      // get distinct fileIds
      const stmtDistinctFileIds = moviePrintDB.prepare(`SELECT DISTINCT fileid FROM ${tableName}`);
      const arrayOfFileIdObjects = stmtDistinctFileIds.all();
      log.debug(arrayOfFileIdObjects);

      // loop through distinct fileIds
      for (const fileIdObject of arrayOfFileIdObjects) {
        const distinctFileId = fileIdObject.fileId;
        log.debug(`distinctFileId: ${distinctFileId}`);

        // create table for fileId
        const newTableName = `frameScan_${distinctFileId.replace(/-/g, '_')}`;
        log.debug(`newTableName: ${newTableName}`);
        const stmtToCreateTable = moviePrintDB.prepare(`CREATE TABLE IF NOT EXISTS ${newTableName}(fileId TEXT, frameNumber INTEGER, differenceValue REAL, meanColor TEXT, faceObject TEXT)`);
        stmtToCreateTable.run();

        // copy its values over
        const stmtToGetValues = moviePrintDB.prepare(`SELECT * FROM ${tableName} WHERE fileId = "${distinctFileId}" ORDER BY frameNumber ASC`);
        const arrayOfValuesForFileId = stmtToGetValues.all();
        const insert = moviePrintDB.prepare(`INSERT INTO ${newTableName} (fileId, frameNumber, differenceValue, meanColor) VALUES (@fileId, @frameNumber, @differenceValue, @meanColor)`);
        for (const item of arrayOfValuesForFileId) {
          insert.run(item);
        }
      }
      // delete table frameScanList
      const stmtToDeleteTable = moviePrintDB.prepare(`DROP TABLE IF EXISTS ${tableName}`);
      stmtToDeleteTable.run();
    }
    moviePrintDB.pragma('user_version = 2');
    log.info(`Database migration successful - users database version is now: ${moviePrintDB.pragma('user_version', { simple: true })}`);
  } catch (err) {
    log.error(err);
  }
}
