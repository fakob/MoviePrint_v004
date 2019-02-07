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

// create frames table
export const createTableFramelist = () => {
  const stmt = moviePrintDB.prepare('CREATE TABLE IF NOT EXISTS frameList(frameId TEXT, frameNumber INTEGER, fileId TEXT, isPosterFrame NUMERIC, base64_640 NONE)');
  stmt.run();
}

// delete frames table
export const deleteTableFramelist = () => {
  const stmt = moviePrintDB.prepare('DROP TABLE IF EXISTS framelist');
  stmt.run();
}

// insert frame
export const insertFrame = moviePrintDB.transaction((item) => {
  const insert = moviePrintDB.prepare('INSERT INTO frameList (frameId, frameNumber, fileId, isPosterFrame, base64_640) VALUES (@frameId, @frameNumber, @fileId, @isPosterFrame, @base64_640)');
  insert.run(item)
});

// insert frame
export const updateFrameBase64 = moviePrintDB.transaction((frameId, data, dataSource = 'base64_640') => {
  const insert = moviePrintDB.prepare(`UPDATE frameList SET ${dataSource} = ? WHERE frameId = ?`);
  insert.run(data, frameId)
});

// get all frames
export const getAllFrames = (dataSource = 'base64_640') => {
  const stmt = moviePrintDB.prepare(`SELECT frameId, fileId, frameNumber, ${dataSource} AS base64 FROM frameList`);
  return stmt.all();
}

// get all frames but without base64 data
export const getAllFramesNoBase64 = (fileId = undefined) => {
  let stmt;
  if (fileId === undefined) {
    stmt = moviePrintDB.prepare(`SELECT frameId, fileId, frameNumber FROM frameList ORDER BY fileId, frameNumber ASC`);
    return stmt.all();
  }
  stmt = moviePrintDB.prepare(`SELECT frameId, fileId, frameNumber FROM frameList WHERE fileId = ? ORDER BY fileId, frameNumber ASC`);
  return stmt.all(fileId);
}

// get all frames by fileId
export const getAllFramesByFileId = (fileId, dataSource = 'base64_640') => {
  const stmt = moviePrintDB.prepare(`SELECT frameId, fileId, frameNumber, ${dataSource} AS base64 FROM frameList WHERE fileId = ?`);
  return stmt.all(fileId);
}

// get frame by fileId and frameNumber
export const getFrameByFrameId = (frameId, dataSource = 'base64_640') => {
  const stmt = moviePrintDB.prepare(`SELECT frameId, fileId, frameNumber, ${dataSource} AS base64 FROM frameList WHERE frameId = ?`);
  return stmt.get(frameId);
}

// get frame by fileId and frameNumber
export const getFrameByFileIdAndFrameNumber = (fileId, frameNumber, dataSource = 'base64_640') => {
  const stmt = moviePrintDB.prepare(`SELECT frameId, fileId, frameNumber, ${dataSource} AS base64 FROM frameList WHERE fileId = ? AND frameNumber = ?`);
  return stmt.get(fileId, frameNumber);
}

// get frames by fileId and frameNumberArray
export const getFramesByFileIdAndFrameNumberArray = (fileId, frameNumberArray, dataSource = 'base64_640') => {
  const params = '?,'.repeat(frameNumberArray.length).slice(0, -1);
  const stmt = moviePrintDB.prepare(`SELECT frameId, fileId, frameNumber, ${dataSource} AS base64 FROM frameList WHERE fileId = ? AND frameNumber IN (${params})`);
  return stmt.all(fileId, frameNumberArray);
}

// get frames by frameIdArray
export const getFramesByFrameIdArray = (frameIdArray, dataSource = 'base64_640') => {
  const params = '?,'.repeat(frameIdArray.length).slice(0, -1);
  const stmt = moviePrintDB.prepare(`SELECT frameId, fileId, frameNumber, ${dataSource} AS base64 FROM frameList WHERE frameId IN (${params})`);
  return stmt.all(frameIdArray);
}

// get frames by isPosterFrame
export const getFramesByIsPosterFrame = (isPosterFrame, dataSource = 'base64_640') => {
  const stmt = moviePrintDB.prepare(`SELECT frameId, fileId, frameNumber, ${dataSource} AS base64 FROM frameList WHERE isPosterFrame = ?`);
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
