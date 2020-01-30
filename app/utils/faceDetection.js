import path from 'path';
import * as faceapi from 'face-api.js';
import log from 'electron-log';
// import * as tf from '@tensorflow/tfjs-node';

import { setPosition } from './utils';
import {
  FACE_SIZE_THRESHOLD,
  FACE_UNIQUENESS_THRESHOLD,
  FACE_DETECTION_CONFIDENCE_SCORE,
} from './constants';

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
  await faceapi.nets.faceRecognitionNet.loadFromDisk(weightsPath);

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

export const detectFace = async (image, frameNumber, detectionArray, uniqueFaceArray) => {
  // detect expression
  const face = await faceapi.detectSingleFace(image).withFaceLandmarks().withAgeAndGender().withFaceDescriptor();

  console.log(frameNumber);
  // check if a face was detected
  if (face !== undefined) {
    const { age, gender, descriptor, detection } = face;
    const { box, relativeBox, score } = detection;
    const size = Math.round(relativeBox.height * 100);
    const scoreInPercent = Math.round(score * 100);

    // // console.log(face);
    // if (size < FACE_SIZE_THRESHOLD || scoreInPercent < FACE_DETECTION_CONFIDENCE_SCORE) {
    //   console.log('detected face below size or confidence threshold!');
    //   return undefined;
    // }

    // create full copy of array to be pushed later
    const copyOfDescriptor = descriptor.slice();

    console.log(detection);
    console.log(uniqueFaceArray);
    console.log(copyOfDescriptor);

    // check for uniqueness
    // if the uniqueFaceArray is empty just push the current descriptor
    // else compare the current descriptor to the ones in the uniqueFaceArray

    // initialise the faceId
    let faceId = 0;
    const uniqueFaceArrayLength = uniqueFaceArray.length;
    if (uniqueFaceArrayLength === 0) {
      uniqueFaceArray.push(copyOfDescriptor);
    } else {
      // compare descriptor value with all values in the array
      for (let i = 0; i < uniqueFaceArrayLength; i += 1) {
        const dist = faceapi.euclideanDistance(copyOfDescriptor, uniqueFaceArray[i]);
        console.log(`${faceId}, ${frameNumber}`);
        console.log(dist);
        // if no match was found add the current descriptor to the array marking a unique face
        if (dist < FACE_UNIQUENESS_THRESHOLD) {
          // console.log(`face matches face ${i}`);
          faceId = i;
          break;
        } else if (i === uniqueFaceArrayLength - 1) {
          console.log('face is unique');
          uniqueFaceArray.push(copyOfDescriptor);
          faceId = uniqueFaceArrayLength;
        }
      }
    }

    // console.log(`frameNumber: ${frameNumber}, Score: ${score}, Size: ${size}, Gender: ${gender}, Age: ${age}`);
    // detectionArray.push({
    //   faceId,
    //   frameNumber,
    //   score: scoreInPercent,
    //   largestSize: size,
    //   gender,
    //   age: Math.round(age),
    // });
    const simpleBox = {
      x: relativeBox.x,
      y: relativeBox.y,
      width: relativeBox.width,
      height: relativeBox.height,
    }
    const facesArray = [{
      faceId,
      score: scoreInPercent,
      size,
      box: simpleBox,
      gender,
      age: Math.round(age),
    }];
    detectionArray.push({
      frameNumber,
      faceCount: 1,
      largestSize: facesArray[0].size,
      facesArray,
    });
    return detection;
  }
  console.log('no face detected!');
  return undefined;
}

export const detectAllFaces = async (image, frameNumber, detectionArray, uniqueFaceArray) => {
  // detect expression
  const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withAgeAndGender().withFaceDescriptors();
  console.log(frameNumber);

  const faceCount = detections.length;

  if (faceCount === 0) {
    console.log('no face detected!');
    return undefined;
  }
  console.log(`Face count: ${faceCount}`);

  console.log(detections);

  const facesArray = [];
  detections.forEach(face => {
    const { age, gender, descriptor, detection } = face;
    const { box, relativeBox, score } = detection;
    const size = Math.round(relativeBox.height * 100);
    const scoreInPercent = Math.round(score * 100);

    // create full copy of array to be pushed later
    const copyOfDescriptor = descriptor.slice();

    // console.log(detection);
    // console.log(uniqueFaceArray);
    // console.log(copyOfDescriptor);


    // // console.log(face);
    // if (size < FACE_SIZE_THRESHOLD || scoreInPercent < FACE_DETECTION_CONFIDENCE_SCORE) {
    //   console.log('detected face below size or confidence threshold!');
    //   return undefined;
    // }

    // check for uniqueness
    // if the uniqueFaceArray is empty just push the current descriptor
    // else compare the current descriptor to the ones in the uniqueFaceArray

    // initialise the faceId
    let faceId = 0;
    const uniqueFaceArrayLength = uniqueFaceArray.length;
    if (uniqueFaceArrayLength === 0) {
      uniqueFaceArray.push(copyOfDescriptor);
    } else {
      // compare descriptor value with all values in the array
      for (let i = 0; i < uniqueFaceArrayLength; i += 1) {
        const dist = faceapi.euclideanDistance(copyOfDescriptor, uniqueFaceArray[i]);
        // if no match was found add the current descriptor to the array marking a unique face
        if (dist < FACE_UNIQUENESS_THRESHOLD) {
          console.log(dist === 0 ? `this and face ${i} are identical: ${dist}` : `this and face ${i} are probably the same: ${dist}`);
          faceId = i;
          break;
        } else if (i === uniqueFaceArrayLength - 1) {
          console.log(`this face is unique: ${dist}`);
          uniqueFaceArray.push(copyOfDescriptor);
          faceId = uniqueFaceArrayLength;
        }
      }
    }


    const simpleBox = {
      x: relativeBox.x,
      y: relativeBox.y,
      width: relativeBox.width,
      height: relativeBox.height,
    }

    facesArray.push({
      faceId,
      score: scoreInPercent,
      size,
      box: simpleBox,
      gender,
      age: Math.round(age),
    })

    const drawBox = new faceapi.draw.DrawBox(box, {
      // label: Math.round(age),
      label: faceId,
      lineWidth: 1,
      boxColor: 'red'
    })
    drawBox.draw(image);
  })

  // sort faces by size with the largest one first
  facesArray.sort((face1,face2) => face2.size - face1.size);
  console.log(facesArray);

  detectionArray.push({
    frameNumber,
    faceCount,
    largestSize: facesArray[0].size,
    facesArray,
  });
  return detections;
}

export const runSyncCaptureAndFaceDetect = async (vid, frameNumberArray, useRatio, getAllFaces) => {

  const detectionArray = [];
  const uniqueFaceArray = [];
  for (let i = 0; i < frameNumberArray.length; i += 1) {
    const frameNumber = frameNumberArray[i];
    setPosition(vid, frameNumber, useRatio);
    const frame = vid.read();
    if (frame.empty) {
      log.debug('opencvWorkerWindow | frame is empty');
    } else {
      const matRGBA = frame.channels === 1 ? frame.cvtColor(opencv.COLOR_GRAY2RGBA) : frame.cvtColor(opencv.COLOR_BGR2RGBA);
      // optional rescale
      let matRescaled = matRGBA;
      if (true) { // false stands for keep original size
        matRescaled = matRGBA.resizeToMax(640);
      }
      // const input = tf.node.decodeJpeg(matRescaled.getData());

      const input = document.getElementById('myCanvas');
      // console.log(input)

      input.height = matRescaled.rows;
      input.width = matRescaled.cols;
      console.log(matRescaled.rows);
      console.log(matRescaled.cols);

      const imgData = new ImageData(
        new Uint8ClampedArray(matRescaled.getData()),
        matRescaled.cols,
        matRescaled.rows
      );
      const ctx = input.getContext('2d');
      ctx.putImageData(imgData, 0, 0);

      if (getAllFaces) {
        const detections = await detectAllFaces(input, frameNumber, detectionArray, uniqueFaceArray);
      } else {
        const detections = await detectFace(input, frameNumber, detectionArray, uniqueFaceArray);
      }

      // console.log(detections)
      // detectFace(frame);
    }
  }
  console.log(detectionArray);
  return detectionArray;
}
