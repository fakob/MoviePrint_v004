import log from 'electron-log';
import VideoCaptureProperties from './videoCaptureProperties';
import imageDB from './db';
import {
  arrayToObject,
  setPosition,
} from './utils';
import {
  SHOT_DETECTION_METHOD,
} from './constants';
import {
  // updateFrameBase64,
} from './utilsForSqlite';

const opencv = require('opencv4nodejs');
const { ipcRenderer } = require('electron');

export const recaptureThumbs = (
  frameSize,
  fileId,
  filePath,
  useRatio,
  frameIdArray,
  frameNumberArray,
  onlyReplace,
  transformObject,
) => {
  try {
    const vid = new opencv.VideoCapture(filePath);

    // transform
    const width = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH);
    const height = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT);
    let cropTop = 0;
    let cropBottom = 0;
    let cropLeft = 0;
    let cropRight = 0;
    if (transformObject !== undefined && transformObject !== null) {
      console.log(transformObject)
      cropTop = transformObject.cropTop;
      cropBottom = transformObject.cropBottom;
      cropLeft = transformObject.cropLeft;
      cropRight = transformObject.cropRight;
    }
    const cropWidth = width - cropLeft - cropRight;
    const cropHeight = height - cropTop - cropBottom;

    for (let i = 0; i < frameNumberArray.length; i += 1) {
      const frameNumber = frameNumberArray[i];
      setPosition(vid, frameNumber, useRatio);
      const mat = vid.read();
      const frameId = frameIdArray[i];
      if (mat.empty) {
        log.info('opencvWorkerWindow | frame is empty');
        ipcRenderer.send(
          'message-from-opencvWorkerWindow-to-indexedDBWorkerWindow',
          'send-base64-frame',
          frameId,
          fileId,
          frameNumber,
          '',
          onlyReplace,
        );
      } else {

        // optional cropping
        let matCropped;
        if (transformObject !== undefined && transformObject !== null) {
          matCropped = mat.getRegion(new opencv.Rect(cropLeft, cropTop, cropWidth, cropHeight));
          // matCropped = mat.copy().copyMakeBorder(transformObject.cropTop, transformObject.cropBottom, transformObject.cropLeft, transformObject.cropRight);
        }

        // optional rescale
        let matRescaled;
        if (frameSize !== 0) { // 0 stands for keep original size
          matRescaled = matCropped === undefined ? mat.resizeToMax(frameSize) :  matCropped.resizeToMax(frameSize);
        }

        const outBase64 = opencv.imencode('.jpg', matRescaled || matCropped || mat).toString('base64'); // maybe change to .png?
        ipcRenderer.send(
          'message-from-opencvWorkerWindow-to-indexedDBWorkerWindow',
          'send-base64-frame',
          frameId,
          fileId,
          frameNumber,
          outBase64,
          onlyReplace,
        );
      }
    }
  } catch (e) {
    log.error(e);
  }
}

export const getBase64Object = (filePath, useRatio, arrayOfThumbs, frameSize = 0, transformObject = undefined) => {
  try {
    const vid = new opencv.VideoCapture(filePath);

    // transform
    const width = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH);
    const height = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT);
    let cropTop = 0;
    let cropBottom = 0;
    let cropLeft = 0;
    let cropRight = 0;
    if (transformObject !== undefined && transformObject !== null) {
      console.log(transformObject)
      cropTop = transformObject.cropTop;
      cropBottom = transformObject.cropBottom;
      cropLeft = transformObject.cropLeft;
      cropRight = transformObject.cropRight;
    }
    const cropWidth = width - cropLeft - cropRight;
    const cropHeight = height - cropTop - cropBottom;


    const objectUrlObjects = {};
    arrayOfThumbs.map(thumb => {
      setPosition(vid, thumb.frameNumber, useRatio);
      const mat = vid.read();
      let base64 = '';
      if (!mat.empty) {

        // optional cropping
        let matCropped;
        if (transformObject !== undefined && transformObject !== null) {
          matCropped = mat.getRegion(new opencv.Rect(cropLeft, cropTop, cropWidth, cropHeight));
          // matCropped = mat.copy().copyMakeBorder(transformObject.cropTop, transformObject.cropBottom, transformObject.cropLeft, transformObject.cropRight);
        }

        // optional rescale
        let matRescaled;
        if (frameSize !== 0) { // 0 stands for keep original size
          matRescaled = matCropped === undefined ? mat.resizeToMax(frameSize) :  matCropped.resizeToMax(frameSize);
        }

        base64 = opencv.imencode('.jpg', matRescaled || matCropped || mat).toString('base64'); // maybe change to .png?
      }
      objectUrlObjects[thumb.frameId] = base64;
      return undefined;
    });
    return objectUrlObjects;
  } catch (e) {
    log.error(e);
  }
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
  // console.log(`h: ${h}, s: ${s}, v: ${v}`);
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
    // console.log(rgbArray);
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

export const detectCut = (previousData, currentFrame, threshold, method) => {

  switch (method) {
    case SHOT_DETECTION_METHOD.MEAN: {

      // resize and convert to HSV
      const convertedFrame = currentFrame.resizeToMax(240).cvtColor(opencv.COLOR_BGR2HSV);
      const frameMean = convertedFrame.mean();
      const colorArray = HSVtoRGB(frameMean.w, frameMean.x, frameMean.y);

      const { lastValue = new opencv.Vec(null, null, null, null) } = previousData;
      const deltaFrameMean = frameMean.absdiff(lastValue);
      const differenceValue = deltaFrameMean.y;

      const isCut = differenceValue >= threshold;

      return {
        isCut,
        // lastValue: meanValue,
        differenceValue,
        lastColorRGB: colorArray,
        lastValue: frameMean,
      }
      // log.error('no previousData detected');
    }
    case SHOT_DETECTION_METHOD.HIST: {

      // resize and convert to HSV
      const resizedFrame = currentFrame.resizeToMax(240);
      const convertedFrame = resizedFrame.cvtColor(opencv.COLOR_BGR2HSV);
      const frameMean = resizedFrame.mean();
      const lastColorRGB = [frameMean.y, frameMean.x, frameMean.w];

      const { lastValue } = previousData;

      // all axes for 3D hist
      const getAllAxes = () => ([
        {
          channel: 0,
          bins: 32,
          ranges: [0, 256]
        },{
          channel: 1,
          bins: 32,
          ranges: [0, 256]
        },{
          channel: 2,
          bins: 32,
          ranges: [0, 256]
        }
      ]);

      // get combined histogram for all channels
      const vHist = opencv.calcHist(convertedFrame, getAllAxes()).convertTo(opencv.CV_32F);
      const vHistNormalized = vHist.normalize();

      // when lastValue is undefined (when run for the first time) compare to itself
      const differenceValue = vHistNormalized.compareHist(lastValue || vHistNormalized, opencv.HISTCMP_CHISQR_ALT);

      // const blue = new opencv.Vec(255, 0, 0);
      // const green = new opencv.Vec(0, 255, 0);
      // const red = new opencv.Vec(0, 0, 255);
      //
      // // plot channel histograms
      // const plot = new opencv.Mat(300, 600, opencv.CV_8UC3, [255, 255, 255]);
      // opencv.plot1DHist(vHist, plot, blue, opencv.LINE_8, 2);
      //
      // // opencv.imshow('rgb image', currentFrame);
      // opencv.imshow('hsv image', convertedFrame);
      // opencv.imshow('hsv histogram', plot);
      // opencv.waitKey();

      const isCut = differenceValue >= threshold;

      return {
        isCut,
        lastValue: vHistNormalized,
        differenceValue,
        lastColorRGB,
      }
      // log.error('no previousData detected');
    }
    default:
  }
}
