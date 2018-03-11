import html2canvas from 'html2canvas';
import path from 'path';
const fs = require('fs');

const { ipcRenderer } = require('electron');

export const mapRange = (value, low1, high1, low2, high2, returnInt = true) => {
  // * 1.0 added to force float division
  let newValue = low2 + ((high2 - low2) * (((value - low1) * 1.0) / (high1 - low1)));
  if (returnInt) {
    newValue = Math.round(newValue);
  }
  return Math.min(Math.max(newValue, low2), high2);
};

export const limitRange = (value, lowerLimit, upperLimit) =>
  // value || 0 makes sure that NaN s are turned into a number to work with
  Math.min(Math.max(value || 0, lowerLimit || 0), upperLimit || 0);

export const truncate = (n, len) => {
  const ext = n.substring(n.lastIndexOf('.') + 1, n.length).toLowerCase();
  let filename = n.substring(0, n.lastIndexOf('.'));
  if (filename.length <= len) {
    return n;
  }
  filename = filename.substr(0, len) + (n.length > len ? '...' : '');
  return `${filename}.${ext}`;
};

export const truncatePath = (n, len) => {
  const front = n.slice(0, len / 2);
  const back = n.slice(-len / 2);
  return `${front}...${back}`;
};


export const pad = (num, size) => {
  if (num !== undefined && size !== undefined) {
    let s = num.toString();
    while (s.length < size) s = `0${s}`;
    return s;
  }
  return undefined;
};

export const frameCountToTimeCode = (frames, fps = 25) => {
  // fps = (typeof fps !== 'undefined' ? fps : 30);
  const pad = (input) => ((input < 10) ? `0${input}` : input);
  const seconds = (typeof frames !== 'undefined' ? frames / fps : 0);

  return [
    pad(Math.floor(seconds / 3600)),
    pad(Math.floor((seconds % 3600) / 60)),
    pad(Math.floor(seconds % 60)),
    pad(Math.floor(frames % fps))
  ].join(':');
};

export const secondsToTimeCode = (seconds = 0) => {
  const pad = (input) => ((input < 10) ? `0${input}` : input);

  return [
    pad(Math.floor(seconds / 3600)),
    pad(Math.floor((seconds % 3600) / 60)),
    pad(Math.floor(seconds % 60)),
    pad(Math.floor((seconds - Math.floor(seconds)) * 1000), 3, '0')
  ].join(':');
};

export const formatBytes = (bytes, decimals) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals || 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

function saveBlob(blob, fileName) {
  const reader = new FileReader();
  reader.onload = () => {
    if (reader.readyState === 2) {
      const buffer = Buffer.from(reader.result);
      ipcRenderer.send('send-save-file', fileName, buffer);
      console.log(`Saving ${JSON.stringify({ fileName, size: blob.size })}`);
    }
  };
  reader.readAsArrayBuffer(blob);
}

function getMimeType(outputFormat) {
  switch (outputFormat) {
    case 'png':
      return 'image/png';
    case 'jpg':
      return 'image/jpeg';
    default:
      return 'image/png';
  }
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * ((max - min) + 1)) + min;
}

export const getMoviePrintColor = (index = undefined) => {
  // console.log(index);
  const colorArray = [
    '#FF5006',
    '#FFb709',
    '#FF9365',
    '#FFa883',
    '#FFd3c1',
  ];
  let newColor;
  if (index === undefined) {
    newColor = colorArray[getRndInteger(0, 5)];
  } else {
    newColor = colorArray[index % 5];
  }
  return newColor;
};

export const saveMoviePrint = (elementId, exportPath, file, outputFormat, overwrite) => {
  console.log(file);
  const node = document.getElementById(elementId);
  // const node = document.getElementById('ThumbGrid');

  let newFileName = `${file.name}_MoviePrint.${outputFormat}`;
  let newFilePathAndName = path.join(exportPath, newFileName);

  if (!overwrite) {
    if (fs.existsSync(newFilePathAndName)) {
      for (let i = 1; i < 1000; i += 1) {
        newFileName = `${file.name}_MoviePrint copy ${i}.${outputFormat}`;
        newFilePathAndName = path.join(exportPath, newFileName);
        if (!fs.existsSync(newFilePathAndName)) {
          break;
        }
      }
    }
  }

  const qualityArgument = 0.8; // only applicable for jpg

  console.log(newFilePathAndName);
  console.log(node);

  html2canvas(node, {
    backgroundColor: null,
    allowTaint: true,
    scale: 1,
  }).then((canvas) => {
    canvas.toBlob((blob) => {
      saveBlob(blob, newFilePathAndName);
    }, getMimeType(outputFormat), qualityArgument);
  });
};

export const getLowestFrame = (thumbs) => {
  return thumbs.reduce(
    (min, p) => (p.frameNumber < min ? p.frameNumber : min),
    thumbs[0].frameNumber
  );
};

export const getHighestFrame = (thumbs) => {
  return thumbs.reduce(
    (max, p) => (p.frameNumber > max ? p.frameNumber : max),
    thumbs[0].frameNumber
  );
};

export const getChangeThumbStep = (index) => {
  const changeThumbStep = [1, 10, 100];
  return changeThumbStep[index];
};

export const getVisibleThumbs = (thumbs, filter) => {
  if (thumbs === undefined) {
    return thumbs;
  }
  switch (filter) {
    case 'SHOW_ALL':
      return thumbs;
    case 'SHOW_HIDDEN':
      return thumbs.filter(t => t.hidden);
    case 'SHOW_VISIBLE':
      return thumbs.filter(t => !t.hidden);
    default:
      return thumbs;
  }
};

export const getAspectRatio = (file) => {
  if (typeof file === 'undefined' ||
    typeof file.width === 'undefined' ||
    typeof file.height === 'undefined') {
    return (16 * 1.0) / 9; // default 16:9
  }
  return ((file.width * 1.0) / file.height);
};

export const getColumnCount = (file, settings) => {
  if (typeof file === 'undefined' ||
  typeof file.columnCount === 'undefined') {
    return settings.defaultColumnCount;
  }
  return file.columnCount;
};

export const getVisibleThumbsCount = (file, thumbsByFileId, settings) => {
  if (typeof file === 'undefined' ||
  typeof file.id === 'undefined' ||
    typeof thumbsByFileId[file.id] === 'undefined') {
    return settings.defaultThumbCount;
  }
  return thumbsByFileId[file.id].thumbs
    .filter(thumb => thumb.hidden === false).length;
};
