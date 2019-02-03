import Database from 'better-sqlite3';
import {
  FRAMESDB_PATH,
} from './constants';

const moviePrintDB = new Database(FRAMESDB_PATH, { verbose: console.log });
moviePrintDB.pragma('journal_mode = WAL');

// create frames table
export const createTableFramelist = () => {
  const stmt = moviePrintDB.prepare('CREATE TABLE IF NOT EXISTS frameList(frameId TEXT, frameNumber INTEGER, fileId TEXT, isPosterFrame NUMERIC, data NONE)');
  stmt.run();
}

// create movies table
export const createTableMovielist = () => {
  const stmt = moviePrintDB.prepare('CREATE TABLE IF NOT EXISTS movielist(id TEXT, lastModified INTEGER, name TEXT, path TEXT, size INTEGER, type TEXT, posterFrameId TEXT)');
  stmt.run();
}

// insert frame
export const insertMovie = moviePrintDB.transaction((item) => {
  const insert = moviePrintDB.prepare('INSERT INTO movielist (id, lastModified, name, path, size, type, posterFrameId) VALUES (@id, @lastModified, @name, @path, @size, @type, @posterFrameId)');
  insert.run(item)
});

// get frame by fileId and frameNumber
export const getFrameByFrameId = (frameId) => {
  const stmt = moviePrintDB.prepare('SELECT * FROM frameList WHERE frameId = ?');
  return stmt.get(frameId);
}

// get frame by fileId and frameNumber
export const getFrameByFileIdAndFrameNumber = (fileId, frameNumber) => {
  const stmt = moviePrintDB.prepare('SELECT * FROM frameList WHERE fileId = ? AND frameNumber = ?');
  return stmt.get(fileId, frameNumber);
}

// get frames by fileId and frameNumberArray
export const getFramesByFrameNumberArray = (frameNumberArray) => {
  const params = '?,'.repeat(frameNumberArray.length).slice(0, -1);
  const stmt = moviePrintDB.prepare(`SELECT * FROM frameList WHERE frameNumber IN (${params})`);
  return stmt.all(frameNumberArray);
}

// get frames by isPosterFrame
export const getFramesByIsPosterFrame = (isPosterFrame) => {
  const stmt = moviePrintDB.prepare('SELECT * FROM frameList WHERE isPosterFrame = ?');
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
