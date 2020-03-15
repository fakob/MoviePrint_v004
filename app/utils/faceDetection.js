import path from 'path';
import * as faceapi from 'face-api.js';
import log from 'electron-log';
import uuidV4 from 'uuid/v4';

import { roundNumber } from './utils';
import { FACE_CONFIDENCE_THRESHOLD, FACE_SIZE_THRESHOLD, FACE_UNIQUENESS_THRESHOLD } from './constants';

const { ipcRenderer } = require('electron');
const { app } = require('electron').remote;

const appPath = app.getAppPath();
const weightsPath = path.join(appPath, './dist/weights');

const loadNet = async () => {
  const toastId = 'loadNet';
  ipcRenderer.send(
    'message-from-opencvWorkerWindow-to-mainWindow',
    'progressMessage',
    'info',
    'Initialising face detection',
    false,
    toastId,
  );
  log.debug(weightsPath);
  log.debug(faceapi.nets);
  const detectionNet = faceapi.nets.ssdMobilenetv1;
  log.debug(detectionNet);
  await detectionNet.loadFromDisk(weightsPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(weightsPath);
  await faceapi.nets.ageGenderNet.loadFromDisk(weightsPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(weightsPath);
  ipcRenderer.send(
    'message-from-opencvWorkerWindow-to-mainWindow',
    'progressMessage',
    'success',
    'Face detection successfully initialised',
    3000,
    toastId,
    true,
  );
  return detectionNet;
};

loadNet()
  .then(detectionNet => {
    log.debug(detectionNet);
    return undefined;
  })
  .catch(error => {
    log.error(`There has been a problem with your loadNet operation: ${error.message}`);
    ipcRenderer.send(
      'message-from-opencvWorkerWindow-to-mainWindow',
      'progressMessage',
      'error',
      `There has been a problem with your loadNet operation: ${error.message}`,
      false,
      'loadNet',
      true,
    );
  });

export const detectAllFaces = async (
  image,
  frameNumber,
  detectionArray,
  defaultFaceConfidenceThreshold = FACE_SIZE_THRESHOLD,
  defaultFaceSizeThreshold = FACE_CONFIDENCE_THRESHOLD,
) => {
  // detect expression
  const detections = await faceapi
    .detectAllFaces(image)
    .withFaceLandmarks()
    .withAgeAndGender()
    .withFaceDescriptors();
  console.log(frameNumber);

  const faceCount = detections.length;

  if (faceCount === 0) {
    console.log('no face detected!');
    detectionArray.push({
      frameNumber,
      faceCount,
    });
    return detections;
  }
  console.log(`Face count: ${faceCount}`);

  console.log(detections);

  const facesArray = [];
  detections.forEach(face => {
    const { age, gender, descriptor, detection } = face;
    const { relativeBox, score } = detection;
    const size = Math.round(relativeBox.height * 100);
    const scoreInPercent = Math.round(score * 100);

    // create full copy of array to be pushed later
    const copyOfDescriptor = descriptor.slice();

    // console.log(detection);
    // console.log(uniqueFaceArray);
    // console.log(copyOfDescriptor);

    // console.log(face);
    if (size < defaultFaceSizeThreshold || scoreInPercent < defaultFaceConfidenceThreshold) {
      console.log('detected face below size or confidence threshold!');
      return undefined;
    }

    const simpleBox = {
      x: roundNumber(relativeBox.x, 4),
      y: roundNumber(relativeBox.y, 4),
      width: roundNumber(relativeBox.width, 4),
      height: roundNumber(relativeBox.height, 4),
    };

    facesArray.push({
      score: scoreInPercent,
      size,
      box: simpleBox,
      gender,
      age: Math.round(age),
      faceId: uuidV4(),
      faceDescriptor: copyOfDescriptor,
    });

    // const drawBox = new faceapi.draw.DrawBox(box, {
    //   // label: Math.round(age),
    //   label: faceId,
    //   lineWidth: 1,
    //   boxColor: 'red'
    // })
    // drawBox.draw(image);
  });

  if (facesArray.length === 0) {
    // no faces stored as they are below thresholds
    detectionArray.push({
      frameNumber,
      faceCount,
    });
    return detections;
  }

  // sort faces by size with the largest one first
  facesArray.sort((face1, face2) => face2.size - face1.size);
  console.log(facesArray);

  detectionArray.push({
    frameNumber,
    faceCount,
    largestSize: facesArray[0].size,
    facesArray,
  });
  return detections;
};
