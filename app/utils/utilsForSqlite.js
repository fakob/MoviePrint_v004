import Database from 'better-sqlite3';
import {
  FRAMESDB_PATH,
} from './constants';

const moviePrintDB = new Database(FRAMESDB_PATH, { verbose: console.log });
moviePrintDB.pragma('journal_mode = WAL');

// create movies table
export const createTableMovielist = () => {
  const stmt = moviePrintDB.prepare('CREATE TABLE IF NOT EXISTS movielist(id TEXT, lastModified INTEGER, name TEXT, path TEXT, size INTEGER, type TEXT, posterFrameId TEXT)');
  stmt.run();
}

// insert movie
export const insertMovie = moviePrintDB.transaction((item) => {
  const insert = moviePrintDB.prepare('INSERT INTO movielist (id, lastModified, name, path, size, type, posterFrameId) VALUES (@id, @lastModified, @name, @path, @size, @type, @posterFrameId)');
  insert.run(item)
});

// create frames table
export const createTableFramelist = () => {
  const stmt = moviePrintDB.prepare('CREATE TABLE IF NOT EXISTS frameList(frameId TEXT, frameNumber INTEGER, fileId TEXT, isPosterFrame NUMERIC, base64_640 NONE)');
  stmt.run();
}

// insert frame
export const insertFrame = moviePrintDB.transaction((item) => {
  const insert = moviePrintDB.prepare('INSERT INTO frameList (frameId, frameNumber, fileId, isPosterFrame, base64_640) VALUES (@frameId, @frameNumber, @fileId, @isPosterFrame, @base64_640)');
  insert.run(item)
});

// get all frames
export const getAllFrames = (dataSource = 'base64_640') => {
  const stmt = moviePrintDB.prepare(`SELECT frameId, fileId, ${dataSource} AS base64 FROM frameList`);
  return stmt.all();
}

// get frame by fileId and frameNumber
export const getFrameByFrameId = (frameId, dataSource = 'base64_640') => {
  const stmt = moviePrintDB.prepare(`SELECT frameId, fileId, ${dataSource} AS base64 FROM frameList WHERE frameId = ?`);
  return stmt.get(frameId);
}

// get frame by fileId and frameNumber
export const getFrameByFileIdAndFrameNumber = (fileId, frameNumber, dataSource = 'base64_640') => {
  const stmt = moviePrintDB.prepare(`SELECT frameId, fileId, ${dataSource} AS base64 FROM frameList WHERE fileId = ? AND frameNumber = ?`);
  return stmt.get(fileId, frameNumber);
}

// get frames by fileId and frameNumberArray
export const getFramesByFileIdAndFrameNumberArray = (fileId, frameNumberArray, dataSource = 'base64_640') => {
  const params = '?,'.repeat(frameNumberArray.length).slice(0, -1);
  const stmt = moviePrintDB.prepare(`SELECT frameId, fileId, ${dataSource} AS base64 FROM frameList WHERE fileId = ? AND frameNumber IN (${params})`);
  return stmt.all(fileId, frameNumberArray);
}

// get frames by frameIdArray
export const getFramesByFrameIdArray = (frameIdArray, dataSource = 'base64_640') => {
  const params = '?,'.repeat(frameIdArray.length).slice(0, -1);
  const stmt = moviePrintDB.prepare(`SELECT frameId, fileId, ${dataSource} AS base64 FROM frameList WHERE frameId IN (${params})`);
  return stmt.all(frameIdArray);
}

// get frames by isPosterFrame
export const getFramesByIsPosterFrame = (isPosterFrame, dataSource = 'base64_640') => {
  const stmt = moviePrintDB.prepare(`SELECT frameId, fileId, ${dataSource} AS base64 FROM frameList WHERE isPosterFrame = ?`);
  return stmt.all(isPosterFrame);
}

// clear table by fileId
export const clearTableByFileId = (fileId) => {
  const stmt = moviePrintDB.prepare('DELETE FROM frameList WHERE fileId = ?');
  return stmt.run(fileId);
}

// clear table by fileId
export const clearTable = () => {
  const stmt = moviePrintDB.prepare('DELETE FROM frameList');
  return stmt.run();
}
