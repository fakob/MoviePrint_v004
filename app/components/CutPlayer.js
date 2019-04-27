/* eslint no-param-reassign: "error" */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Popup } from 'semantic-ui-react';
import uuidV4 from 'uuid/v4';
import log from 'electron-log';
import { changeThumb, addIntervalSheet, addThumb } from '../actions';
import VideoCaptureProperties from '../utils/videoCaptureProperties';
import {
  MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE,
  MOVIEPRINT_COLORS,
  CUTPLAYER_SLICE_ARRAY_SIZE,
  CHANGE_THUMB_STEP,
} from '../utils/constants';
import {
  frameCountToTimeCode,
  getHighestFrame,
  getLowestFrame,
  getSceneFromFrameNumber,
  getSliceWidthArrayForCut,
  getVisibleThumbs,
  limitRange,
  mapRange,
  setPosition,
} from '../utils/utils';
import styles from './VideoPlayer.css';
import stylesPop from './Popup.css';

const pathModule = require('path');
const opencv = require('opencv4nodejs');

class CutPlayer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentFrame: 0, // in frames
      currentScene: {
        start: 0,
        length: 0
      }, // in frames
      videoHeight: 360,
      playHeadPosition: 0, // in pixel
      mouseStartDragInsideTimeline: false,
      showPlaybar: false,
    };

    // this.onSaveThumbClick = this.onSaveThumbClick.bind(this);

    this.handleKeyPress = this.handleKeyPress.bind(this);

    this.getCurrentFrameNumber = this.getCurrentFrameNumber.bind(this);
    this.onBackForwardClick = this.onBackForwardClick.bind(this);
    this.updateOpencvVideoCanvas = this.updateOpencvVideoCanvas.bind(this);
    this.updatePositionWithStep = this.updatePositionWithStep.bind(this);
    this.onDurationChange = this.onDurationChange.bind(this);
    this.updateTimeFromFrameNumber = this.updateTimeFromFrameNumber.bind(this);
    this.updatePositionFromFrame = this.updatePositionFromFrame.bind(this);

    this.onTimelineClick = this.onTimelineClick.bind(this);
    this.onTimelineDrag = this.onTimelineDrag.bind(this);
    this.onTimelineDragStop = this.onTimelineDragStop.bind(this);
    this.onTimelineMouseOver = this.onTimelineMouseOver.bind(this);
    this.onTimelineExit = this.onTimelineExit.bind(this);
    this.onNextSceneClickWithStop = this.onNextSceneClickWithStop.bind(this);
  }

  componentWillMount() {
    const { height, controllerHeight } = this.props;
    const videoHeight = parseInt(height - controllerHeight, 10);
    this.setState({
      videoHeight,
    });
  }

  componentDidMount() {
    const { jumpToFrameNumber, scenes } = this.props;
    if (jumpToFrameNumber !== undefined) {
      this.updateTimeFromFrameNumber(jumpToFrameNumber);
    }
    document.addEventListener('keydown', this.handleKeyPress);
  }

  componentDidUpdate(prevProps, prevState) {
    const { aspectRatioInv, controllerHeight, file, height, jumpToFrameNumber, opencvVideo, scenes, width} = this.props;
    const { currentFrame, videoHeight } = this.state;

    // update videoHeight if window size changed
    if (
      prevProps.aspectRatioInv !== aspectRatioInv ||
      prevProps.height !== height ||
      prevProps.width !== width
    ) {
      const videoHeight = parseInt(height - controllerHeight, 10);
      this.setState({
        videoHeight,
      });
    }

    if (jumpToFrameNumber !== undefined) {
      if (prevProps.jumpToFrameNumber !== jumpToFrameNumber) {
        this.updateTimeFromFrameNumber(jumpToFrameNumber);
      }
    }

    if (
      prevProps.scenes.length !== scenes.length ||
      prevProps.opencvVideo.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) !== opencvVideo.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT) ||
      prevState.videoHeight !== videoHeight
    ) {
      this.updateTimeFromFrameNumber(currentFrame);
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
  }

  handleKeyPress(event) {
    // you may also add a filter here to skip keys, that do not have an effect for your app
    // this.props.keyPressAction(event.keyCode);

    const { arrayOfCuts, onMergeSceneClick, onCutSceneClick } = this.props;
    const { currentFrame } = this.state;
    const thisFrameIsACut = arrayOfCuts.some(item => item === currentFrame);

    // only listen to key events when feedback form is not shown
    if (event.target.tagName !== 'INPUT') {
      let stepValue = 1;
      const [stepValue0, stepValue1, stepValue2] = CHANGE_THUMB_STEP;
      if (event) {
        switch (event.which) {
          case 13: // press enter
          if (thisFrameIsACut) {
            onMergeSceneClick(currentFrame);
          } else {
            onCutSceneClick(currentFrame);
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
              this.onNextSceneClickWithStop('back', currentFrame);
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
              this.onNextSceneClickWithStop('forward', currentFrame);
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
    let newFrameNumber;
    newFrameNumber = this.state.currentFrame;
    return newFrameNumber
  }

  onBackForwardClick(step) {
    this.updatePositionWithStep(step);
  }

  onDurationChange(duration) {
    // setState is asynchronious
    // updatePosition needs to wait for setState, therefore it is put into callback of setState
    this.setState({ duration }, () => {
      this.updateTimeFromPosition(this.state.playHeadPosition);
    });
  }

  updateOpencvVideoCanvas(currentFrame) {
    const { arrayOfCuts, containerWidth, file, opencvVideo } = this.props;
    const { frameCount } = file;
    // offset currentFrame due to main frame is in middle of sliceArraySize
    const halfArraySize = Math.floor(CUTPLAYER_SLICE_ARRAY_SIZE / 2);
    const offsetFrameNumber = currentFrame - parseInt(halfArraySize, 10);

    const { videoHeight } = this.state
    const vid = opencvVideo;
    setPosition(vid, offsetFrameNumber, file.useRatio);
    const ctx = this.opencvCutPlayerCanvasRef.getContext('2d');
    const length = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT);
    const height = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT);
    const width = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH);
    const rescaleFactor = videoHeight / height;
    const sliceWidthArray = getSliceWidthArrayForCut(containerWidth, CUTPLAYER_SLICE_ARRAY_SIZE);
    const sliceGap = 1;
    const cutGap = 8;
    this.opencvCutPlayerCanvasRef.height = videoHeight;
    this.opencvCutPlayerCanvasRef.width = containerWidth;
    let canvasXPos = 0;

    for (let i = 0; i < CUTPLAYER_SLICE_ARRAY_SIZE; i += 1) {
      const frame = vid.read();
      const sliceWidth = sliceWidthArray[i];
      const sliceXPos = Math.max(Math.floor((width * rescaleFactor) / 2) - Math.floor(sliceWidth / 2), 0);
      const thisFrameIsACut = arrayOfCuts.some(item => item === offsetFrameNumber + i + 1);

      if ((offsetFrameNumber + i) >= 0 && !frame.empty) {
        const matResized = frame.rescale(rescaleFactor);
        const matCropped = matResized.getRegion(new opencv.Rect(sliceXPos, 0, sliceWidth, videoHeight));

        const matRGBA = matResized.channels === 1 ?
          matCropped.cvtColor(opencv.COLOR_GRAY2RGBA) :
          matCropped.cvtColor(opencv.COLOR_BGR2RGBA);

        const imgData = new ImageData(
          new Uint8ClampedArray(matRGBA.getData()),
          matCropped.cols,
          matCropped.rows
        );
        ctx.putImageData(imgData, canvasXPos, 0);
      } else {
        console.log('frame empty')
      }
      canvasXPos += sliceWidthArray[i] + (thisFrameIsACut ? cutGap : sliceGap);
    }
  }

  updatePositionWithStep(step) {
    const { file } = this.props;
    const currentFramePlusStep = limitRange(this.getCurrentFrameNumber() + step, 0, file.frameCount - 1);
    this.updatePositionFromFrame(currentFramePlusStep);
    this.updateOpencvVideoCanvas(currentFramePlusStep);
  }

  updatePositionFromFrame(currentFrame) {
    const { containerWidth, file, scenes, onSelectThumbMethod } = this.props;
    const { currentScene } = this.state;

    if (currentFrame !== undefined) {
      const newScene = getSceneFromFrameNumber(scenes, currentFrame);
      if (currentScene === undefined || currentScene.sceneId !== newScene.sceneId) {
        this.setState({
          currentScene: newScene,
        });
        onSelectThumbMethod(newScene.sceneId); // call to update selection when scrubbing
      }
      const xPos = mapRange(
        currentFrame,
        0, (file.frameCount - 1),
        0, containerWidth, false
      );
      this.setState({
        currentFrame,
        playHeadPosition: xPos,
      });
    }
  }

  updateTimeFromFrameNumber(currentFrame) {
    const { containerWidth, file, scenes } = this.props;
    const { frameCount } = file;
    let xPos = 0;
    xPos = mapRange(currentFrame, 0, frameCount - 1, 0, containerWidth, false);
    const currentScene = getSceneFromFrameNumber(scenes, currentFrame);
    this.setState({
      playHeadPosition: xPos,
      currentFrame,
      currentScene,
    });
    this.updateOpencvVideoCanvas(currentFrame);
  }

  updateTimeFromPosition(xPos) {
    const { containerWidth, file, scenes, onSelectThumbMethod } = this.props;
    const { currentScene } = this.state;

    if (xPos !== undefined) {
      this.setState({ playHeadPosition: xPos });
      const { frameCount } = file;
      const currentFrame = mapRange(xPos, 0, containerWidth, 0, frameCount - 1);
      const newScene = getSceneFromFrameNumber(scenes, currentFrame);
      if (currentScene.sceneId !== newScene.sceneId) {
        this.setState({
          currentScene: newScene,
        });
        onSelectThumbMethod(newScene.sceneId); // call to update selection when scrubbing
      }
      this.setState({
        currentFrame,
      });
      this.updateOpencvVideoCanvas(currentFrame);
    }
  }

  onTimelineClick(e) {
    const bounds = this.timeLine.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    this.updateTimeFromPosition(x);
  }

  onTimelineDrag() {
    this.setState({ mouseStartDragInsideTimeline: true });
  }

  onTimelineMouseOver(e) {
    if (this.state.mouseStartDragInsideTimeline) { // check if dragging over timeline
      const bounds = this.timeLine.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      this.updateTimeFromPosition(x);
    }
  }

  onTimelineDragStop() {
    this.setState({ mouseStartDragInsideTimeline: false });
  }

  onTimelineExit() {
    if (this.state.mouseStartDragInsideTimeline) {
      this.setState({ mouseStartDragInsideTimeline: false });
    }
  }

  onNextSceneClickWithStop(direction, frameNumber) {
    const { currentScene } = this.state;
    const { file, onSelectThumbMethod, scenes } = this.props;

    let newFrameNumberToJumpTo;
    let newSceneToSelect;
    // if going back and frameNumber is within the scene not at the cut
    // then just update position else jumpToScene
    if (direction === 'back' && frameNumber !== currentScene.start) {
      newFrameNumberToJumpTo = currentScene.start;
    } else {
      if (direction === 'back') {
        newSceneToSelect = getSceneFromFrameNumber(scenes, currentScene.start - 1);
        newFrameNumberToJumpTo = newSceneToSelect.start;
      } else if (direction === 'forward') {
        newFrameNumberToJumpTo = currentScene.start + currentScene.length;
        newSceneToSelect = getSceneFromFrameNumber(scenes, newFrameNumberToJumpTo);
      }
      onSelectThumbMethod(newSceneToSelect.sceneId); // call to update selection
    }
    newFrameNumberToJumpTo = limitRange(newFrameNumberToJumpTo, 0, file.frameCount - 1);
    this.updatePositionFromFrame(newFrameNumberToJumpTo);
    this.updateOpencvVideoCanvas(newFrameNumberToJumpTo);
  }

  render() {
    const { currentFrame, currentScene, playHeadPosition } = this.state;
    const { arrayOfCuts, containerWidth, file, scaleValueObject, thumbs } = this.props;
    const { videoHeight } = this.state;

    function over(event) {
      event.target.style.opacity = 1;
    }

    function out(event) {
      event.target.style.opacity = 0.5;
    }

    const inPoint = currentScene !== undefined ? currentScene.start : 0;
    const outPoint = currentScene !== undefined ? currentScene.start + currentScene.length : 0;
    const inPointPositionOnTimeline =
      ((containerWidth * 1.0) / file.frameCount) * inPoint;
    const outPointPositionOnTimeline =
      ((containerWidth * 1.0) / file.frameCount) * outPoint;
    const cutWidthOnTimeLine = Math.max(
      outPointPositionOnTimeline - inPointPositionOnTimeline,
      MINIMUM_WIDTH_OF_CUTWIDTH_ON_TIMELINE
    );

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
                className={`${styles.hoverButton} ${styles.textButton} ${styles.backButton}`}
                onClick={this.props.onThumbDoubleClick}
                onMouseOver={over}
                onMouseLeave={out}
                onFocus={over}
                onBlur={out}
              >
                BACK
              </button>
            }
            className={stylesPop.popup}
            content="Back to MoviePrint view"
          />
            <canvas ref={(el) => { this.opencvCutPlayerCanvasRef = el; }} />
          <div
            id="currentTimeDisplay"
            className={`${styles.frameNumberOrTimeCode} ${styles.moveToMiddle}`}
          >
            {/*frameCountToTimeCode(this.state.currentFrame, this.props.file.fps)*/}
            {this.state.currentFrame}
          </div>
        </div>
        <div className={`${styles.controlsWrapper}`}>
          <div
            id="timeLine"
            className={`${styles.timelineWrapper}`}
            onClick={this.onTimelineClick}
            onMouseDown={this.onTimelineDrag}
            onMouseUp={this.onTimelineDragStop}
            onMouseMove={this.onTimelineMouseOver}
            onMouseLeave={this.onTimelineExit}
            ref={(el) => { this.timeLine = el; }}
          >
            <div
              className={`${styles.timelinePlayhead}`}
              style={{
                left: Number.isNaN(playHeadPosition) ? 0 : playHeadPosition,
              }}
            />
            <div
              className={`${styles.timelineCut}`}
              style={{
                left: Number.isNaN(inPointPositionOnTimeline) ? 0 : inPointPositionOnTimeline,
                width: Number.isNaN(cutWidthOnTimeLine) ? 0 : cutWidthOnTimeLine,
              }}
            />
          </div>
          <div className={`${styles.buttonWrapper}`}>
            <Popup
              trigger={
                <button
                  type='button'
                  className={`${styles.hoverButton} ${styles.textButton} ${styles.previousScene}`}
                  onClick={() => this.onNextSceneClickWithStop('back', this.state.currentFrame)}
                  onMouseOver={over}
                  onMouseLeave={out}
                  onFocus={over}
                  onBlur={out}
                >
                  previous scene
                </button>
              }
              className={stylesPop.popup}
              content={<span>Jump to previous scene cut <mark>SHIFT + ALT + Arrow left</mark></span>}
            />
            <Popup
              trigger={
                <button
                  type='button'
                  className={`${styles.hoverButton} ${styles.textButton} ${styles.hundredFramesBack}`}
                  onClick={() => this.onBackForwardClick(-100)}
                  onMouseOver={over}
                  onMouseLeave={out}
                  onFocus={over}
                  onBlur={out}
                >
                  {'<<<'}
                </button>
              }
              className={stylesPop.popup}
              content={<span>Move 100 frames back <mark>ALT + Arrow left</mark></span>}
            />
            <Popup
              trigger={
                <button
                  type='button'
                  className={`${styles.hoverButton} ${styles.textButton} ${styles.tenFramesBack}`}
                  onClick={() => this.onBackForwardClick(-10)}
                  onMouseOver={over}
                  onMouseLeave={out}
                  onFocus={over}
                  onBlur={out}
                >
                  {'<<'}
                </button>
              }
              className={stylesPop.popup}
              content={<span>Move 10 frames back <mark>Arrow left</mark></span>}
            />
            <Popup
              trigger={
                <button
                  type='button'
                  className={`${styles.hoverButton} ${styles.textButton} ${styles.oneFrameBack}`}
                  onClick={() => this.onBackForwardClick(-1)}
                  onMouseOver={over}
                  onMouseLeave={out}
                  onFocus={over}
                  onBlur={out}
                >
                  {'<'}
                </button>
              }
              className={stylesPop.popup}
              content={<span>Move 1 frame back <mark>SHIFT + Arrow left</mark></span>}
            />
            {currentFrame !== 0 && <Popup
              trigger={
                <button
                  type='button'
                  className={`${styles.hoverButton} ${styles.textButton}`}
                  onClick={thisFrameIsACut ?
                    () => this.props.onMergeSceneClick(currentFrame) :
                    () => this.props.onCutSceneClick(currentFrame)}
                  onMouseOver={over}
                  onMouseLeave={out}
                  onFocus={over}
                  onBlur={out}
                  style={{
                    display: 'block',
                    transformOrigin: 'center bottom',
                    transform: 'translateX(-50%)',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    color: MOVIEPRINT_COLORS[0]
                  }}
                >
                  {thisFrameIsACut ? 'MERGE' : 'CUT'}
                </button>
              }
              className={stylesPop.popup}
              content={thisFrameIsACut ? (<span>Merge scenes</span>) : (<span>Cut scene</span>)}
            />}
            <Popup
              trigger={
                <button
                  type='button'
                  className={`${styles.hoverButton} ${styles.textButton} ${styles.oneFrameForward}`}
                  onClick={() => this.onBackForwardClick(1)}
                  onMouseOver={over}
                  onMouseLeave={out}
                  onFocus={over}
                  onBlur={out}
                >
                  {'>'}
                </button>
              }
              className={stylesPop.popup}
              content={<span>Move 1 frame forward <mark>SHIFT + Arrow right</mark></span>}
            />
            <Popup
              trigger={
                <button
                  type='button'
                  className={`${styles.hoverButton} ${styles.textButton} ${styles.tenFramesForward}`}
                  onClick={() => this.onBackForwardClick(10)}
                  onMouseOver={over}
                  onMouseLeave={out}
                  onFocus={over}
                  onBlur={out}
                >
                  {'>>'}
                </button>
              }
              className={stylesPop.popup}
              content={<span>Move 10 frames forward<mark>Arrow right</mark></span>}
            />
            <Popup
              trigger={
                <button
                  type='button'
                  className={`${styles.hoverButton} ${styles.textButton} ${styles.hundredFramesForward}`}
                  onClick={() => this.onBackForwardClick(100)}
                  onMouseOver={over}
                  onMouseLeave={out}
                  onFocus={over}
                  onBlur={out}
                >
                  {'>>>'}
                </button>
              }
              className={stylesPop.popup}
              content={<span>Move 100 frames forward <mark>ALT + Arrow right</mark></span>}
            />
            <Popup
              trigger={
                <button
                  type='button'
                  className={`${styles.hoverButton} ${styles.textButton} ${styles.nextScene}`}
                  onClick={() => this.onNextSceneClickWithStop('forward', this.state.currentFrame)}
                  onMouseOver={over}
                  onMouseLeave={out}
                  onFocus={over}
                  onBlur={out}
                >
                  next scene
                </button>
              }
              className={stylesPop.popup}
              content={<span>Jump to next scene cut <mark>SHIFT + ALT + Arrow right</mark></span>}
            />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { visibilitySettings } = state;
  const { settings, sheetsByFileId } = state.undoGroup.present;
  const { currentFileId } = settings;

  const allThumbs = (sheetsByFileId[currentFileId] === undefined ||
    sheetsByFileId[currentFileId][settings.currentSheetId] === undefined)
    ? undefined : sheetsByFileId[currentFileId][settings.currentSheetId].thumbsArray;
  return {
    thumbs: getVisibleThumbs(
      allThumbs,
      visibilitySettings.visibilityFilter
    ),
    settings,
    visibilitySettings
  };
};

CutPlayer.contextTypes = {
  store: PropTypes.object,
  thumbId: PropTypes.number,
  positionRatio: PropTypes.number,
  setNewFrame: PropTypes.func,
  closeModal: PropTypes.func,
};

CutPlayer.defaultProps = {
  // currentFileId: undefined,
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
  frameNumber: 0,
};

CutPlayer.propTypes = {
  aspectRatioInv: PropTypes.number.isRequired,
  controllerHeight: PropTypes.number.isRequired,
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
  frameNumber: PropTypes.number,
  onThumbDoubleClick: PropTypes.func.isRequired,
  onCutThumbClick: PropTypes.func.isRequired,
  onMergeSceneClick: PropTypes.func.isRequired,
  onCutSceneClick: PropTypes.func.isRequired,
  onSelectThumbMethod: PropTypes.func.isRequired,
  width: PropTypes.number,
  // settings: PropTypes.object.isRequired,
  thumbs: PropTypes.array,
  // sheetsByFileId: PropTypes.object,
  // visibilitySettings: PropTypes.object.isRequired,
};

export default connect(mapStateToProps)(CutPlayer);
