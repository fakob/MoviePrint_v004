/* eslint no-param-reassign: "error" */
/* eslint no-nested-ternary: "off" */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'semantic-ui-react';
import uuidV4 from 'uuid/v4';
import log from 'electron-log';
import { VideoCaptureProperties } from '../utils/openCVProperties';
import {
  CHANGE_THUMB_STEP,
  DEFAULT_VIDEO_PLAYER_CONTROLLER_HEIGHT,
  MOVIEPRINT_COLORS,
  SHEET_TYPE,
  SHEET_VIEW,
  TRANSFORMOBJECT_INIT,
  VIDEOPLAYER_CUTGAP,
  VIDEOPLAYER_SLICE_ARRAY_SIZE,
  VIDEOPLAYER_SLICEGAP,
} from '../utils/constants';
import {
  secondsToFrameCount,
  frameCountToSeconds,
  getHighestFrame,
  getLowestFrame,
  getLowestFrameFromScenes,
  getHighestFrameFromScenes,
  getSceneFromFrameNumber,
  getPreviousThumb,
  getNextThumb,
  getSliceWidthArrayForCut,
  limitRange,
  mapRange,
  setPosition,
} from '../utils/utils';
import { getCropRect, transformMat } from '../utils/utilsForOpencv';
import Timeline from './Timeline';
import styles from './VideoPlayer.css';
import stylesPop from './Popup.css';

const pathModule = require('path');
const opencv = require('opencv4nodejs');

class VideoPlayer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentFrame: 0, // in frames
      currentScene: {
        start: 0,
        length: 0,
      }, // in frames
      videoHeight: 360,
      videoWidth: 640,
      playHeadPositionPerc: 0, // in pixel
      playHeadPositionPercSelection: 0, // in pixel
      currentTime: 0, // in seconds
      duration: 0, // in seconds
      showPlaybar: true,
      loadVideo: false,
      showHTML5Player: false,
    };

    // this.onSaveThumbClick = this.onSaveThumbClick.bind(this);

    this.handleKeyPress = this.handleKeyPress.bind(this);

    this.getCurrentFrameNumber = this.getCurrentFrameNumber.bind(this);
    this.onBackForwardClick = this.onBackForwardClick.bind(this);
    this.updateOpencvVideoCanvas = this.updateOpencvVideoCanvas.bind(this);
    this.updatePositionWithStep = this.updatePositionWithStep.bind(this);
    this.onDurationChange = this.onDurationChange.bind(this);
    this.updateTimeFromFrameNumber = this.updateTimeFromFrameNumber.bind(this);
    this.updatePositionFromTime = this.updatePositionFromTime.bind(this);
    this.updatePositionFromFrame = this.updatePositionFromFrame.bind(this);
    this.updateTimeFromPosition = this.updateTimeFromPosition.bind(this);
    this.updateTimeFromPositionSelection = this.updateTimeFromPositionSelection.bind(this);
    this.onVideoError = this.onVideoError.bind(this);
    this.onLoadedData = this.onLoadedData.bind(this);
    this.toggleHTML5Player = this.toggleHTML5Player.bind(this);

    this.onNextSceneClickWithStop = this.onNextSceneClickWithStop.bind(this);
    this.onNextThumbClickWithStop = this.onNextThumbClickWithStop.bind(this);
    this.onMergeSceneClickWithStop = this.onMergeSceneClickWithStop.bind(this);
    this.onCutSceneClickWithStop = this.onCutSceneClickWithStop.bind(this);
    this.setOrToggleDefaultSheetViewWithStop = this.setOrToggleDefaultSheetViewWithStop.bind(this);
    this.onChangeThumbClick = this.onChangeThumbClick.bind(this);
    this.onChangeOrAddClick = this.onChangeOrAddClick.bind(this);
  }

  static getDerivedStateFromProps(props) {
    const { aspectRatioInv, height, containerWidth, defaultSheetView, file, fileHeight, fileWidth, opencvVideo } = props;
    const { transformObject = TRANSFORMOBJECT_INIT } = file;

    const videoHeight = parseInt(height - DEFAULT_VIDEO_PLAYER_CONTROLLER_HEIGHT, 10);
    const videoWidth = videoHeight / aspectRatioInv;

    let sliceArraySize = VIDEOPLAYER_SLICE_ARRAY_SIZE;
    if (defaultSheetView === SHEET_VIEW.GRIDVIEW) {
      sliceArraySize -= 1;
    }

    // needs to check for video aspect ratio!!!
    const rescaleFactor = aspectRatioInv <= 1 ? videoHeight / fileHeight : videoWidth / fileWidth;
    const sliceWidthArray = getSliceWidthArrayForCut(containerWidth, videoWidth, sliceArraySize);

    const cropRect = getCropRect(opencvVideo, transformObject);

    return {
      cropRect,
      rescaleFactor,
      sliceArraySize,
      sliceWidthArray,
      thisTransformObject: transformObject,
      videoHeight,
      videoWidth,
    };
  }

  componentDidMount() {
    const { containerWidth, jumpToFrameNumber } = this.props;
    const { videoHeight } = this.state;

    if (jumpToFrameNumber !== undefined) {
      this.updateTimeFromFrameNumber(jumpToFrameNumber);
    }
    document.addEventListener('keydown', this.handleKeyPress);
  }

  componentDidUpdate(prevProps, prevState) {
    const { jumpToFrameNumber, containerWidth, path, frameCount, allScenes, width } = this.props;
    const { currentFrame, videoHeight } = this.state;

    if (jumpToFrameNumber !== undefined) {
      if (prevProps.jumpToFrameNumber !== jumpToFrameNumber) {
        this.updateTimeFromFrameNumber(jumpToFrameNumber);
      }
    }

    if (
      prevProps.allScenes.length !== allScenes.length ||
      prevProps.frameCount !== frameCount ||
      prevProps.path !== path ||
      prevState.videoHeight !== videoHeight
    ) {
      this.updateTimeFromFrameNumber(Math.min(currentFrame, frameCount - 1));
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
  }

  handleKeyPress(event) {
    // you may also add a filter here to skip keys, that do not have an effect for your app
    // this.props.keyPressAction(event.keyCode);
    event.stopPropagation();

    const { arrayOfCuts, onCutSceneClick, onMergeSceneClick, sheetType, defaultSheetView } = this.props;
    const { currentFrame } = this.state;
    const thisFrameIsACut = arrayOfCuts.some(item => item === currentFrame);
    // only listen to key events when feedback form is not shown
    if (event.target.tagName !== 'INPUT') {
      let stepValue = 1;
      const [stepValue0, stepValue1, stepValue2] = CHANGE_THUMB_STEP;
      if (event) {
        switch (event.which) {
          case 13: // press enter
            if (defaultSheetView === SHEET_VIEW.TIMELINEVIEW) {
              if (thisFrameIsACut) {
                log.debug(`merging scenes at ${currentFrame}`);
                onMergeSceneClick(currentFrame);
              } else {
                log.debug(`cutting scene at ${currentFrame}`);
                onCutSceneClick(currentFrame);
              }
            }
            if (sheetType === SHEET_TYPE.SCENES && defaultSheetView === SHEET_VIEW.GRIDVIEW) {
              this.onChangeThumbClick();
            }
            if (sheetType === SHEET_TYPE.INTERVAL && defaultSheetView === SHEET_VIEW.GRIDVIEW) {
              this.onChangeOrAddClick();
            }
            break;
          case 37: // press arrow left
            stepValue = stepValue1 * -1;
            if (event.shiftKey) {
              stepValue = stepValue0 * -1;
            }
            if (event.altKey) {
              stepValue = stepValue2 * -1;
            }
            if (event.shiftKey && event.altKey) {
              if (defaultSheetView === SHEET_VIEW.TIMELINEVIEW) {
                this.onNextSceneClickWithStop(undefined, 'back', currentFrame);
              } else {
                this.onNextThumbClickWithStop(undefined, 'back', currentFrame);
              }
            } else {
              this.updatePositionWithStep(stepValue);
            }
            break;
          case 39: // press arrow right
            stepValue = stepValue1 * 1;
            if (event.shiftKey) {
              stepValue = stepValue0 * 1;
            }
            if (event.altKey) {
              stepValue = stepValue2 * 1;
            }
            if (event.shiftKey && event.altKey) {
              if (defaultSheetView === SHEET_VIEW.TIMELINEVIEW) {
                this.onNextSceneClickWithStop(undefined, 'forward', currentFrame);
              } else {
                this.onNextThumbClickWithStop(undefined, 'forward', currentFrame);
              }
            } else {
              this.updatePositionWithStep(stepValue);
            }
            break;
          default:
        }
      }
    }
  }

  getCurrentFrameNumber() {
    const { currentFrame } = this.state;
    const newFrameNumber = currentFrame;
    return newFrameNumber;
  }

  onBackForwardClick(e, step) {
    e.target.blur(); // remove focus so button gets not triggered when clicking enter
    e.stopPropagation();
    this.updatePositionWithStep(step);
  }

  onDurationChange(duration) {
    const { playHeadPositionPerc, playHeadPositionPercSelection } = this.state;

    // setState is asynchronious
    // updatePosition needs to wait for setState, therefore it is put into callback of setState
    this.setState({ duration }, () => {
      this.updateTimeFromPosition(playHeadPositionPerc);
      this.updateTimeFromPositionSelection(playHeadPositionPercSelection);
    });
  }

  updateOpencvVideoCanvas(currentFrame) {
    const { arrayOfCuts, fileHeight, fileWidth, containerWidth, useRatio, defaultSheetView, opencvVideo } = this.props;
    const { cropRect, rescaleFactor, sliceArraySize, sliceWidthArray, thisTransformObject, videoHeight } = this.state;
    const ctx = this.opencvVideoPlayerCanvasRef.getContext('2d');

    // check if the video was found and is loaded
    if (opencvVideo !== undefined) {
      let offsetCorrection = 0;
      if (defaultSheetView === SHEET_VIEW.GRIDVIEW) {
        offsetCorrection = 1;
      }

      // maybe this can be optimised so it is not set on every updateOpencvVideoCanvas, but
      // setting this in componentDidUpdate ended in not showing the canvas at allow
      // so I am keeping it for now
      // apparently this sets/resets the canvas
      this.opencvVideoPlayerCanvasRef.height = videoHeight;
      this.opencvVideoPlayerCanvasRef.width = containerWidth;

      // offset currentFrame due to main frame is in middle of sliceArraySize
      const sliceArraySizeHalf = Math.floor(sliceArraySize / 2);
      const offsetFrameNumber = currentFrame - parseInt(sliceArraySizeHalf, 10) + offsetCorrection;
      const startFrameToRead = Math.max(0, offsetFrameNumber);
      setPosition(opencvVideo, startFrameToRead, useRatio);

      let canvasXPos = 0;

      for (let i = 0; i < sliceArraySize; i += 1) {
        const sliceWidth = sliceWidthArray[i];
        const sliceXPos = Math.max(Math.floor((fileWidth * rescaleFactor) / 2) - Math.floor(sliceWidth / 2), 0);
        const thisFrameIsACut = arrayOfCuts.some(item => item === offsetFrameNumber + i + 1);

        if (offsetFrameNumber + i >= 0) {
          const mat = opencvVideo.read();
          if (!mat.empty) {
            // optional transformation
            const matTransformed = transformMat(mat, thisTransformObject, cropRect);

            const matResized = matTransformed.rescale(rescaleFactor);

            const cropRectForSlice = new opencv.Rect(
              sliceXPos,
              0,
              Math.min(matResized.cols, sliceWidth),
              Math.min(matResized.rows, Math.abs(videoHeight)),
            );
            // log.debug(cropRectForSlice);
            // log.debug(`${fileWidth}, ${fileHeight}, ${rescaleFactor}, ${fileWidth * rescaleFactor}, ${fileHeight * rescaleFactor}, ${i}: ${canvasXPos}, ${sliceXPos}, ${cropRectForSlice.width}`)

            const matCropped = matResized.getRegion(cropRectForSlice);

            const matRGBA =
              matResized.channels === 1
                ? matCropped.cvtColor(opencv.COLOR_GRAY2RGBA)
                : matCropped.cvtColor(opencv.COLOR_BGR2RGBA);

            const imgData = new ImageData(new Uint8ClampedArray(matRGBA.getData()), matCropped.cols, matCropped.rows);

            ctx.putImageData(imgData, canvasXPos, 0);
          } else {
            log.debug('frame empty');
          }
        }
        canvasXPos += sliceWidthArray[i] + (thisFrameIsACut ? VIDEOPLAYER_CUTGAP : VIDEOPLAYER_SLICEGAP);
      }
    }
  }

  updatePositionWithStep(step) {
    const { frameCount, fps } = this.props;
    const { currentTime, loadVideo, showHTML5Player } = this.state;
    const currentFramePlusStep = limitRange(this.getCurrentFrameNumber() + step, 0, frameCount - 1);
    const currentTimePlusStep = currentTime + frameCountToSeconds(step, fps);
    this.updatePositionFromFrame(currentFramePlusStep);
    this.updateOpencvVideoCanvas(currentFramePlusStep);
    if (loadVideo && showHTML5Player) {
      this.video.currentTime = currentTimePlusStep;
    }
  }

  updatePositionFromTime(currentTime) {
    const { fps, onSelectThumbMethod, allScenes } = this.props;
    const { currentScene, duration } = this.state;
    if (currentTime) {
      // rounds the number with 3 decimals
      const roundedCurrentTime = Math.round(currentTime * 1000 + Number.EPSILON) / 1000;
      const currentFrame = secondsToFrameCount(currentTime, fps);
      const newScene = getSceneFromFrameNumber(allScenes, currentFrame);
      if (currentScene !== undefined && newScene !== undefined && currentScene.sceneId !== newScene.sceneId) {
        this.setState({
          currentScene: newScene,
        });
        onSelectThumbMethod(newScene.sceneId); // call to update selection when scrubbing
      }
      const xPos = mapRange(roundedCurrentTime, 0, duration, 0, 1.0, false);
      const { inPoint, outPoint } = this.getInOutObject(newScene);
      const xPosSelection = mapRange(roundedCurrentTime, inPoint, outPoint, 0, 1.0, false);
      this.setState({
        currentFrame,
        currentTime: roundedCurrentTime,
        playHeadPositionPerc: xPos,
        playHeadPositionPercSelection: xPosSelection,
      });
      this.updateOpencvVideoCanvas(currentFrame);
      // log.debug(`${currentTime} : ${xPos} : ${containerWidth} : ${duration}`);
    }
  }

  updatePositionFromFrame(currentFrame) {
    const { frameCount, onSelectThumbMethod, allScenes } = this.props;
    const { currentScene } = this.state;

    if (currentFrame !== undefined) {
      const newScene = getSceneFromFrameNumber(allScenes, currentFrame);
      if (newScene !== undefined && (currentScene === undefined || currentScene.sceneId !== newScene.sceneId)) {
        this.setState({
          currentScene: newScene,
        });
        onSelectThumbMethod(newScene.sceneId); // call to update selection when scrubbing
      }
      const xPos = mapRange(currentFrame, 0, frameCount - 1, 0, 1.0, false);
      const { inPoint, outPoint } = this.getInOutObject(newScene);
      const xPosSelection = mapRange(currentFrame, inPoint, outPoint, 0, 1.0, false);
      this.setState({
        currentFrame,
        playHeadPositionPerc: xPos,
        playHeadPositionPercSelection: xPosSelection,
      });
    }
  }

  updateTimeFromFrameNumber(currentFrame) {
    const { frameCount, fps, allScenes } = this.props;
    const { loadVideo, showHTML5Player } = this.state;

    const currentScene = getSceneFromFrameNumber(allScenes, currentFrame);
    if (currentScene !== undefined) {
      this.setState({
        currentScene,
      });
    }
    const xPos = mapRange(currentFrame, 0, frameCount - 1, 0, 1.0, false);
    const { inPoint, outPoint } = this.getInOutObject(currentScene);
    const xPosSelection = mapRange(currentFrame, inPoint, outPoint, 0, 1.0, false);
    const currentTime = frameCountToSeconds(currentFrame, fps);
    this.setState({
      currentFrame,
      currentTime,
      playHeadPositionPerc: xPos,
      playHeadPositionPercSelection: xPosSelection,
    });
    if (loadVideo && showHTML5Player) {
      this.video.currentTime = currentTime;
    }
    this.updateOpencvVideoCanvas(currentFrame);
  }

  getInOutObject = currentScene => {
    let inPoint = 0;
    let outPoint = 0;
    if (currentScene !== undefined) {
      inPoint = currentScene.start;
      outPoint = currentScene.start + currentScene.length - 1;
    }
    return {
      inPoint,
      outPoint,
    };
  };

  updateTimeFromPosition(xPos) {
    const { frameCount, allScenes, onSelectThumbMethod } = this.props;
    const { currentScene, duration, loadVideo, showHTML5Player } = this.state;
    if (xPos !== undefined) {
      const currentFrame = mapRange(xPos, 0, 1.0, 0, frameCount - 1);
      const newScene = getSceneFromFrameNumber(allScenes, currentFrame);
      if (currentScene !== undefined && newScene !== undefined && currentScene.sceneId !== newScene.sceneId) {
        this.setState({
          currentScene: newScene,
        });
        onSelectThumbMethod(newScene.sceneId); // call to update selection when scrubbing
      }
      const { inPoint, outPoint } = this.getInOutObject(newScene);
      const xPosSelection = mapRange(currentFrame, inPoint, outPoint, 0, 1.0, false);
      this.setState({
        playHeadPositionPerc: xPos,
        playHeadPositionPercSelection: xPosSelection,
        currentFrame,
      });
      this.updateOpencvVideoCanvas(currentFrame);
      const currentTime = mapRange(xPos, 0, 1.0, 0, duration, false);
      // log.debug(`${currentTime} : ${xPos} : ${containerWidth} : ${duration}`);
      this.setState({ currentTime });
      if (loadVideo && showHTML5Player) {
        this.video.currentTime = currentTime;
      }
    }
  }

  updateTimeFromPositionSelection(xPosSelection) {
    const { frameCount, allScenes, onSelectThumbMethod } = this.props;
    const { currentScene, duration, loadVideo, showHTML5Player } = this.state;

    if (xPosSelection !== undefined) {
      const { inPoint, outPoint } = this.getInOutObject(currentScene);
      const currentFrame = mapRange(xPosSelection, 0, 1.0, inPoint, outPoint);
      const xPos = mapRange(currentFrame, 0, frameCount - 1, 0, 1.0, false);
      const newScene = getSceneFromFrameNumber(allScenes, currentFrame);
      if (currentScene !== undefined && newScene !== undefined && currentScene.sceneId !== newScene.sceneId) {
        this.setState({
          currentScene: newScene,
        });
        onSelectThumbMethod(newScene.sceneId); // call to update selection when scrubbing
      }
      this.setState({
        playHeadPositionPerc: xPos,
        playHeadPositionPercSelection: xPosSelection,
        currentFrame,
      });
      this.updateOpencvVideoCanvas(currentFrame);
      const currentTime = mapRange(xPos, 0, 1.0, 0, duration, false);
      // log.debug(`${currentTime} : ${xPos} : ${containerWidth} : ${duration}`);
      this.setState({ currentTime });
      if (loadVideo && showHTML5Player) {
        this.video.currentTime = currentTime;
      }
    }
  }

  onMergeSceneClickWithStop(e, currentFrame) {
    const { onMergeSceneClick } = this.props;
    e.target.blur(); // remove focus so button gets not triggered when clicking enter
    e.stopPropagation();
    onMergeSceneClick(currentFrame);
    log.debug(`Mouse click: merging scenes at ${currentFrame}`);
  }

  onCutSceneClickWithStop(e, currentFrame) {
    const { onCutSceneClick } = this.props;
    e.target.blur(); // remove focus so button gets not triggered when clicking enter
    e.stopPropagation();
    log.debug(`Mouse click: cutting scene at ${currentFrame}`);
    onCutSceneClick(currentFrame);
  }

  setOrToggleDefaultSheetViewWithStop(e) {
    const { setOrToggleDefaultSheetView } = this.props;
    e.target.blur(); // remove focus so button gets not triggered when clicking enter
    e.stopPropagation();
    setOrToggleDefaultSheetView();
  }

  onNextThumbClickWithStop(e, direction) {
    const { currentScene } = this.state;
    const { frameCount, onSelectThumbMethod, allScenes, selectedThumb, thumbs, sheetType } = this.props;
    if (e !== undefined) {
      e.target.blur(); // remove focus so button gets not triggered when clicking enter
      e.stopPropagation();
    }

    if (sheetType === SHEET_TYPE.SCENES) {
      let newSceneToSelect;

      if (direction === 'back') {
        newSceneToSelect = getSceneFromFrameNumber(allScenes, currentScene.start - 1);
      } else if (direction === 'forward') {
        newSceneToSelect = getSceneFromFrameNumber(allScenes, currentScene.start + currentScene.length);
      }
      const newThumbToSelect = thumbs.find(thumb => thumb.thumbId === newSceneToSelect.sceneId);
      if (newSceneToSelect !== undefined) {
        onSelectThumbMethod(newSceneToSelect.sceneId); // call to update selection
      }
      if (newThumbToSelect !== undefined) {
        let newFrameNumberToJumpTo = newThumbToSelect.frameNumber;
        newFrameNumberToJumpTo = limitRange(newFrameNumberToJumpTo, 0, frameCount - 1);
        this.updatePositionFromFrame(newFrameNumberToJumpTo);
        this.updateOpencvVideoCanvas(newFrameNumberToJumpTo);
      }
    } else if (sheetType === SHEET_TYPE.INTERVAL || sheetType === SHEET_TYPE.FACES) {
      const selectedThumbId = selectedThumb === undefined ? undefined : selectedThumb.thumbId;
      let newThumbToSelect;
      if (direction === 'back') {
        newThumbToSelect = getPreviousThumb(thumbs, selectedThumbId);
      } else if (direction === 'forward') {
        newThumbToSelect = getNextThumb(thumbs, selectedThumbId);
      }
      if (newThumbToSelect !== undefined) {
        onSelectThumbMethod(newThumbToSelect.thumbId); // call to update selection
        let newFrameNumberToJumpTo = newThumbToSelect.frameNumber;
        newFrameNumberToJumpTo = limitRange(newFrameNumberToJumpTo, 0, frameCount - 1);
        this.updatePositionFromFrame(newFrameNumberToJumpTo);
        this.updateOpencvVideoCanvas(newFrameNumberToJumpTo);
      }
    }
  }

  onNextSceneClickWithStop(e, direction, frameNumber) {
    const { currentScene } = this.state;
    const { frameCount, onSelectThumbMethod, allScenes } = this.props;
    if (e !== undefined) {
      e.target.blur(); // remove focus so button gets not triggered when clicking enter
      e.stopPropagation();
    }

    let newFrameNumberToJumpTo;
    let newSceneToSelect;
    // if going back and frameNumber is within the scene not at the cut
    // then just update position else jumpToScene
    if (direction === 'back' && frameNumber !== currentScene.start) {
      newFrameNumberToJumpTo = currentScene.start;
    } else {
      if (direction === 'back') {
        newSceneToSelect = getSceneFromFrameNumber(allScenes, currentScene.start - 1);
        newFrameNumberToJumpTo = newSceneToSelect.start;
      } else if (direction === 'forward') {
        newFrameNumberToJumpTo = currentScene.start + currentScene.length;
        newSceneToSelect = getSceneFromFrameNumber(allScenes, newFrameNumberToJumpTo);
      }
      if (newSceneToSelect !== undefined) {
        onSelectThumbMethod(newSceneToSelect.sceneId); // call to update selection
      }
    }
    newFrameNumberToJumpTo = limitRange(newFrameNumberToJumpTo, 0, frameCount - 1);
    this.updatePositionFromFrame(newFrameNumberToJumpTo);
    this.updateOpencvVideoCanvas(newFrameNumberToJumpTo);
  }

  onChangeThumbClick() {
    const { currentFrame, currentScene } = this.state;
    const { currentSheetId, file, onChangeThumb } = this.props;

    if (currentScene !== undefined && currentFrame !== undefined) {
      onChangeThumb(file, currentSheetId, currentScene.sceneId, currentFrame);
    }
  }

  onChangeOrAddClick = () => {
    const { currentFrame } = this.state;
    const {
      currentSheetId,
      file,
      frameSize,
      keyObject,
      onAddThumb,
      onChangeThumb,
      onSelectThumbMethod,
      selectedThumb,
      thumbs,
    } = this.props;

    // only do changes if there is a thumb selected
    if (thumbs.find(thumb => thumb.thumbId === selectedThumb.thumbId) !== undefined) {
      if (keyObject.altKey || keyObject.shiftKey) {
        const newThumbId = uuidV4();
        if (keyObject.altKey) {
          onAddThumb(
            file,
            currentSheetId,
            newThumbId,
            currentFrame,
            thumbs.find(thumb => thumb.thumbId === selectedThumb.thumbId).index + 1,
            frameSize,
          );
        } else {
          // if shiftKey
          onAddThumb(
            file,
            currentSheetId,
            newThumbId,
            currentFrame,
            thumbs.find(thumb => thumb.thumbId === selectedThumb.thumbId).index,
            frameSize,
          );
        }
        // delay selection so it waits for add thumb to be ready
        setTimeout(() => {
          onSelectThumbMethod(newThumbId, currentFrame);
        }, 500);
      } else {
        // if normal set new thumb
        onChangeThumb(file, currentSheetId, selectedThumb.thumbId, currentFrame, frameSize);
      }
    }
  };

  toggleHTML5Player(e) {
    e.target.blur(); // remove focus so button gets not triggered when clicking enter
    e.stopPropagation();
    this.setState(prevState => ({
      showHTML5Player: !prevState.showHTML5Player,
    }));
  }

  onVideoError = () => {
    const { frameCount } = this.props;

    log.error('onVideoError');
    // log.debug(this);
    this.onDurationChange(frameCountToSeconds(frameCount));
    this.setState({
      loadVideo: false,
    });
  };

  onLoadedData = () => {
    // log.debug('onLoadedData');
    // log.debug(this);
    this.setState({
      loadVideo: true,
    });
  };

  render() {
    const { currentFrame, currentScene, playHeadPositionPerc, playHeadPositionPercSelection } = this.state;
    const {
      arrayOfCuts,
      containerWidth,
      defaultSheetView,
      file,
      frameCount,
      path,
      keyObject,
      scenes,
      sheetType,
      thumbs,
    } = this.props;
    const { showHTML5Player, showPlaybar, videoHeight, videoWidth } = this.state;

    function over(event) {
      event.target.style.opacity = 1;
    }

    function out(event) {
      event.target.style.opacity = 0.5;
    }

    const thisFrameIsACut = arrayOfCuts.some(item => item === currentFrame);

    return (
      <div>
        <div
          className={`${styles.player}`}
          style={{
            // height: videoHeight,
            width: containerWidth,
          }}
        >
          <Popup
            trigger={
              <button
                type="button"
                className={`${styles.hoverButton} ${styles.textButton} ${styles.html5Button}`}
                onClick={e => this.toggleHTML5Player(e)}
                onMouseOver={over}
                onMouseLeave={out}
                onFocus={over}
                onBlur={out}
              >
                html5 player
              </button>
            }
            mouseEnterDelay={1000}
            on={['hover']}
            position="bottom center"
            className={stylesPop.popup}
            content={showHTML5Player ? 'Hide HTML5 Player' : 'Show HTML5 Player'}
          />
          {showHTML5Player && (
            <>
              <div className={`${styles.noVideoText}`}>The video format is not supported by this player</div>
              <video
                ref={el => {
                  this.video = el;
                }}
                className={`${styles.videoOverlay}`}
                controls={showPlaybar ? true : undefined}
                muted
                src={`${pathModule.dirname(path)}/${encodeURIComponent(pathModule.basename(path))}`}
                width={videoWidth}
                height={videoHeight}
                onDurationChange={e => this.onDurationChange(e.target.duration)}
                onTimeUpdate={e => this.updatePositionFromTime(e.target.currentTime)}
                onLoadedData={this.onLoadedData}
                onError={this.onVideoError}
              >
                <track kind="captions" />
              </video>
            </>
          )}
          <canvas
            ref={el => {
              this.opencvVideoPlayerCanvasRef = el;
            }}
          />
          <div id="currentTimeDisplay" className={`${styles.frameNumberOrTimeCode} ${styles.moveToMiddle}`}>
            {currentFrame}
          </div>
        </div>
        <div className={`${styles.controlsWrapper}`}>
          <Timeline
            playHeadPositionPercSelection={playHeadPositionPercSelection}
            containerWidth={containerWidth}
            playHeadPositionPerc={playHeadPositionPerc}
            frameCount={frameCount}
            currentScene={currentScene}
            sheetType={sheetType}
            updateTimeFromPosition={this.updateTimeFromPosition}
            updateTimeFromPositionSelection={this.updateTimeFromPositionSelection}
            lowestFrame={sheetType === SHEET_TYPE.SCENES ? getLowestFrameFromScenes(scenes) : getLowestFrame(thumbs)}
            highestFrame={sheetType === SHEET_TYPE.SCENES ? getHighestFrameFromScenes(scenes) : getHighestFrame(thumbs)}
          />
          {(sheetType === SHEET_TYPE.SCENES || defaultSheetView === SHEET_VIEW.GRIDVIEW) && (
            <div className={`${styles.buttonWrapper}`}>
              {sheetType === SHEET_TYPE.SCENES && (
                <Popup
                  trigger={
                    <button
                      type="button"
                      className={`${styles.hoverButton} ${styles.textButton} ${styles.changeModeButton}`}
                      onClick={e => this.setOrToggleDefaultSheetViewWithStop(e)}
                      onMouseOver={over}
                      onMouseLeave={out}
                      onFocus={over}
                      onBlur={out}
                    >
                      {defaultSheetView === SHEET_VIEW.TIMELINEVIEW ? 'thumb mode' : 'cut mode'}
                    </button>
                  }
                  mouseEnterDelay={1000}
                  on={['hover']}
                  position="bottom center"
                  className={stylesPop.popup}
                  content={
                    <span>
                      Switch between cut/merge shots and change thumb mode <mark>SPACE</mark>
                    </span>
                  }
                />
              )}
              {defaultSheetView === SHEET_VIEW.TIMELINEVIEW && (
                <Popup
                  trigger={
                    <button
                      type="button"
                      className={`${styles.hoverButton} ${styles.textButton} ${styles.previousScene}`}
                      onClick={e => this.onNextSceneClickWithStop(e, 'back', currentFrame)}
                      onMouseOver={over}
                      onMouseLeave={out}
                      onFocus={over}
                      onBlur={out}
                    >
                      previous cut
                    </button>
                  }
                  mouseEnterDelay={1000}
                  on={['hover']}
                  position="bottom center"
                  className={stylesPop.popup}
                  content={
                    <span>
                      Jump to previous cut <mark>SHIFT + ALT + Arrow left</mark>
                    </span>
                  }
                />
              )}
              {defaultSheetView === SHEET_VIEW.GRIDVIEW && (
                <Popup
                  trigger={
                    <button
                      type="button"
                      className={`${styles.hoverButton} ${styles.textButton} ${styles.previousScene}`}
                      onClick={e => this.onNextThumbClickWithStop(e, 'back', currentFrame)}
                      onMouseOver={over}
                      onMouseLeave={out}
                      onFocus={over}
                      onBlur={out}
                    >
                      previous thumb
                    </button>
                  }
                  mouseEnterDelay={1000}
                  on={['hover']}
                  position="bottom center"
                  className={stylesPop.popup}
                  content={
                    <span>
                      Jump to previous thumb <mark>SHIFT + ALT + Arrow left</mark>
                    </span>
                  }
                />
              )}
              <Popup
                trigger={
                  <button
                    type="button"
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.hundredFramesBack}`}
                    onClick={e => this.onBackForwardClick(e, -100)}
                    onMouseOver={over}
                    onMouseLeave={out}
                    onFocus={over}
                    onBlur={out}
                  >
                    {'<<<'}
                  </button>
                }
                mouseEnterDelay={1000}
                on={['hover']}
                position="bottom center"
                className={stylesPop.popup}
                content={
                  <span>
                    Move 100 frames back <mark>ALT + Arrow left</mark>
                  </span>
                }
              />
              <Popup
                trigger={
                  <button
                    type="button"
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.tenFramesBack}`}
                    onClick={e => this.onBackForwardClick(e, -10)}
                    onMouseOver={over}
                    onMouseLeave={out}
                    onFocus={over}
                    onBlur={out}
                  >
                    {'<<'}
                  </button>
                }
                mouseEnterDelay={1000}
                on={['hover']}
                position="bottom center"
                className={stylesPop.popup}
                content={
                  <span>
                    Move 10 frames back <mark>Arrow left</mark>
                  </span>
                }
              />
              <Popup
                trigger={
                  <button
                    type="button"
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.oneFrameBack}`}
                    onClick={e => this.onBackForwardClick(e, -1)}
                    onMouseOver={over}
                    onMouseLeave={out}
                    onFocus={over}
                    onBlur={out}
                  >
                    {'<'}
                  </button>
                }
                mouseEnterDelay={1000}
                on={['hover']}
                position="bottom center"
                className={stylesPop.popup}
                content={
                  <span>
                    Move 1 frame back <mark>SHIFT + Arrow left</mark>
                  </span>
                }
              />
              {sheetType === SHEET_TYPE.SCENES && defaultSheetView === SHEET_VIEW.TIMELINEVIEW && currentFrame !== 0 && (
                <Popup
                  trigger={
                    <button
                      type="button"
                      className={`${styles.hoverButton} ${styles.textButton} ${styles.cutMergeButton}`}
                      onClick={
                        thisFrameIsACut
                          ? e => this.onMergeSceneClickWithStop(e, currentFrame)
                          : e => this.onCutSceneClickWithStop(e, currentFrame)
                      }
                      onMouseOver={over}
                      onMouseLeave={out}
                      onFocus={over}
                      onBlur={out}
                      style={{
                        color: MOVIEPRINT_COLORS[0],
                      }}
                    >
                      {thisFrameIsACut ? 'MERGE' : 'CUT'}
                    </button>
                  }
                  mouseEnterDelay={1000}
                  on={['hover']}
                  position="bottom center"
                  className={stylesPop.popup}
                  content={
                    thisFrameIsACut ? (
                      <span>
                        Merge scenes <mark>ENTER</mark>
                      </span>
                    ) : (
                      <span>
                        Cut scene <mark>ENTER</mark>
                      </span>
                    )
                  }
                />
              )}
              {sheetType === SHEET_TYPE.SCENES && defaultSheetView === SHEET_VIEW.GRIDVIEW && currentFrame !== 0 && (
                <Popup
                  trigger={
                    <button
                      type="button"
                      className={`${styles.hoverButton} ${styles.textButton} ${styles.cutMergeButton}`}
                      onClick={this.onChangeThumbClick}
                      onMouseOver={over}
                      onMouseLeave={out}
                      onFocus={over}
                      onBlur={out}
                      style={{
                        color: MOVIEPRINT_COLORS[0],
                      }}
                    >
                      CHANGE
                    </button>
                  }
                  mouseEnterDelay={1000}
                  on={['hover']}
                  position="bottom center"
                  className={stylesPop.popup}
                  content={
                    <span>
                      Change the thumb to use this frame <mark>ENTER</mark>
                    </span>
                  }
                />
              )}
              {sheetType === SHEET_TYPE.INTERVAL && (
                <Popup
                  trigger={
                    <button
                      type="button"
                      className={`${styles.hoverButton} ${styles.textButton} ${styles.cutMergeButton}`}
                      onClick={this.onChangeOrAddClick}
                      onMouseOver={over}
                      onMouseLeave={out}
                      onFocus={over}
                      onBlur={out}
                      style={{
                        color: MOVIEPRINT_COLORS[0],
                      }}
                    >
                      {keyObject.altKey ? 'ADD AFTER' : keyObject.shiftKey ? 'ADD BEFORE' : 'CHANGE'}
                    </button>
                  }
                  mouseEnterDelay={1000}
                  on={['hover']}
                  position="bottom center"
                  className={stylesPop.popup}
                  content={
                    keyObject.altKey ? (
                      <span>
                        Add a new thumb <mark>after</mark> selection
                      </span>
                    ) : keyObject.shiftKey ? (
                      <span>
                        Add a new thumb <mark>before</mark> selection
                      </span>
                    ) : (
                      <span>
                        Change the thumb to use this frame <mark>ENTER</mark> | with <mark>SHIFT</mark> add a thumb
                        before selection | with <mark>ALT</mark> add a thumb after selection
                      </span>
                    )
                  }
                />
              )}
              <Popup
                trigger={
                  <button
                    type="button"
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.oneFrameForward}`}
                    onClick={e => this.onBackForwardClick(e, 1)}
                    onMouseOver={over}
                    onMouseLeave={out}
                    onFocus={over}
                    onBlur={out}
                  >
                    {'>'}
                  </button>
                }
                mouseEnterDelay={1000}
                on={['hover']}
                position="bottom center"
                className={stylesPop.popup}
                content={
                  <span>
                    Move 1 frame forward <mark>SHIFT + Arrow right</mark>
                  </span>
                }
              />
              <Popup
                trigger={
                  <button
                    type="button"
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.tenFramesForward}`}
                    onClick={e => this.onBackForwardClick(e, 10)}
                    onMouseOver={over}
                    onMouseLeave={out}
                    onFocus={over}
                    onBlur={out}
                  >
                    {'>>'}
                  </button>
                }
                mouseEnterDelay={1000}
                on={['hover']}
                position="bottom center"
                className={stylesPop.popup}
                content={
                  <span>
                    Move 10 frames forward<mark>Arrow right</mark>
                  </span>
                }
              />
              <Popup
                trigger={
                  <button
                    type="button"
                    className={`${styles.hoverButton} ${styles.textButton} ${styles.hundredFramesForward}`}
                    onClick={e => this.onBackForwardClick(e, 100)}
                    onMouseOver={over}
                    onMouseLeave={out}
                    onFocus={over}
                    onBlur={out}
                  >
                    {'>>>'}
                  </button>
                }
                mouseEnterDelay={1000}
                on={['hover']}
                position="bottom center"
                className={stylesPop.popup}
                content={
                  <span>
                    Move 100 frames forward <mark>ALT + Arrow right</mark>
                  </span>
                }
              />
              {defaultSheetView === SHEET_VIEW.GRIDVIEW && (
                <Popup
                  trigger={
                    <button
                      type="button"
                      className={`${styles.hoverButton} ${styles.textButton} ${styles.nextScene}`}
                      onClick={e => this.onNextThumbClickWithStop(e, 'forward', currentFrame)}
                      onMouseOver={over}
                      onMouseLeave={out}
                      onFocus={over}
                      onBlur={out}
                    >
                      next thumb
                    </button>
                  }
                  mouseEnterDelay={1000}
                  on={['hover']}
                  position="bottom center"
                  className={stylesPop.popup}
                  content={
                    <span>
                      Jump to next thumb <mark>SHIFT + ALT + Arrow right</mark>
                    </span>
                  }
                />
              )}
              {defaultSheetView === SHEET_VIEW.TIMELINEVIEW && (
                <Popup
                  trigger={
                    <button
                      type="button"
                      className={`${styles.hoverButton} ${styles.textButton} ${styles.nextScene}`}
                      onClick={e => this.onNextSceneClickWithStop(e, 'forward', currentFrame)}
                      onMouseOver={over}
                      onMouseLeave={out}
                      onFocus={over}
                      onBlur={out}
                    >
                      next cut
                    </button>
                  }
                  mouseEnterDelay={1000}
                  on={['hover']}
                  position="bottom center"
                  className={stylesPop.popup}
                  content={
                    <span>
                      Jump to next cut <mark>SHIFT + ALT + Arrow right</mark>
                    </span>
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

VideoPlayer.contextTypes = {
  thumbId: PropTypes.number,
  positionRatio: PropTypes.number,
  setNewFrame: PropTypes.func,
  closeModal: PropTypes.func,
};

VideoPlayer.defaultProps = {
  file: {
    id: undefined,
    width: 640,
    height: 360,
    columnCount: 4,
    frameCount: 16,
    fps: 25,
    path: '',
  },
  height: 360,
  width: 640,
  thumbs: undefined,
  scenes: [],
  allScenes: [],
};

VideoPlayer.propTypes = {
  aspectRatioInv: PropTypes.number.isRequired,
  selectedThumb: PropTypes.shape({
    thumbId: PropTypes.string,
  }),
  file: PropTypes.shape({
    id: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    columnCount: PropTypes.number,
    frameCount: PropTypes.number,
    fps: PropTypes.number,
    path: PropTypes.string,
    useRatio: PropTypes.bool,
  }),
  height: PropTypes.number,
  setOrToggleDefaultSheetView: PropTypes.func.isRequired,
  defaultSheetView: PropTypes.string,
  sheetType: PropTypes.string,
  jumpToFrameNumber: PropTypes.number,
  onChangeThumb: PropTypes.func.isRequired,
  onMergeSceneClick: PropTypes.func.isRequired,
  onCutSceneClick: PropTypes.func.isRequired,
  onSelectThumbMethod: PropTypes.func.isRequired,
  containerWidth: PropTypes.number.isRequired,
  width: PropTypes.number,
  scenes: PropTypes.array,
  allScenes: PropTypes.array,
  thumbs: PropTypes.array,
};

export default VideoPlayer;
