import log from 'electron-log';
// import nj from 'numjs';
import VideoCaptureProperties from './videoCaptureProperties';
import imageDB from './db';
import {
  arrayToObject,
  setPosition,
} from './utils';
import {
  // updateFrameBase64,
} from './utilsForSqlite';

const opencv = require('opencv4nodejs');
const { ipcRenderer } = require('electron');

export const recaptureThumbs = (
  frameSize,
  filePath,
  useRatio,
  frameIdArray,
  frameNumberArray,
) => {
  const vid = new opencv.VideoCapture(filePath);

  for (let i = 0; i < frameNumberArray.length; i += 1) {
    setPosition(vid, frameNumberArray[i], useRatio);
    const mat = vid.read();
    const frameId = frameIdArray[i];
    if (mat.empty) {
      log.info('opencvWorkerWindow | frame is empty');
      ipcRenderer.send(
        'message-from-opencvWorkerWindow-to-indexedDBWorkerWindow',
        'update-base64-frame',
        frameId,
        ''
      );
    } else {
      let matRescaled;
      if (frameSize !== 0) { // 0 stands for keep original size
        matRescaled = mat.resizeToMax(frameSize);
      }
      const outBase64 = opencv.imencode('.jpg', matRescaled || mat).toString('base64'); // maybe change to .png?
      ipcRenderer.send(
        'message-from-opencvWorkerWindow-to-indexedDBWorkerWindow',
        'update-base64-frame',
        frameId,
        outBase64
      );
    }
  }
}

export const getBase64Object = (filePath, useRatio, arrayOfThumbs) => {
  const opencvVideo = new opencv.VideoCapture(filePath);

  const objectUrlObjects = {};
  arrayOfThumbs.map(thumb => {
    setPosition(opencvVideo, thumb.frameNumber, useRatio);
    const frame = opencvVideo.read();
    let base64 = '';
    if (!frame.empty) {
      base64 = opencv.imencode('.jpg', frame).toString('base64'); // maybe change to .png?
    }
    objectUrlObjects[thumb.frameId] = base64;
    return undefined;
  });
  return objectUrlObjects;
}

export const getDominantColor = (image, k=4) => {
  // takes an image as input
  // returns the dominant color of the image as a list
  //
  // dominant color is found by running k means on the
  // pixels & returning the centroid of the largest cluster
  //
  // processing time is sped up by working with a smaller image;
  // this resizing can be done with the imageProcessingSize param
  // which takes a tuple of image dims as input
  //
  // >>> get_dominant_color(my_image, k=4, imageProcessingSize = (25, 25))
  // [56.2423442, 34.0834233, 70.1234123]

  const matAsArray = image.getDataAsArray();
  const njArray = nj.array(matAsArray);
  const reshapedArray = njArray.reshape(matAsArray.rows * matAsArray.cols, 3);

  const { labels, centers } = opencv.kmeans(
      [
          new opencv.Vec3(255, 0, 0),
          new opencv.Vec3(255, 0, 0),
          new opencv.Vec3(255, 0, 255),
          new opencv.Vec3(255, 0, 255),
          new opencv.Vec3(255, 255, 255)
      ],
      2,
      new opencv.TermCriteria(opencv.termCriteria.EPS | opencv.termCriteria.MAX_ITER, 10, 0.1),
      5,
      opencv.KMEANS_RANDOM_CENTERS
  );

  // // count labels to find most popular
  // label_counts = Counter(labels)
  //
  // // subset out most popular centroid
  // dominant_color = clt.cluster_centers_[label_counts.most_common(1)[0][0]]
  //
  // return list(dominant_color)
}


export const HSVtoRGB = (h, s, v) => {
  console.log(`h: ${h}, s: ${s}, v: ${v}`);
  let r, g, b;
  const i = Math.floor((h / 180) * 6);
  const f = (h / 180) * 6 - i;
  const p = (v / 255) * (1 - (s / 255));
  const q = (v / 255) * (1 - f * (s / 255));
  const t = (v / 255) * (1 - (1 - f) * (s / 255));
  switch (i % 6) {
    case 0:
      r = (v / 255), g = t, b = p;
      break;
    case 1:
      r = q, g = (v / 255), b = p;
      break;
    case 2:
      r = p, g = (v / 255), b = t;
      break;
    case 3:
      r = p, g = q, b = (v / 255);
      break;
    case 4:
      r = t, g = p, b = (v / 255);
      break;
    case 5:
      r = (v / 255), g = p, b = q;
      break;
    default:
      break;
    }
    const rgbArray = [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ];
    console.log(rgbArray);
    return rgbArray;
}

// export const hsvToHsl = (h, s, v) => {
//
//
// // does not work!!!!!!
// // results are wrong
//
//
//     // both hsv and hsl values are in [0, 1]
//     const l = (2 - s) * v / 2;
//     let newS;
//     if (l !== 0) {
//         if (l === 1) {
//             newS = 0
//         } else if (l < 0.5) {
//             newS = s * v / (l * 2)
//         } else {
//             newS = s * v / (2 - l * 2)
//         }
//     }
//     return [h, newS, l]
// }
