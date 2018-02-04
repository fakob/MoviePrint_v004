import domtoimage from 'dom-to-image';

export const mapRange = (value, low1, high1, low2, high2, returnInt = true) => {
  let newValue = low2 + ((high2 - low2) * ((value - low1) / (high1 - low1)));
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
  const pad = (input) => { return (input < 10) ? '0' + input : input; }
  const seconds = (typeof frames !== 'undefined' ? frames / fps : 0);
  return [
    pad(Math.floor(seconds / 3600)),
    pad(Math.floor(seconds % 3600 / 60)),
    pad(Math.floor(seconds % 60)),
    pad(Math.floor(frames % fps))
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
