import domtoimage from 'dom-to-image';

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

export const saveMoviePrint = (file) => {
  console.log(file);

  const node = document.getElementById('ThumbGrid');

  domtoimage.toJpeg(node, { style: { margin: 0 }, quality: 0.75 }) // because of compression largest filesize
  // domtoimage.toPng(node, {}) // because of dataUrl smallest possible filesize
  // domtoimage.toPng(node, {}) // because of objectUrl slightly larger filesize

  .then((dataUrl) => {
    const link = document.createElement('a');
    // link.download = 'my-image-name.jpg';
    const newFileName = file.name;
    link.download = `${newFileName}_MoviePrint.jpg`;
    link.href = dataUrl;
    link.click();
  })
  .catch((error) => {
    console.error('oops, something went wrong!', error);
  })
  .then(() => {
    console.log('done');
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
