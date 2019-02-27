import Database from 'better-sqlite3';
import log from 'electron-log';
import {
  FRAMESDB_PATH,
} from './constants';

const moviePrintDB = new Database(FRAMESDB_PATH, { verbose: log.debug });
moviePrintDB.pragma('journal_mode = WAL');

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
  const stmt = moviePrintDB.prepare('CREATE TABLE IF NOT EXISTS frameScanList(fileId TEXT, frameNumber INTEGER, meanValue REAL, meanColor TEXT)');
  stmt.run();
}

// delete frames table
export const deleteTableFrameScanList = () => {
  const stmt = moviePrintDB.prepare('DROP TABLE IF EXISTS frameScanList');
  stmt.run();
}

// insert frame
export const insertFrameScan = moviePrintDB.transaction((item) => {
  const insert = moviePrintDB.prepare('INSERT INTO frameScanList (fileId, frameNumber, meanValue, meanColor) VALUES (@fileId, @frameNumber, @meanValue, @meanColor)');
  insert.run(item)
});

// insert multiple frames
export const insertFrameScanArray = moviePrintDB.transaction((array) => {
  const insert = moviePrintDB.prepare('INSERT INTO frameScanList (fileId, frameNumber, meanValue, meanColor) VALUES (@fileId, @frameNumber, @meanValue, @meanColor)');
  for (const item of array) insert.run(item);
});

// get all frames by fileId
export const getFrameScanByFileId = (fileId) => {
  const stmt = moviePrintDB.prepare(`SELECT frameNumber, meanValue, meanColor FROM frameScanList WHERE fileId = ? ORDER BY frameNumber ASC`);
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
