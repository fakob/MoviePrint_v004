import pathR from 'path';
import fsR from 'fs';
import html2canvas from 'html2canvas';
import log from 'electron-log';
import extract from 'png-chunks-extract';
import encode from 'png-chunks-encode';
import text from 'png-chunk-text';
import { getFilePathObject, getMimeType } from './utils';
import saveThumb from './saveThumb';
import {
  DEFAULT_MOVIEPRINT_BACKGROUND_COLOR,
  DEFAULT_MOVIEPRINT_NAME,
  DEFAULT_ALLTHUMBS_NAME,
  DEFAULT_OUTPUT_JPG_QUALITY,
  DEFAULT_THUMB_FORMAT,
  DEFAULT_THUMB_JPG_QUALITY,
} from './constants';

const { ipcRenderer } = require('electron');
const { app } = require('electron').remote;

const saveBlob = (blob, sheetId, fileName, dataToEmbed = undefined) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (reader.readyState === 2) {
      const buffer = Buffer.from(reader.result);
      let chunkBuffer = buffer;

      // if there is data to embed, create chunks and add them in the end
      if (dataToEmbed !== undefined) {
        const { filePath, transformObject, columnCount, frameNumberArray, sceneArray } = dataToEmbed;
        // Create chunks
        const version = text.encode('version', app.getVersion());
        const filePathChunk = text.encode('filePath', encodeURIComponent(filePath));
        const transformObjectChunk = text.encode('transformObject', JSON.stringify(transformObject));
        const columnCountChunk = text.encode('columnCount', columnCount);
        const frameNumberArrayChunk = text.encode('frameNumberArray', JSON.stringify(frameNumberArray));
        const sceneArrayChunk = text.encode('sceneArray', JSON.stringify(sceneArray));

        const chunks = extract(buffer);

        // Add new chunks before the IEND chunk
        chunks.splice(-1, 0, version);
        chunks.splice(-1, 0, filePathChunk);
        chunks.splice(-1, 0, transformObjectChunk);
        chunks.splice(-1, 0, columnCountChunk);
        chunks.splice(-1, 0, frameNumberArrayChunk);
        chunks.splice(-1, 0, sceneArrayChunk);

        chunkBuffer = Buffer.from(encode(chunks));
      }

      fsR.writeFile(fileName, chunkBuffer, err => {
        if (err) {
          console.log(err);
          ipcRenderer.send('message-from-workerWindow-to-mainWindow', 'received-saved-file-error', err.message);
          // mainWindow.webContents.send('received-saved-file-error', err.message);
        } else {
          ipcRenderer.send('message-from-workerWindow-to-mainWindow', 'received-saved-file', sheetId, fileName);
          // mainWindow.webContents.send('received-saved-file', sheetId, fileName);
        }
        ipcRenderer.send('message-from-workerWindow-to-workerWindow', 'action-saved-MoviePrint-done');
        // window.webContents.send('action-saved-MoviePrint-done');
      });
      // ipcRenderer.send('send-save-file', sheetId, fileName, chunkBuffer, true);
      log.debug(`Saving ${JSON.stringify({ fileName, size: blob.size })}`);
    }
  };
  try {
    reader.readAsArrayBuffer(blob);
  } catch (e) {
    ipcRenderer.send('send-save-file-error', true);
  }
};

const saveMoviePrint = (
  elementId,
  exportPath,
  file,
  sheetId,
  sheetName,
  scale,
  outputFormat,
  overwrite,
  saveIndividualThumbs = false,
  thumbs,
  dataToEmbed,
  backgroundColor = DEFAULT_MOVIEPRINT_BACKGROUND_COLOR,
  moviePrintName = DEFAULT_MOVIEPRINT_NAME,
  allThumbsName = DEFAULT_ALLTHUMBS_NAME,
  defaultOutputJpgQuality = DEFAULT_OUTPUT_JPG_QUALITY,
  defaultThumbFormat = DEFAULT_THUMB_FORMAT,
  defaultThumbJpgQuality = DEFAULT_THUMB_JPG_QUALITY,
) => {
  log.debug(file);
  const node = document.getElementById(elementId);
  const fileName = file.name;
  const frameNumber = undefined;
  const newFilePathObject = getFilePathObject(
    fileName,
    sheetName,
    frameNumber,
    moviePrintName,
    outputFormat,
    exportPath,
    overwrite,
  );
  const newFilePathAndName = pathR.join(newFilePathObject.dir, newFilePathObject.base);

  const qualityArgument = defaultOutputJpgQuality / 100.0; // only applicable for jpg

  // log.debug(newFilePathAndName);
  // log.debug(node);

  // only embed data for PNGs
  const passOnDataToEmbed = outputFormat === 'png' ? dataToEmbed : undefined;
  const backgroundColorDependentOnFormat =
    outputFormat === 'png' // set alpha only for PNG
      ? `rgba(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, ${backgroundColor.a})`
      : `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b})`;

  html2canvas(node, {
    backgroundColor: backgroundColorDependentOnFormat,
    allowTaint: true,
    scale,
  })
    .then(canvas => {
      canvas.toBlob(
        blob => {
          saveBlob(blob, sheetId, newFilePathAndName, passOnDataToEmbed);
        },
        getMimeType(outputFormat),
        qualityArgument,
      );
    })
    .catch(err => {
      log.error(err);
    });

  const newFilePathAndNameWithoutExtension = pathR.join(newFilePathObject.dir, newFilePathObject.name);

  if (saveIndividualThumbs) {
    thumbs.map(thumb => {
      saveThumb(
        file.path,
        file.useRatio,
        fileName,
        sheetName,
        thumb.frameNumber,
        allThumbsName,
        thumb.frameId,
        file.transformObject,
        newFilePathAndNameWithoutExtension,
        overwrite,
        defaultThumbFormat,
        defaultThumbJpgQuality,
      );
    });
  }
};

export default saveMoviePrint;
