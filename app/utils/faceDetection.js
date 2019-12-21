import path from 'path';
import * as faceapi from 'face-api.js';
import log from 'electron-log';

import { setPosition } from './utils';

const opencv = require('opencv4nodejs');
const { app } = require('electron').remote;

const appPath = app.getAppPath();
const weightsPath = path.join(appPath, './dist/weights');

// init detection options
const minConfidenceFace = 0.5;
const faceapiOptions = new faceapi.SsdMobilenetv1Options({ minConfidenceFace });

// configure face API
faceapi.env.monkeyPatch({
  Canvas: HTMLCanvasElement,
  Image: HTMLImageElement,
  ImageData,
  Video: HTMLVideoElement,
  createCanvasElement: () => document.createElement('canvas'),
  createImageElement: () => document.createElement('img')
});

const loadNet = async () => {
  console.log(weightsPath);
  console.log(faceapi.nets)
  const detectionNet = faceapi.nets.ssdMobilenetv1;
  console.log(detectionNet);
  await detectionNet.loadFromDisk(weightsPath);
  // await faceapi.loadFaceExpressionModel(weightsPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(weightsPath);
  await faceapi.nets.ageGenderNet.loadFromDisk(weightsPath);
  // await faceapi.nets.faceRecognitionNet.loadFromDisk(weightsPath);

  return detectionNet;
};

// let cam;
// let initCamera = async (width, height) => {
//   cam = document.getElementById('cam');
//   cam.width = width;
//   cam.height = height;
//   const stream = await navigator.mediaDevices.getUserMedia({
//     audio: false,
//     video: {
//       facingMode: "user",
//       width: width,
//       height: height
//     }
//   });
//   cam.srcObject = stream;
//   return new Promise((resolve) => {
//     cam.onloadedmetadata = () => {
//       resolve(cam);
//     };
//   });
// };

const detectionNet = loadNet()
  .then(() => {
    console.log(detectionNet);
    return undefined;
  }
);

export const detectFace2 = (image) => {
}

export const detectFace = async (image, frameNumber, detectionArray) => {
  // detect expression
  const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withAgeAndGender();
  const faceCount = detections.length;
  console.log(`Face count: ${faceCount}`);
  // see DrawBoxOptions below
  let largestSize = 0;
  detections.forEach(face => {
    const box = face.detection.box;
    const age = face.age;
    const relativeSize = Math.round(face.detection.relativeBox.height * 100);
    largestSize = relativeSize > largestSize ? relativeSize : largestSize;
    console.log(`Size: ${relativeSize}, Age: ${age}`);
    // const drawBox = new faceapi.draw.DrawBox(box, {
    //   label: Math.round(age),
    //   lineWidth: 1,
    //   boxColor: 'red'
    // })
    // drawBox.draw(image)
  })
  detectionArray.push({
    frameNumber,
    faceCount,
    largestSize,
  })
  return detections;
}

export const runSyncCaptureAndFaceDetect = async (vid, frameNumberArray, useRatio) => {

  const detectionArray = [];
  for (let i = 0; i < frameNumberArray.length; i += 1) {
    const frameNumber = frameNumberArray[i];
    setPosition(vid, frameNumber, useRatio);
    const frame = vid.read();
    if (frame.empty) {
      log.debug('opencvWorkerWindow | frame is empty');
    } else {
      const matRGBA = frame.channels === 1 ? frame.cvtColor(opencv.COLOR_GRAY2RGBA) : frame.cvtColor(opencv.COLOR_BGR2RGBA);
      const input = document.getElementById('myCanvas');
      // console.log(input)

      input.height = frame.rows;
      input.width = frame.cols;
      const imgData = new ImageData(
        new Uint8ClampedArray(matRGBA.getData()),
        frame.cols,
        frame.rows
      );
      const ctx = input.getContext('2d');
      ctx.putImageData(imgData, 0, 0);

      const detections = await detectFace(input, frameNumber, detectionArray);
      // console.log(detections)
      // detectFace(frame);
    }
  }
  console.log(detectionArray);
  return detectionArray;
}
