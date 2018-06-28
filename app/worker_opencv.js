import React from 'react';
import { render } from 'react-dom';
import VideoCaptureProperties from './utils/videoCaptureProperties';
import { limitRange, setPosition } from './utils/utils';
import {
  IN_OUT_POINT_SEARCH_LENGTH,
  IN_OUT_POINT_SEARCH_THRESHOLD,
} from './utils/constants';

process.env.OPENCV4NODEJS_DISABLE_EXTERNAL_MEM_TRACKING = 1;

const opencv = require('opencv4nodejs');
const unhandled = require('electron-unhandled');

unhandled();
const searchLimit = 25; // how long to go forward or backward to find a none-empty frame
const { ipcRenderer } = require('electron');

console.log('I am the opencvWorkerWindow');

window.addEventListener('error', event => {
  console.error(event.error);
  event.preventDefault();
});

window.addEventListener('uncaughtException', event => {
  console.error(event.error);
  event.preventDefault();
});

window.addEventListener('unhandledrejection', event => {
  console.error(event.error);
  event.preventDefault();
});

// handle crashes and kill events
process.on('uncaughtException', err => {
  // log the message and stack trace
  console.error(err);
  // fs.writeFileSync('crash.log', err + "\n" + err.stack);
});

// handle crashes and kill events
process.on('SIGTERM', err => {
  // log the message and stack trace
  console.error(err);
  // fs.writeFileSync('shutdown.log', 'Received SIGTERM signal');
});

// ipcRenderer.on('message-from-mainWindow-to-opencvWorkerWindow', (event, ...args) => {
//   console.log(...args);
// });

ipcRenderer.on(
  'send-get-file-details',
  (event, fileId, filePath, posterFrameId) => {
    console.log(fileId);
    console.log(filePath);
    try {
      const vid = new opencv.VideoCapture(filePath);
      console.log(
        `width: ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH)}`
      );
      console.log(
        `height: ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT)}`
      );
      console.log(`FPS: ${vid.get(VideoCaptureProperties.CAP_PROP_FPS)}`);
      console.log(`codec: ${vid.get(VideoCaptureProperties.CAP_PROP_FOURCC)}`);
      ipcRenderer.send(
        'message-from-opencvWorkerWindow-to-mainWindow',
        'receive-get-file-details',
        fileId,
        filePath,
        posterFrameId,
        vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT),
        vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH),
        vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT),
        vid.get(VideoCaptureProperties.CAP_PROP_FPS),
        vid.get(VideoCaptureProperties.CAP_PROP_FOURCC)
      );
    } catch (e) {
      ipcRenderer.send(
        'message-from-opencvWorkerWindow-to-mainWindow',
        'failed-to-open-file',
        fileId
      );
      ipcRenderer.send(
        'message-from-opencvWorkerWindow-to-mainWindow',
        'progressMessage',
        fileId,
        'error',
        `Failed to open ${filePath}`,
        3000
      );
      console.log(e);
    }
  }
);

ipcRenderer.on(
  'send-get-poster-frame',
  (event, fileId, filePath, posterFrameId) => {
    console.log('send-get-poster-frame');
    console.log(fileId);
    console.log(filePath);
    const vid = new opencv.VideoCapture(filePath);

    const frameNumberToCapture = Math.floor(
      vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) / 2
    ); // capture frame in the middle
    vid.readAsync(err1 => {
      const read = function read() {
        setPosition(vid, frameNumberToCapture, false);
        vid.readAsync((err, mat) => {
          console.log(
            `${frameNumberToCapture}/${vid.get(
              VideoCaptureProperties.CAP_PROP_POS_FRAMES
            ) - 1}(${vid.get(
              VideoCaptureProperties.CAP_PROP_POS_MSEC
            )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`
          );

          let useRatio = false;
          // frames not match
          if (
            frameNumberToCapture !==
            vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1
          ) {
            console.log(
              '########################### Playhead not at correct position: set useRatio to TRUE ###########################'
            );
            useRatio = true;
          }

          if (mat.empty === false) {
            const outBase64 = opencv.imencode('.jpg', mat).toString('base64'); // maybe change to .png?
            ipcRenderer.send(
              'message-from-opencvWorkerWindow-to-mainWindow',
              'receive-get-poster-frame',
              fileId,
              filePath,
              posterFrameId,
              outBase64,
              vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES),
              useRatio
            );
          }
          // iterator += 1;
          // if (iterator < frameNumberArray.length) {
          //   read();
          // }
        });
      };

      if (err1) throw err1;
      // let iterator = 0;
      setPosition(vid, frameNumberToCapture, false);
      read();
    });
  }
);

ipcRenderer.on(
  'send-get-in-and-outpoint',
  (event, fileId, filePath, useRatio, detectInOutPoint) => {
    console.log('send-get-in-and-outpoint');
    console.log(fileId);
    console.log(filePath);
    console.time(`${fileId}-inPointDetection`);
    const vid = new opencv.VideoCapture(filePath);
    const videoLength =
      vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1;
    console.log(videoLength);

    if (detectInOutPoint) {
      console.time(`${fileId}-inOutPointDetection`);
      const timeBeforeInOutPointDetection = Date.now();

      ipcRenderer.send(
        'message-from-opencvWorkerWindow-to-mainWindow',
        'progressMessage',
        fileId,
        'info',
        'Detecting in and outpoint'
      );

      const searchLength = Math.min(
        IN_OUT_POINT_SEARCH_LENGTH,
        videoLength / 2
      );
      const threshold = IN_OUT_POINT_SEARCH_THRESHOLD;

      let searchInpoint = true;
      const meanArrayIn = [];
      const meanArrayOut = [];
      let fadeInPoint;
      let fadeOutPoint;

      vid.readAsync(err1 => {
        const read = () => {
          vid.readAsync((err, mat) => {
            const frame = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES);
            console.log(
              `readAsync: frame:${frame} (${vid.get(
                VideoCaptureProperties.CAP_PROP_POS_MSEC
              )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`
            );
            let frameMean = 0;
            if (mat.empty === false) {
              // console.time('meanCalculation');
              // scale to quarter of size, convert to HSV, calculate mean, get only V channel
              frameMean = mat
                .rescale(0.25)
                .cvtColor(opencv.COLOR_BGR2HSV)
                .mean().y;
              // console.timeEnd('meanCalculation');

              // // single axis for 1D hist
              // const binCount = 17;
              // const getHistAxis = channel => ([
              //   {
              //     channel,
              //     bins: binCount,
              //     ranges: [0, 256]
              //   }
              // ]);
              // const matHSV = mat.cvtColor(opencv.COLOR_BGR2HSV);
              // const frameHist = opencv.calcHist(matHSV, getHistAxis(2));
              // console.log(frameHist.at(0));
              // console.log(frameHist.at(0) > (binCount * 256));

              if (searchInpoint) {
                meanArrayIn.push({
                  frame:
                    vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1,
                  mean: frameMean
                });
              } else {
                meanArrayOut.push({
                  frame:
                    vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1,
                  mean: frameMean
                });
              }

              if (
                (searchInpoint && frameMean >= threshold) ||
                (frame >= searchLength && frame < videoLength - searchLength)
              ) {
                // only run if still searching inpoint and frameMean over threshold or done scanning inpoint
                searchInpoint = false; // done searching inPoint
                console.log('resetting playhead');
                setPosition(vid, videoLength - searchLength, useRatio);
                read();
              } else if (
                frame < searchLength ||
                (frame >= videoLength - searchLength && frame <= videoLength)
              ) {
                // half the amount of ipc events
                if (iterator % 2) {
                  const progressBarPercentage =
                    iterator / (searchLength * 2) * 100;
                  ipcRenderer.send(
                    'message-from-opencvWorkerWindow-to-mainWindow',
                    'progress',
                    fileId,
                    progressBarPercentage
                  ); // first half of progress
                }
                iterator += 1;
                read();
              }
            } else {
              console.error(
                `empty frame: iterator:${iterator} frame:${frame} (${vid.get(
                  VideoCaptureProperties.CAP_PROP_POS_MSEC
                )}ms) of ${vid.get(
                  VideoCaptureProperties.CAP_PROP_FRAME_COUNT
                )}`
              );
            }
            if (frame > videoLength || mat.empty === true) {
              const meanArrayInReduced = meanArrayIn.reduce(
                (prev, current) => {
                  let largerObject = prev.mean > current.mean ? prev : current;
                  if (prev.frameThreshold === undefined) {
                    largerObject =
                      current.mean > threshold
                        ? {
                            ...largerObject,
                            ...{ frameThreshold: current.frame }
                          }
                        : largerObject;
                  } else {
                    largerObject = {
                      ...largerObject,
                      ...{ frameThreshold: prev.frameThreshold }
                    };
                  }
                  return largerObject;
                },
                { frame: 0, mean: 0 }
              );
              const meanArrayOutReduced = meanArrayOut.reduceRight(
                (prev, current) => {
                  let largerObject = prev.mean > current.mean ? prev : current;
                  if (prev.frameThreshold === undefined) {
                    largerObject =
                      current.mean > threshold
                        ? {
                            ...largerObject,
                            ...{ frameThreshold: current.frame }
                          }
                        : largerObject;
                  } else {
                    largerObject = {
                      ...largerObject,
                      ...{ frameThreshold: prev.frameThreshold }
                    };
                  }
                  return largerObject;
                },
                { frame: videoLength, mean: 0 }
              );
              console.log(meanArrayInReduced);
              console.log(meanArrayOutReduced);

              // use frame when threshold is reached and if undefined use frame with highest mean
              fadeInPoint =
                meanArrayInReduced.frameThreshold !== undefined
                  ? meanArrayInReduced.frameThreshold
                  : meanArrayInReduced.frame;
              fadeOutPoint =
                meanArrayOutReduced.frameThreshold !== undefined
                  ? meanArrayOutReduced.frameThreshold
                  : meanArrayOutReduced.frame;

              const timeAfterInOutPointDetection = Date.now();
              console.timeEnd(`${fileId}-inOutPointDetection`);
              console.log(`fadeInPoint: ${fadeInPoint}`);
              console.log(`fadeOutPoint: ${fadeOutPoint}`);
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'progress',
                fileId,
                100
              ); // set to full
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'progressMessage',
                fileId,
                'info',
                `In and Outpoint detection finished - ${timeAfterInOutPointDetection -
                  timeBeforeInOutPointDetection}ms`,
                3000
              );
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'receive-get-in-and-outpoint',
                fileId,
                fadeInPoint,
                fadeOutPoint
              );
            } else {
              console.error(
                `something wrong: frame:${frame} > videoLength:${videoLength} || mat.empty ${
                  mat.empty
                }`
              );
              console.log(meanArrayIn);
              console.log(meanArrayOut);
              console.error(
                `something wrong: iterator:${iterator} frame:${frame} (${vid.get(
                  VideoCaptureProperties.CAP_PROP_POS_MSEC
                )}ms) of ${vid.get(
                  VideoCaptureProperties.CAP_PROP_FRAME_COUNT
                )}`
              );
            }
          });
        };

        const startFrame = 0;
        let iterator = 0;
        if (err1) throw err1;
        setPosition(vid, startFrame, useRatio);
        read(); // start reading frames
      });
    } else {
      console.log('in-out-point-detection DEACTIVATED');
      ipcRenderer.send(
        'message-from-opencvWorkerWindow-to-mainWindow',
        'receive-get-in-and-outpoint',
        fileId,
        0,
        videoLength
      );
    }
  }
);

ipcRenderer.on(
  'send-get-scene-detection',
  (event, fileId, filePath, useRatio, threshold = 20.0) => {
    console.log('send-get-scene-detection');
    console.log(fileId);
    console.log(filePath);
    const timeBeforeSceneDetection = Date.now();
    console.time(`${fileId}-sceneDetection`);
    const vid = new opencv.VideoCapture(filePath);
    const videoLength =
      vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1;
    console.log(videoLength);

    const minSceneLen = 15;

    const sceneList = [];
    const frameMetrics = [];
    let lastFrameMean = new opencv.Vec(null, null, null, null);;
    let lastSceneCut = null;

    vid.readAsync(err1 => {
      const read = () => {
        vid.readAsync((err, mat) => {
          const frame = vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1;
          if (iterator % 100 === 0) {
            const progressBarPercentage =
              iterator / vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) * 100;
            ipcRenderer.send(
              'message-from-opencvWorkerWindow-to-mainWindow',
              'progress',
              fileId,
              progressBarPercentage
            ); // first half of progress
            console.log(
              `readAsync: frame:${frame} (${vid.get(
                VideoCaptureProperties.CAP_PROP_POS_MSEC
              )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`
            );
          }
          let frameMean = 0;
          if (mat.empty === false) {
            frameMean = mat
              .resizeToMax(240)
              .cvtColor(opencv.COLOR_BGR2HSV)
              .mean();

            const deltaFrameMean = frameMean.absdiff(lastFrameMean);
            const frameHsvAverage = (deltaFrameMean.w + deltaFrameMean.x + deltaFrameMean.y) / 3.0; // w = H, x = S, y = V = brightness

            if (frameHsvAverage >= threshold) {
              if (((lastSceneCut === null) || ((frame - lastSceneCut) >= minSceneLen))) {
                sceneList.push({
                  frame,
                });
                lastSceneCut = frame;
                console.log(sceneList);
              }
            }
            // console.log(`${frame}: ${deltaFrameMean.y} = ${frameMean.y} - ${lastFrameMean.y}`);
            lastFrameMean = frameMean;

            frameMetrics.push({
              frame,
              mean: frameMean.y
            });
          } else {
            console.error(
              `empty frame: iterator:${iterator} frame:${frame} (${vid.get(
                VideoCaptureProperties.CAP_PROP_POS_MSEC
              )}ms) of ${vid.get(
                VideoCaptureProperties.CAP_PROP_FRAME_COUNT
              )}`
            );
            frameMetrics.push({
              frame: iterator,
              mean: undefined
            });
          }
          iterator += 1;
          if (iterator < vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)) {
            read();
          } else {
            const timeAfterSceneDetection = Date.now();
            const messageToSend = `Scene detection finished - ${(timeAfterSceneDetection -
              timeBeforeSceneDetection) / 1000}s - speed: ${(timeAfterSceneDetection -
                timeBeforeSceneDetection) / vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`;
            console.log(messageToSend);
            console.timeEnd(`${fileId}-sceneDetection`);

            const tempFrameArray = frameMetrics.map((item) => item.frame);
            const tempMeanArray = frameMetrics.map((item) => item.mean);
            console.log(tempMeanArray);

            ipcRenderer.send(
              'message-from-opencvWorkerWindow-to-mainWindow',
              'received-get-scene-detection',
              fileId,
              sceneList,
              tempMeanArray
            );

            ipcRenderer.send(
              'message-from-opencvWorkerWindow-to-mainWindow',
              'progress',
              fileId,
              100
            ); // set to full
            ipcRenderer.send(
              'message-from-opencvWorkerWindow-to-mainWindow',
              'progressMessage',
              fileId,
              'info',
              messageToSend,
              6000
            );
          }
        });
      };

      const startFrame = 0;
      let iterator = 0;
      if (err1) throw err1;
      setPosition(vid, startFrame, useRatio);
      read(); // start reading frames
    });
  }
);

// read sync test
ipcRenderer.on(
  // 'send-get-thumbs',
  'send-get-thumbs-sync',
  (
    event,
    fileId,
    filePath,
    thumbIdArray,
    frameIdArray,
    frameNumberArray,
    useRatio
  ) => {
    console.log('send-get-thumbs');
    console.log(frameNumberArray);
    console.log(filePath);
    console.log(`useRatio: ${useRatio}`);
    // opencv.utils.setLogLevel('LOG_LEVEL_DEBUG');
    const vid = new opencv.VideoCapture(filePath);

    for (let i = 0; i < frameNumberArray.length; i += 1) {
      setPosition(vid, frameNumberArray[i], useRatio);
      const frame = vid.read();
      if (frame.empty) {
        console.log('frame is empty');
        ipcRenderer.send(
          'message-from-opencvWorkerWindow-to-mainWindow',
          'receive-get-thumbs',
          fileId,
          thumbIdArray[i],
          frameIdArray[i],
          '',
          vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1,
          i === (frameNumberArray.length - 1)
        );
      } else {
        console.log('frame not empty');
        console.log(
          `readSync: ${i}, ${frameNumberArray[i]}/${vid.get(
            VideoCaptureProperties.CAP_PROP_POS_FRAMES
          ) - 1}(${vid.get(
            VideoCaptureProperties.CAP_PROP_POS_MSEC
          )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`
        );
        // opencv.imshow('a window name', frame);
        const outBase64 = opencv.imencode('.jpg', frame).toString('base64'); // maybe change to .png?
        ipcRenderer.send(
          'message-from-opencvWorkerWindow-to-mainWindow',
          'receive-get-thumbs',
          fileId,
          thumbIdArray[i],
          frameIdArray[i],
          outBase64,
          vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1,
          i === (frameNumberArray.length - 1)
        );
        // opencv.waitKey(10);
      }
    }
  }
);

// read async
ipcRenderer.on(
  // 'send-get-thumbs-async',
  'send-get-thumbs',
  (
    event,
    fileId,
    filePath,
    thumbIdArray,
    frameIdArray,
    frameNumberArray,
    useRatio
  ) => {
    console.log('send-get-thumbs');
    console.log(frameNumberArray);
    console.log(filePath);
    console.log(`useRatio: ${useRatio}`);
    const vid = new opencv.VideoCapture(filePath);

    vid.readAsync(err1 => {
      const read = (frameOffset = 0) => {
        // limit frameNumberToCapture between 0 and movie length
        const frameNumberToCapture = limitRange(
          frameNumberArray[iterator] + frameOffset,
          0,
          vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) - 1
        );

        setPosition(vid, frameNumberToCapture, useRatio);

        vid.readAsync((err, mat) => {
          // debugger;
          console.log(
            `readAsync: ${iterator}, frameOffset: ${frameOffset}, ${frameNumberToCapture}/${vid.get(
              VideoCaptureProperties.CAP_PROP_POS_FRAMES
            ) - 1}(${vid.get(
              VideoCaptureProperties.CAP_PROP_POS_MSEC
            )}ms) of ${vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT)}`
          );

          if (mat.empty === false) {
            // opencv.imshow('a window name', mat);
            const outBase64 = opencv.imencode('.jpg', mat).toString('base64'); // maybe change to .png?
            ipcRenderer.send(
              'message-from-opencvWorkerWindow-to-mainWindow',
              'receive-get-thumbs',
              fileId,
              thumbIdArray[iterator],
              frameIdArray[iterator],
              outBase64,
              vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1,
              iterator === (frameNumberArray.length - 1)
            );
            iterator += 1;
            if (iterator < frameNumberArray.length) {
              read();
            }
          } else {
            console.log('frame is empty');
            // assumption is that the we might find frames forward or backward which work
            if (Math.abs(frameOffset) < searchLimit) {
              // if frameNumberToCapture is close to the end go backward else go forward
              if (
                frameNumberToCapture <
                vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) -
                  searchLimit
              ) {
                console.log('will try to read one frame forward');
                read(frameOffset + 1);
              } else {
                console.log('will try to read one frame backward');
                read(frameOffset - 1);
              }
            } else {
              console.log(
                'still empty, will stop and send an empty frame back'
              );
              ipcRenderer.send(
                'message-from-opencvWorkerWindow-to-mainWindow',
                'receive-get-thumbs',
                fileId,
                thumbIdArray[iterator],
                frameIdArray[iterator],
                '',
                vid.get(VideoCaptureProperties.CAP_PROP_POS_FRAMES) - 1
              );
              iterator += 1;
              if (iterator < frameNumberArray.length) {
                read();
              }
            }
          }
        });
      };

      if (err1) throw err1;
      let iterator = 0;
      setPosition(vid, frameNumberArray[iterator], useRatio);
      read();
    });
  }
);

render(
  <div>
    <h1>I am the opencv worker window.</h1>
  </div>,
  document.getElementById('worker_opencv')
);
