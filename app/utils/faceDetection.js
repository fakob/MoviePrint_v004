import path from 'path';
import * as faceapi from 'face-api.js';

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

export const detectFace = async (image) => {
  // detect expression
  const detections = await faceapi.detectAllFaces(image);
  console.log(detections);
}
